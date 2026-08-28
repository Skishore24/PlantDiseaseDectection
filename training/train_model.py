"""
LeafGuard AI — Model Training Pipeline
Trains a deep convolutional neural network for 38-class plant leaf disease classification
using Transfer Learning with EfficientNetB0 and TensorFlow / Keras.
"""

import os
import sys
import json
import time
import argparse
import logging
from pathlib import Path

# Setup paths
TRAINING_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = TRAINING_DIR.parent
BACKEND_MODELS_DIR = PROJECT_ROOT / "backend" / "models"
BACKEND_MODELS_DIR.mkdir(parents=True, exist_ok=True)

MODEL_OUTPUT_PATH = BACKEND_MODELS_DIR / "plant_disease_model.keras"
CLASSES_OUTPUT_PATH = BACKEND_MODELS_DIR / "class_names.json"
HISTORY_OUTPUT_PATH = BACKEND_MODELS_DIR / "training_history.json"

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("LeafGuardTrainEngine")

IMG_SHAPE = (224, 224, 3)
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
        root_dir / "ml" / "dataset",
        root_dir / "PlantVillage",
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


def build_efficientnet_model(num_classes: int):
    """
    Builds transfer learning model using EfficientNetB0 backbone and custom classification head.
    """
    import tensorflow as tf
    from tensorflow.keras import layers, models

    # 1. Data Augmentation Layers
    data_augmentation = tf.keras.Sequential([
        layers.RandomFlip("horizontal_and_vertical"),
        layers.RandomRotation(0.2),
        layers.RandomZoom(0.2),
        layers.RandomContrast(0.2),
    ], name="data_augmentation")

    # 2. Base Model (EfficientNetB0 with ImageNet weights)
    base_model = tf.keras.applications.EfficientNetB0(
        include_top=False,
        weights="imagenet",
        input_shape=IMG_SHAPE
    )
    base_model.trainable = False  # Freeze initial backbone

    # 3. Model Architecture
    inputs = tf.keras.Input(shape=IMG_SHAPE, name="input_image")
    x = data_augmentation(inputs)
    x = tf.keras.applications.efficientnet.preprocess_input(x)
    x = base_model(x, training=False)
    x = layers.GlobalAveragePooling2D(name="global_avg_pool")(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.3, name="top_dropout")(x)
    x = layers.Dense(256, activation="relu", name="dense_hidden")(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.2, name="second_dropout")(x)
    outputs = layers.Dense(num_classes, activation="softmax", name="predictions")(x)

    model = models.Model(inputs, outputs, name="LeafGuard_EfficientNetB0")
    return model, base_model


def train(args):
    import tensorflow as tf
    from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau

    logger.info("==================================================")
    logger.info("🌿 LeafGuard AI — EfficientNetB0 Training Pipeline")
    logger.info("==================================================")

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

    batch_size = args.batch_size
    epochs = args.epochs
    lr = args.lr

    # Load datasets using tf.keras.utils.image_dataset_from_directory
    if val_path:
        train_ds = tf.keras.utils.image_dataset_from_directory(
            train_path,
            image_size=IMG_SIZE,
            batch_size=batch_size,
            shuffle=True,
            label_mode="categorical"
        )
        val_ds = tf.keras.utils.image_dataset_from_directory(
            val_path,
            image_size=IMG_SIZE,
            batch_size=batch_size,
            shuffle=False,
            label_mode="categorical"
        )
        class_names = train_ds.class_names
    else:
        train_ds = tf.keras.utils.image_dataset_from_directory(
            train_path,
            validation_split=0.2,
            subset="training",
            seed=42,
            image_size=IMG_SIZE,
            batch_size=batch_size,
            shuffle=True,
            label_mode="categorical"
        )
        val_ds = tf.keras.utils.image_dataset_from_directory(
            train_path,
            validation_split=0.2,
            subset="validation",
            seed=42,
            image_size=IMG_SIZE,
            batch_size=batch_size,
            shuffle=False,
            label_mode="categorical"
        )
        class_names = train_ds.class_names

    num_classes = len(class_names)
    logger.info(f"✅ Identified {num_classes} disease classes: {class_names[:5]}...")

    # Save class names JSON
    with open(CLASSES_OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(class_names, f, indent=2)
    logger.info(f"💾 Saved class names to {CLASSES_OUTPUT_PATH}")

    # Optimize data streaming pipeline
    AUTOTUNE = tf.data.AUTOTUNE
    train_ds = train_ds.prefetch(buffer_size=AUTOTUNE)
    val_ds = val_ds.prefetch(buffer_size=AUTOTUNE)

    # Build Model
    model, base_model = build_efficientnet_model(num_classes)
    model.summary(print_fn=logger.info)

    # Compile
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=lr),
        loss="categorical_crossentropy",
        metrics=["accuracy", tf.keras.metrics.TopKCategoricalAccuracy(k=3, name="top_3_accuracy")]
    )

    # Callbacks
    callbacks = [
        ModelCheckpoint(
            filepath=str(MODEL_OUTPUT_PATH),
            monitor="val_accuracy",
            save_best_only=True,
            mode="max",
            verbose=1
        ),
        EarlyStopping(
            monitor="val_loss",
            patience=5,
            restore_best_weights=True,
            verbose=1
        ),
        ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.2,
            patience=3,
            min_lr=1e-6,
            verbose=1
        )
    ]

    # Stage 1: Train classification head
    logger.info(f"🚀 Starting Stage 1: Classifier Head Training ({epochs} epochs)...")
    start_time = time.time()
    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=epochs,
        callbacks=callbacks
    )

    # Stage 2: Fine-tuning (optional)
    if args.fine_tune:
        logger.info("🚀 Starting Stage 2: Fine-Tuning Top Layers of EfficientNetB0...")
        base_model.trainable = True
        # Freeze all layers except top 30
        for layer in base_model.layers[:-30]:
            layer.trainable = False

        model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=lr * 0.1),
            loss="categorical_crossentropy",
            metrics=["accuracy", tf.keras.metrics.TopKCategoricalAccuracy(k=3, name="top_3_accuracy")]
        )

        fine_tune_epochs = max(3, epochs // 2)
        history_ft = model.fit(
            train_ds,
            validation_data=val_ds,
            epochs=fine_tune_epochs,
            callbacks=callbacks
        )

    duration_min = (time.time() - start_time) / 60.0
    logger.info(f"🎉 Training Complete in {duration_min:.2f} minutes!")
    logger.info(f"💾 Best Model Saved to: {MODEL_OUTPUT_PATH}")

    # Save training history JSON
    hist_dict = {
        "num_classes": num_classes,
        "class_names": class_names,
        "duration_minutes": round(duration_min, 2),
        "history": {k: [float(v) for v in vals] for k, vals in history.history.items()}
    }
    with open(HISTORY_OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(hist_dict, f, indent=2)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="LeafGuard AI EfficientNetB0 Training Pipeline")
    parser.add_argument("--epochs", type=int, default=12, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=32, help="Batch size")
    parser.add_argument("--lr", type=float, default=0.001, help="Initial learning rate")
    parser.add_argument("--fine-tune", action="store_true", help="Perform Stage 2 fine-tuning on top backbone layers")
    args = parser.parse_args()

    train(args)
