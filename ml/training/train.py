import os
import sys
import json
import yaml
import time
import logging
import argparse
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Setup Path Resolution
BASE_DIR = Path(__file__).resolve().parent
ML_DIR = BASE_DIR.parent
ROOT_DIR = ML_DIR.parent

CONFIG_PATH = BASE_DIR / "config.yaml"
OUTPUT_DIR = ML_DIR / "output"
LOG_DIR = ML_DIR / "logs"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
LOG_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH_PTH = OUTPUT_DIR / "final_plant_model.pth"
CLASSES_PATH = OUTPUT_DIR / "classes.json"
HISTORY_PATH = OUTPUT_DIR / "training_history.json"

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("PlantAITrainEngine")


def is_class_directory(path: Path) -> bool:
    """Checks if a directory contains image class subdirectories."""
    if not path.exists() or not path.is_dir():
        return False
    subdirs = [d for d in path.iterdir() if d.is_dir() and not d.name.startswith(".")]
    if subdirs and not any(s.name.lower() in ["train", "valid", "val", "test", "__pycache__"] for s in subdirs):
        return True
    return False


def resolve_dataset_paths(ml_dir: Path, root_dir: Path):
    """
    Locates training and validation dataset paths recursively inside ml/dataset or workspace.
    Returns (train_path, val_path). val_path can be None if separate validation folder is not found.
    """
    candidate_roots = [
        ml_dir / "dataset",
        ml_dir / "PlantVillage",
        root_dir / "dataset",
    ]

    # Search for 'train' / 'valid' subdirectories recursively
    for root in candidate_roots:
        if not root.exists():
            continue

        train_candidates = list(root.glob("**/train")) + list(root.glob("**/training"))
        for t_dir in train_candidates:
            if is_class_directory(t_dir):
                parent = t_dir.parent
                val_dir = None
                for val_name in ["valid", "val", "validation", "Validation", "Valid"]:
                    v_cand = parent / val_name
                    if v_cand.exists() and is_class_directory(v_cand):
                        val_dir = v_cand
                        break
                return t_dir, val_dir

        if is_class_directory(root):
            return root, None

        for child in root.rglob("*"):
            if child.is_dir() and is_class_directory(child) and child.name.lower() not in ["train", "valid", "val", "test", "__pycache__"]:
                return child, None

    return None, None


from torch.utils.data import Dataset, Subset

class TransformedSubset(Dataset):
    def __init__(self, subset, transform):
        self.subset = subset
        self.transform = transform

    def __getitem__(self, index):
        x, y = self.subset[index]
        if self.transform:
            x = self.transform(x)
        return x, y

    def __len__(self):
        return len(self.subset)


def train_gpu(args=None):
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torchvision import datasets, transforms, models
    from torch.utils.data import DataLoader, random_split

    # Load Configuration from config.yaml
    config = {}
    if CONFIG_PATH.exists():
        with open(CONFIG_PATH, "r") as f:
            config = yaml.safe_load(f) or {}

    train_cfg = config.get("training", {})
    model_cfg = config.get("model", {})

    # Override config with CLI arguments if provided
    epochs_initial = train_cfg.get("epochs_initial", 8)
    epochs_fine_tune = train_cfg.get("epochs_fine_tune", 4)
    if args and args.epochs is not None:
        epochs_initial = max(1, int(args.epochs * 0.65))
        epochs_fine_tune = max(1, args.epochs - epochs_initial)

    batch_size = args.batch_size if args and args.batch_size is not None else train_cfg.get("batch_size", 32)
    lr_initial = args.lr if args and args.lr is not None else train_cfg.get("learning_rate_initial", 0.0003)
    lr_fine_tune = args.fine_tune_lr if args and getattr(args, "fine_tune_lr", None) is not None else train_cfg.get("learning_rate_fine_tune", 0.00003)
    weight_decay = train_cfg.get("weight_decay", 0.0001)
    label_smoothing = train_cfg.get("label_smoothing", 0.1)
    img_size = tuple(model_cfg.get("input_shape", [224, 224, 3])[:2])

    train_path, val_path = resolve_dataset_paths(ML_DIR, ROOT_DIR)

    if not train_path:
        logger.error(f"[ERROR] Dataset folder not found under {ML_DIR / 'dataset'}.")
        logger.error("Please place your dataset (with class folders or train/valid folders) inside ml/dataset.")
        return False

    logger.info("==================================================")
    logger.info("[PLANT-AI] HIGH ACCURACY & LOW LOSS TRAINING ENGINE")
    logger.info(f"[DATASET] Training Path: {train_path}")
    if val_path:
        logger.info(f"[DATASET] Validation Path: {val_path}")
    else:
        logger.info("[DATASET] Validation path not separate; using 80/20 train/val split.")
    logger.info("==================================================")

    # Check CUDA / GPU availability
    if torch.cuda.is_available():
        device = torch.device("cuda")
        gpu_name = torch.cuda.get_device_name(0)
        vram_mb = torch.cuda.get_device_properties(0).total_memory / (1024 ** 2)
        logger.info(f"[GPU] GPU Device: {gpu_name} ({vram_mb:.0f} MB VRAM)")
        torch.backends.cudnn.benchmark = True
    else:
        device = torch.device("cpu")
        logger.info("[WARNING] CUDA GPU unavailable. Training on CPU...")

    logger.info(f"[SETTINGS] Batch Size = {batch_size} | Image Size = {img_size}")
    logger.info(f"[SETTINGS] Stage 1 (Head Warmup): {epochs_initial} Epochs (LR: {lr_initial})")
    logger.info(f"[SETTINGS] Stage 2 (Fine-Tuning): {epochs_fine_tune} Epochs (LR: {lr_fine_tune})")

    # High-Performance Data Augmentation (Train vs Val Isolation)
    transform_train = transforms.Compose([
        transforms.Resize(img_size),
        transforms.RandomResizedCrop(img_size, scale=(0.75, 1.0)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(p=0.25),
        transforms.RandomRotation(25),
        transforms.ColorJitter(brightness=0.25, contrast=0.25, saturation=0.25),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    transform_val = transforms.Compose([
        transforms.Resize(img_size),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    if val_path:
        train_ds_raw = datasets.ImageFolder(root=str(train_path), transform=transform_train)
        val_ds = datasets.ImageFolder(root=str(val_path), transform=transform_val)
        train_ds = train_ds_raw
        class_names = train_ds_raw.classes
    else:
        raw_dataset = datasets.ImageFolder(root=str(train_path))
        class_names = raw_dataset.classes
        val_size = int(len(raw_dataset) * train_cfg.get("validation_split", 0.2))
        train_size = len(raw_dataset) - val_size
        train_sub, val_sub = random_split(raw_dataset, [train_size, val_size])
        train_ds = TransformedSubset(train_sub, transform_train)
        val_ds = TransformedSubset(val_sub, transform_val)

    # Fast subset mode if quick-test is enabled
    if args and args.quick_test:
        logger.info("[SETTINGS] [--quick-test] mode enabled: Limiting training samples for rapid testing.")
        subset_train_indices = list(range(min(2000, len(train_ds))))
        subset_val_indices = list(range(min(500, len(val_ds))))
        train_ds = Subset(train_ds, subset_train_indices)
        val_ds = Subset(val_ds, subset_val_indices)

    num_classes = len(class_names)
    logger.info(f"[DATASET] Training Samples: {len(train_ds)} | Validation Samples: {len(val_ds)}")
    logger.info(f"[DATASET] Total Disease Classes ({num_classes}): {class_names}")

    # Save Class Names Mapping
    with open(CLASSES_PATH, "w") as f:
        json.dump(class_names, f, indent=4)
    logger.info(f"[SAVED] Saved class mapping to {CLASSES_PATH}")

    # Configure Data Loaders (Multi-process prefetching to remove CPU bottleneck)
    num_workers = args.num_workers if args and getattr(args, "num_workers", None) is not None else train_cfg.get("num_workers", min(4, os.cpu_count() or 2))
    pin_mem = device.type == "cuda"
    persistent = (num_workers > 0)
    train_loader = DataLoader(
        train_ds, batch_size=batch_size, shuffle=True,
        num_workers=num_workers, pin_memory=pin_mem, persistent_workers=persistent
    )
    val_loader = DataLoader(
        val_ds, batch_size=batch_size, shuffle=False,
        num_workers=num_workers, pin_memory=pin_mem, persistent_workers=persistent
    )

    # Neural Network Model Initialization (MobileNetV3 Large)
    logger.info("Building MobileNetV3 Large Deep Neural Network Architecture...")
    model = models.mobilenet_v3_large(weights=models.MobileNet_V3_Large_Weights.DEFAULT)
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(in_features, num_classes)
    model = model.to(device)

    criterion = nn.CrossEntropyLoss(label_smoothing=label_smoothing)

    # Mixed Precision Scaler for GPU Speedup
    scaler = torch.amp.GradScaler("cuda", enabled=(device.type == "cuda"))

    if device.type == "cuda":
        torch.cuda.empty_cache()

    best_acc = 0.0
    history = []
    start_time = time.time()

    # ─────────────────────────────────────────────────────────────
    # STAGE 1: HEAD WARMUP (Freeze backbone, train classifier)
    # ─────────────────────────────────────────────────────────────
    logger.info(f"[STAGE 1] Freezing Backbone & Warmup Training ({epochs_initial} Epochs, LR: {lr_initial})...")
    for param in model.features.parameters():
        param.requires_grad = False

    optimizer = optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=lr_initial, weight_decay=weight_decay)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs_initial, eta_min=1e-5)

    total_epochs = epochs_initial + epochs_fine_tune
    log_freq = max(1, len(train_loader) // 20)

    for epoch in range(epochs_initial):
        epoch_start = time.time()
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        total_batches = len(train_loader)

        logger.info(f"--- Starting Stage 1 Epoch {epoch+1:02d}/{total_epochs:02d} ({total_batches} batches) ---")
        for step, (images, labels) in enumerate(train_loader, 1):
            images, labels = images.to(device, non_blocking=True), labels.to(device, non_blocking=True)
            optimizer.zero_grad()

            with torch.amp.autocast("cuda", enabled=(device.type == "cuda")):
                outputs = model(images)
                loss = criterion(outputs, labels)

            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()

            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct += torch.sum(preds == labels.data).item()
            total += labels.size(0)

            if step == 1 or step % log_freq == 0 or step == total_batches:
                curr_acc = (correct / max(1, total)) * 100.0
                curr_loss = running_loss / max(1, total)
                logger.info(
                    f"  [Stage 1] Epoch {epoch+1:02d}/{total_epochs:02d} | "
                    f"Batch {step:4d}/{total_batches} ({step/total_batches*100:5.1f}%) | "
                    f"Loss: {curr_loss:.4f} | Train Acc: {curr_acc:5.2f}%"
                )

        current_lr = optimizer.param_groups[0]["lr"]
        scheduler.step()
        epoch_loss = running_loss / max(1, total)
        epoch_acc = correct / max(1, total)

        # Validation Loop
        model.eval()
        val_correct = 0
        val_total = 0
        val_loss_sum = 0.0

        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device, non_blocking=True), labels.to(device, non_blocking=True)
                with torch.amp.autocast("cuda", enabled=(device.type == "cuda")):
                    outputs = model(images)
                    loss = criterion(outputs, labels)

                val_loss_sum += loss.item() * images.size(0)
                _, preds = torch.max(outputs, 1)
                val_correct += torch.sum(preds == labels.data).item()
                val_total += labels.size(0)

        val_acc = val_correct / max(1, val_total)
        val_loss = val_loss_sum / max(1, val_total)
        epoch_sec = time.time() - epoch_start

        epoch_metrics = {
            "epoch": epoch + 1,
            "stage": "warmup",
            "lr": round(current_lr, 6),
            "train_acc": round(epoch_acc * 100, 2),
            "train_loss": round(epoch_loss, 4),
            "val_acc": round(val_acc * 100, 2),
            "val_loss": round(val_loss, 4),
            "duration_sec": round(epoch_sec, 1)
        }
        history.append(epoch_metrics)

        logger.info(
            f"Epoch {epoch+1:02d}/{total_epochs:02d} [Stage 1 Finished in {epoch_sec:.1f}s] | LR: {current_lr:.6f} | "
            f"Train Acc: {epoch_acc*100:.2f}% (Loss: {epoch_loss:.4f}) | "
            f"Val Acc: {val_acc*100:.2f}% (Loss: {val_loss:.4f})"
        )

        if val_acc >= best_acc:
            best_acc = val_acc
            torch.save(model.state_dict(), str(MODEL_PATH_PTH))
            logger.info(f"[SAVED] New best model checkpoint ({best_acc*100:.2f}% val acc) -> {MODEL_PATH_PTH}")

    # ─────────────────────────────────────────────────────────────
    # STAGE 2: FULL FINE-TUNING (Unfreeze backbone, low learning rate)
    # ─────────────────────────────────────────────────────────────
    if epochs_fine_tune > 0:
        logger.info(f"[STAGE 2] Unfreezing Backbone & Fine-Tuning ({epochs_fine_tune} Epochs, LR: {lr_fine_tune})...")
        for param in model.features.parameters():
            param.requires_grad = True

        optimizer = optim.AdamW(model.parameters(), lr=lr_fine_tune, weight_decay=weight_decay)
        scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs_fine_tune, eta_min=1e-6)

        for epoch_idx in range(epochs_fine_tune):
            epoch = epochs_initial + epoch_idx
            epoch_start = time.time()
            model.train()
            running_loss = 0.0
            correct = 0
            total = 0
            total_batches = len(train_loader)

            logger.info(f"--- Starting Stage 2 Epoch {epoch+1:02d}/{total_epochs:02d} ({total_batches} batches) ---")
            for step, (images, labels) in enumerate(train_loader, 1):
                images, labels = images.to(device, non_blocking=True), labels.to(device, non_blocking=True)
                optimizer.zero_grad()

                with torch.amp.autocast("cuda", enabled=(device.type == "cuda")):
                    outputs = model(images)
                    loss = criterion(outputs, labels)

                scaler.scale(loss).backward()
                scaler.step(optimizer)
                scaler.update()

                running_loss += loss.item() * images.size(0)
                _, preds = torch.max(outputs, 1)
                correct += torch.sum(preds == labels.data).item()
                total += labels.size(0)

                if step == 1 or step % log_freq == 0 or step == total_batches:
                    curr_acc = (correct / max(1, total)) * 100.0
                    curr_loss = running_loss / max(1, total)
                    logger.info(
                        f"  [Stage 2] Epoch {epoch+1:02d}/{total_epochs:02d} | "
                        f"Batch {step:4d}/{total_batches} ({step/total_batches*100:5.1f}%) | "
                        f"Loss: {curr_loss:.4f} | Train Acc: {curr_acc:5.2f}%"
                    )

            current_lr = optimizer.param_groups[0]["lr"]
            scheduler.step()
            epoch_loss = running_loss / max(1, total)
            epoch_acc = correct / max(1, total)

            # Validation Loop
            model.eval()
            val_correct = 0
            val_total = 0
            val_loss_sum = 0.0

            with torch.no_grad():
                for images, labels in val_loader:
                    images, labels = images.to(device, non_blocking=True), labels.to(device, non_blocking=True)
                    with torch.amp.autocast("cuda", enabled=(device.type == "cuda")):
                        outputs = model(images)
                        loss = criterion(outputs, labels)

                    val_loss_sum += loss.item() * images.size(0)
                    _, preds = torch.max(outputs, 1)
                    val_correct += torch.sum(preds == labels.data).item()
                    val_total += labels.size(0)

            val_acc = val_correct / max(1, val_total)
            val_loss = val_loss_sum / max(1, val_total)
            epoch_sec = time.time() - epoch_start

            epoch_metrics = {
                "epoch": epoch + 1,
                "stage": "fine_tune",
                "lr": round(current_lr, 6),
                "train_acc": round(epoch_acc * 100, 2),
                "train_loss": round(epoch_loss, 4),
                "val_acc": round(val_acc * 100, 2),
                "val_loss": round(val_loss, 4),
                "duration_sec": round(epoch_sec, 1)
            }
            history.append(epoch_metrics)

            logger.info(
                f"Epoch {epoch+1:02d}/{total_epochs:02d} [Stage 2 Finished in {epoch_sec:.1f}s] | LR: {current_lr:.6f} | "
                f"Train Acc: {epoch_acc*100:.2f}% (Loss: {epoch_loss:.4f}) | "
                f"Val Acc: {val_acc*100:.2f}% (Loss: {val_loss:.4f})"
            )

            if val_acc >= best_acc:
                best_acc = val_acc
                torch.save(model.state_dict(), str(MODEL_PATH_PTH))
                logger.info(f"[SAVED] New best fine-tuned checkpoint ({best_acc*100:.2f}% val acc) -> {MODEL_PATH_PTH}")

    total_min = (time.time() - start_time) / 60.0
    with open(HISTORY_PATH, "w") as f:
        json.dump({
            "num_classes": num_classes,
            "class_names": class_names,
            "best_val_acc": round(best_acc * 100, 2),
            "total_duration_minutes": round(total_min, 2),
            "history": history
        }, f, indent=4)

    logger.info("==================================================")
    logger.info("[COMPLETE] MODEL TRAINING & FINE-TUNING COMPLETE")
    logger.info(f"[STATUS] Total Execution Time: {total_min:.2f} minutes")
    logger.info(f"[ACCURACY] Best Validation Accuracy: {best_acc*100:.2f}%")
    logger.info(f"[SAVED] Model Checkpoint: {MODEL_PATH_PTH}")
    logger.info(f"[SAVED] Classes Mapping: {CLASSES_PATH}")
    logger.info("==================================================")
    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="PlantAI PyTorch Training Pipeline")
    parser.add_argument("--epochs", type=int, default=None, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=None, help="Batch size for training")
    parser.add_argument("--lr", type=float, default=None, help="Learning rate")
    parser.add_argument("--num-workers", type=int, default=None, help="Number of data loader worker processes")
    parser.add_argument("--quick-test", action="store_true", help="Run quick test on small dataset subset")
    args = parser.parse_args()

    train_gpu(args)