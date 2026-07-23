import os
import sys
import json
import yaml
import time
import logging
from pathlib import Path

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

# Search for dataset root
DATASET_PATH = ML_DIR / "PlantVillage"
if not DATASET_PATH.exists():
    DATASET_PATH = ROOT_DIR / "dataset" / "PlantVillage"

# Auto-detect nested PlantVillage folder (eliminates fake 'PlantVillage' class)
if (DATASET_PATH / "PlantVillage").exists() and (DATASET_PATH / "PlantVillage").is_dir():
    DATASET_PATH = DATASET_PATH / "PlantVillage"

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("GPUTrainEngine")

# Load Configuration
config = {}
if CONFIG_PATH.exists():
    with open(CONFIG_PATH, "r") as f:
        config = yaml.safe_load(f) or {}

train_cfg = config.get("training", {})
model_cfg = config.get("model", {})

IMG_SIZE = tuple(model_cfg.get("input_shape", [128, 128, 3])[:2])
BATCH_SIZE = train_cfg.get("batch_size", 64)  # High throughput GPU batch size
EPOCHS = train_cfg.get("epochs_initial", 5) + train_cfg.get("epochs_fine_tune", 3)
LR = train_cfg.get("learning_rate_initial", 0.001)


def ensure_dataset():
    """Triggers dataset downloader if dataset directory is missing"""
    if not DATASET_PATH.exists():
        logger.info(f"⚠️ Dataset missing at {DATASET_PATH}. Initiating automatic Kaggle download...")
        sys.path.insert(0, str(ML_DIR))
        try:
            from download_dataset import download_plant_disease_dataset
            download_plant_disease_dataset()
        except Exception as e:
            logger.error(f"Failed to auto-download dataset: {e}")
            logger.info("Please download the PlantVillage dataset manually or run 'python ml/download_dataset.py'.")


def train_gpu():
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torchvision import datasets, transforms, models
    from torch.utils.data import DataLoader, random_split

    ensure_dataset()

    if not DATASET_PATH.exists():
        logger.error(f"❌ Dataset folder not found at {DATASET_PATH}.")
        return False

    # Check CUDA / GPU availability
    if torch.cuda.is_available():
        device = torch.device("cuda")
        gpu_name = torch.cuda.get_device_name(0)
        vram_mb = torch.cuda.get_device_properties(0).total_memory / (1024 ** 2)
        logger.info("==================================================")
        logger.info("🚀 HIGH-ACCURACY GPU ACCELERATED TRAINING ENABLED")
        logger.info(f"🎮 GPU Device: {gpu_name} ({vram_mb:.0f} MB VRAM)")
        logger.info(f"⚡ Batch Size: {BATCH_SIZE} | Image Size: {IMG_SIZE}")
        logger.info("==================================================")
        torch.backends.cudnn.benchmark = True
    else:
        device = torch.device("cpu")
        logger.info("⚠️ CUDA GPU unavailable. Training on CPU...")

    # High-Performance Data Augmentation
    transform_train = transforms.Compose([
        transforms.Resize(IMG_SIZE),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(p=0.2),
        transforms.RandomRotation(20),
        transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.15),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    transform_val = transforms.Compose([
        transforms.Resize(IMG_SIZE),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    logger.info(f"Loading image dataset from {DATASET_PATH}...")
    full_dataset = datasets.ImageFolder(root=str(DATASET_PATH), transform=transform_train)

    # Clean class names (filter out any non-disease folders)
    class_names = [c for c in full_dataset.classes if c != "PlantVillage"]
    num_classes = len(class_names)
    logger.info(f"✅ Total Images: {len(full_dataset)} | Clean Disease Classes ({num_classes}): {class_names}")

    # Save Clean Classes JSON
    with open(CLASSES_PATH, "w") as f:
        json.dump(class_names, f, indent=4)

    val_size = int(len(full_dataset) * 0.2)
    train_size = len(full_dataset) - val_size
    train_ds, val_ds = random_split(full_dataset, [train_size, val_size])

    # Optimize Multi-Worker Data Loading
    num_workers = 2 if os.name == "nt" else 4
    pin_mem = device.type == "cuda"
    train_loader = DataLoader(
        train_ds, batch_size=BATCH_SIZE, shuffle=True,
        num_workers=num_workers, pin_memory=pin_mem, persistent_workers=True if num_workers > 0 else False
    )
    val_loader = DataLoader(
        val_ds, batch_size=BATCH_SIZE, shuffle=False,
        num_workers=num_workers, pin_memory=pin_mem, persistent_workers=True if num_workers > 0 else False
    )

    # Build Advanced MobileNetV3 Large Architecture for High Accuracy
    logger.info("Building MobileNetV3 Large Neural Network with Pretrained Weights...")
    model = models.mobilenet_v3_large(weights=models.MobileNet_V3_Large_Weights.DEFAULT)
    model.classifier[3] = nn.Linear(model.classifier[3].in_features, num_classes)
    model = model.to(device)

    # Loss function with Label Smoothing for higher generalization & accuracy
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    optimizer = optim.AdamW(model.parameters(), lr=LR, weight_decay=1e-4)

    # Cosine Annealing Learning Rate Scheduler
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS, eta_min=1e-5)

    # Automatic Mixed Precision for NVIDIA RTX GPU Speed
    use_amp = device.type == "cuda"
    scaler = torch.amp.GradScaler("cuda") if use_amp else None

    logger.info(f"🔥 Fast GPU Training Started ({EPOCHS} Epochs, Batch Size: {BATCH_SIZE})...")
    best_acc = 0.0
    start_time = time.time()

    for epoch in range(EPOCHS):
        epoch_start = time.time()
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        for images, labels in train_loader:
            images, labels = images.to(device, non_blocking=True), labels.to(device, non_blocking=True)
            optimizer.zero_grad()

            if use_amp:
                with torch.amp.autocast("cuda"):
                    outputs = model(images)
                    loss = criterion(outputs, labels)
                scaler.scale(loss).backward()
                scaler.step(optimizer)
                scaler.update()
            else:
                outputs = model(images)
                loss = criterion(outputs, labels)
                loss.backward()
                optimizer.step()

            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct += torch.sum(preds == labels.data).item()
            total += labels.size(0)

        scheduler.step()
        epoch_loss = running_loss / total
        epoch_acc = correct / total

        # Validation Loop
        model.eval()
        val_correct = 0
        val_total = 0
        val_loss_sum = 0.0

        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device, non_blocking=True), labels.to(device, non_blocking=True)
                if use_amp:
                    with torch.amp.autocast("cuda"):
                        outputs = model(images)
                        loss = criterion(outputs, labels)
                else:
                    outputs = model(images)
                    loss = criterion(outputs, labels)

                val_loss_sum += loss.item() * images.size(0)
                _, preds = torch.max(outputs, 1)
                val_correct += torch.sum(preds == labels.data).item()
                val_total += labels.size(0)

        val_acc = val_correct / val_total
        val_loss = val_loss_sum / val_total
        epoch_sec = time.time() - epoch_start

        logger.info(
            f"Epoch {epoch+1:02d}/{EPOCHS:02d} [{epoch_sec:.1f}s] | "
            f"Train Acc: {epoch_acc*100:.2f}% (Loss: {epoch_loss:.4f}) | "
            f"Val Acc: {val_acc*100:.2f}% (Loss: {val_loss:.4f})"
        )

        if val_acc >= best_acc:
            best_acc = val_acc
            torch.save(model.state_dict(), str(MODEL_PATH_PTH))
            logger.info(f" Saved new best GPU model checkpoint ({best_acc*100:.2f}% accuracy) to {MODEL_PATH_PTH}")

    total_min = (time.time() - start_time) / 60.0
    logger.info("==================================================")
    logger.info("🏆 GPU MODEL TRAINING COMPLETE")
    logger.info(f"⏱️ Total Time: {total_min:.2f} minutes")
    logger.info(f"🎯 Peak Validation Accuracy: {best_acc*100:.2f}%")
    logger.info(f"💾 Model Saved: {MODEL_PATH_PTH}")
    logger.info(f"📋 Classes Saved: {CLASSES_PATH}")
    logger.info("==================================================")
    return True


if __name__ == "__main__":
    train_gpu()