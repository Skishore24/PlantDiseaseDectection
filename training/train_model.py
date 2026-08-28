"""
LeafGuard AI — Model Training Pipeline
Trains a deep convolutional neural network for 38-class plant leaf disease classification
using Transfer Learning with EfficientNetB0.
Supports TensorFlow / Keras (Python <= 3.12) and PyTorch / Torchvision (Python 3.14+).
"""

import os
import sys
import json
import time
import argparse
import logging
from pathlib import Path
import numpy as np

# Setup paths
TRAINING_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = TRAINING_DIR.parent
BACKEND_MODELS_DIR = PROJECT_ROOT / "backend" / "models"
BACKEND_MODELS_DIR.mkdir(parents=True, exist_ok=True)

MODEL_KERAS_PATH = BACKEND_MODELS_DIR / "plant_disease_model.keras"
MODEL_PTH_PATH = BACKEND_MODELS_DIR / "plant_disease_model.pth"
CLASSES_OUTPUT_PATH = BACKEND_MODELS_DIR / "class_names.json"
HISTORY_OUTPUT_PATH = BACKEND_MODELS_DIR / "training_history.json"

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("LeafGuardTrainEngine")

IMG_SIZE = (224, 224)


def is_class_directory(path: Path) -> bool:
    """Check if a directory contains image class folders."""
    if not path.exists() or not path.is_dir():
        return False
    subdirs = [d for d in path.iterdir() if d.is_dir() and not d.name.startswith(".")]
    if subdirs and not any(s.name.lower() in ["train", "valid", "val", "test", "__pycache__"] for s in subdirs):
        return True
    return False


def find_dataset_directories(root_dir: Path):
    """
    Search recursively for train and validation dataset folders.
    """
    candidate_roots = [
        root_dir / "dataset",
        root_dir / "PlantVillage",
        root_dir,
    ]

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

    return None, None


# ─────────────────────────────────────────────────────────────
# PyTorch EfficientNetB0 Training Engine (Python 3.14+ Native)
# ─────────────────────────────────────────────────────────────
def train_pytorch(train_path: Path, val_path: Path, args):
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import DataLoader, random_split
    from torchvision import datasets, transforms, models

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"⚡ PyTorch Training Engine active on device: {device}")

    # Transforms with data augmentation
    train_transform = transforms.Compose([
        transforms.Resize(IMG_SIZE),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    val_transform = transforms.Compose([
        transforms.Resize(IMG_SIZE),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    if val_path:
        train_dataset = datasets.ImageFolder(str(train_path), transform=train_transform)
        val_dataset = datasets.ImageFolder(str(val_path), transform=val_transform)
        class_names = train_dataset.classes
    else:
        full_dataset = datasets.ImageFolder(str(train_path), transform=train_transform)
        class_names = full_dataset.classes
        val_size = int(0.2 * len(full_dataset))
        train_size = len(full_dataset) - val_size
        train_dataset, val_dataset = random_split(full_dataset, [train_size, val_size])

    num_classes = len(class_names)
    logger.info(f"✅ Identified {num_classes} disease classes: {class_names[:5]}...")

    # Save class names JSON
    with open(CLASSES_OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(class_names, f, indent=2)
    logger.info(f"💾 Saved class names to {CLASSES_OUTPUT_PATH}")

    # Build DataLoader
    train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=args.batch_size, shuffle=False, num_workers=0)

    # Build EfficientNetB0 Architecture
    model = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.DEFAULT)

    # Freeze base feature extractor initially
    for param in model.features.parameters():
        param.requires_grad = False

    # Custom classification head
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3, inplace=False),
        nn.Linear(in_features, 256),
        nn.BatchNorm1d(256),
        nn.ReLU(inplace=False),
        nn.Dropout(p=0.2, inplace=False),
        nn.Linear(256, num_classes)
    )
    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=args.lr)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="max", factor=0.2, patience=2)

    best_val_acc = 0.0
    history = {"train_loss": [], "train_acc": [], "val_loss": [], "val_acc": []}
    start_time = time.time()

    logger.info(f"🚀 Starting Stage 1: Classifier Head Training ({args.epochs} epochs)...")
    for epoch in range(1, args.epochs + 1):
        model.train()
        running_loss, correct, total = 0.0, 0, 0
        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct += torch.sum(preds == labels.data).item()
            total += labels.size(0)

        epoch_train_loss = running_loss / total
        epoch_train_acc = correct / total

        # Validation
        model.eval()
        val_loss, val_correct, val_total = 0.0, 0, 0
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)
                val_loss += loss.item() * images.size(0)
                _, preds = torch.max(outputs, 1)
                val_correct += torch.sum(preds == labels.data).item()
                val_total += labels.size(0)

        epoch_val_loss = val_loss / val_total
        epoch_val_acc = val_correct / val_total
        scheduler.step(epoch_val_acc)

        history["train_loss"].append(round(epoch_train_loss, 4))
        history["train_acc"].append(round(epoch_train_acc, 4))
        history["val_loss"].append(round(epoch_val_loss, 4))
        history["val_acc"].append(round(epoch_val_acc, 4))

        logger.info(
            f"Epoch [{epoch:02d}/{args.epochs:02d}] "
            f"Train Loss: {epoch_train_loss:.4f} | Train Acc: {epoch_train_acc*100:.2f}% | "
            f"Val Loss: {epoch_val_loss:.4f} | Val Acc: {epoch_val_acc*100:.2f}%"
        )

        if epoch_val_acc > best_val_acc:
            best_val_acc = epoch_val_acc
            torch.save(model.state_dict(), str(MODEL_PTH_PATH))
            logger.info(f"⭐ Saved new best checkpoint to {MODEL_PTH_PATH} (Val Acc: {best_val_acc*100:.2f}%)")

    # Stage 2: Fine Tuning
    if args.fine_tune:
        logger.info("🚀 Starting Stage 2: Fine-Tuning Top Layers of EfficientNetB0...")
        # Unfreeze top feature layers
        for param in model.features[-3:].parameters():
            param.requires_grad = True

        optimizer = optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=args.lr * 0.1)
        fine_tune_epochs = max(3, args.epochs // 2)

        for epoch in range(1, fine_tune_epochs + 1):
            model.train()
            running_loss, correct, total = 0.0, 0, 0
            for images, labels in train_loader:
                images, labels = images.to(device), labels.to(device)
                optimizer.zero_grad()
                outputs = model(images)
                loss = criterion(outputs, labels)
                loss.backward()
                optimizer.step()
                running_loss += loss.item() * images.size(0)
                _, preds = torch.max(outputs, 1)
                correct += torch.sum(preds == labels.data).item()
                total += labels.size(0)

            # Validation
            model.eval()
            val_loss, val_correct, val_total = 0.0, 0, 0
            with torch.no_grad():
                for images, labels in val_loader:
                    images, labels = images.to(device), labels.to(device)
                    outputs = model(images)
                    loss = criterion(outputs, labels)
                    val_loss += loss.item() * images.size(0)
                    _, preds = torch.max(outputs, 1)
                    val_correct += torch.sum(preds == labels.data).item()
                    val_total += labels.size(0)

            epoch_val_acc = val_correct / val_total
            if epoch_val_acc > best_val_acc:
                best_val_acc = epoch_val_acc
                torch.save(model.state_dict(), str(MODEL_PTH_PATH))

    duration_min = (time.time() - start_time) / 60.0
    logger.info(f"🎉 Training Complete in {duration_min:.2f} minutes!")

    # Save training history JSON
    hist_dict = {
        "framework": "PyTorch / Torchvision EfficientNetB0",
        "num_classes": num_classes,
        "class_names": class_names,
        "duration_minutes": round(duration_min, 2),
        "best_val_accuracy": round(best_val_acc, 4),
        "history": history
    }
    with open(HISTORY_OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(hist_dict, f, indent=2)


# ─────────────────────────────────────────────────────────────
# TensorFlow / Keras EfficientNetB0 Training Engine (Python <= 3.12)
# ─────────────────────────────────────────────────────────────
def train_tensorflow(train_path: Path, val_path: Path, args):
    import tensorflow as tf
    from tensorflow.keras import layers, models
    from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau

    logger.info("⚡ TensorFlow / Keras Training Engine active")

    data_augmentation = tf.keras.Sequential([
        layers.RandomFlip("horizontal_and_vertical"),
        layers.RandomRotation(0.2),
        layers.RandomZoom(0.2),
        layers.RandomContrast(0.2),
    ], name="data_augmentation")

    if val_path:
        train_ds = tf.keras.utils.image_dataset_from_directory(
            train_path, image_size=IMG_SIZE, batch_size=args.batch_size, shuffle=True, label_mode="categorical"
        )
        val_ds = tf.keras.utils.image_dataset_from_directory(
            val_path, image_size=IMG_SIZE, batch_size=args.batch_size, shuffle=False, label_mode="categorical"
        )
        class_names = train_ds.class_names
    else:
        train_ds = tf.keras.utils.image_dataset_from_directory(
            train_path, validation_split=0.2, subset="training", seed=42, image_size=IMG_SIZE, batch_size=args.batch_size, shuffle=True, label_mode="categorical"
        )
        val_ds = tf.keras.utils.image_dataset_from_directory(
            train_path, validation_split=0.2, subset="validation", seed=42, image_size=IMG_SIZE, batch_size=args.batch_size, shuffle=False, label_mode="categorical"
        )
        class_names = train_ds.class_names

    num_classes = len(class_names)
    with open(CLASSES_OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(class_names, f, indent=2)

    base_model = tf.keras.applications.EfficientNetB0(include_top=False, weights="imagenet", input_shape=(224, 224, 3))
    base_model.trainable = False

    inputs = tf.keras.Input(shape=(224, 224, 3), name="input_image")
    x = data_augmentation(inputs)
    x = tf.keras.applications.efficientnet.preprocess_input(x)
    x = base_model(x, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(256, activation="relu")(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.2)(x)
    outputs = layers.Dense(num_classes, activation="softmax")(x)
    model = models.Model(inputs, outputs, name="LeafGuard_EfficientNetB0")

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=args.lr),
        loss="categorical_crossentropy",
        metrics=["accuracy"]
    )

    callbacks = [
        ModelCheckpoint(filepath=str(MODEL_KERAS_PATH), monitor="val_accuracy", save_best_only=True, mode="max", verbose=1),
        EarlyStopping(monitor="val_loss", patience=5, restore_best_weights=True, verbose=1),
        ReduceLROnPlateau(monitor="val_loss", factor=0.2, patience=3, min_lr=1e-6, verbose=1)
    ]

    start_time = time.time()
    history = model.fit(train_ds, validation_data=val_ds, epochs=args.epochs, callbacks=callbacks)

    if args.fine_tune:
        base_model.trainable = True
        for layer in base_model.layers[:-30]:
            layer.trainable = False
        model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=args.lr * 0.1), loss="categorical_crossentropy", metrics=["accuracy"])
        history_ft = model.fit(train_ds, validation_data=val_ds, epochs=max(3, args.epochs // 2), callbacks=callbacks)

    duration_min = (time.time() - start_time) / 60.0
    hist_dict = {
        "framework": "TensorFlow / Keras EfficientNetB0",
        "num_classes": num_classes,
        "class_names": class_names,
        "duration_minutes": round(duration_min, 2),
        "history": {k: [float(v) for v in vals] for k, vals in history.history.items()}
    }
    with open(HISTORY_OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(hist_dict, f, indent=2)


def main():
    parser = argparse.ArgumentParser(description="LeafGuard AI EfficientNetB0 Training Pipeline")
    parser.add_argument("--dataset-dir", type=str, default="", help="Path to dataset directory containing train/valid folders")
    parser.add_argument("--epochs", type=int, default=12, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=32, help="Batch size")
    parser.add_argument("--lr", type=float, default=0.001, help="Initial learning rate")
    parser.add_argument("--fine-tune", action="store_true", help="Perform Stage 2 fine-tuning on top backbone layers")
    args = parser.parse_args()

    logger.info("==================================================")
    logger.info("🌿 LeafGuard AI — EfficientNetB0 Training Pipeline")
    logger.info("==================================================")

    if args.dataset_dir:
        custom_root = Path(args.dataset_dir).resolve()
        train_path, val_path = find_dataset_directories(custom_root)
        if not train_path and custom_root.exists() and is_class_directory(custom_root):
            train_path = custom_root
    else:
        train_path, val_path = find_dataset_directories(PROJECT_ROOT)

    if not train_path:
        logger.error(f"❌ Dataset directory not found! Please place your dataset in '{PROJECT_ROOT / 'dataset'}'.")
        logger.error("Expected structure: dataset/train/<class_folders> and dataset/valid/<class_folders>")
        logger.error("See dataset/README.md for download instructions.")
        sys.exit(1)

    logger.info(f"📁 Training Data: {train_path}")
    if val_path:
        logger.info(f"📁 Validation Data: {val_path}")
    else:
        logger.info("📁 Validation split: 20% validation split from training folder.")

    # Select engine: TensorFlow if available, else PyTorch
    try:
        import tensorflow as tf
        train_tensorflow(train_path, val_path, args)
    except ImportError:
        train_pytorch(train_path, val_path, args)


if __name__ == "__main__":
    main()
