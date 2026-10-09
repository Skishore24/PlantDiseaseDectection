"""
LeafGuard AI — Model Training Pipeline
Trains an EfficientNetB0 Convolutional Neural Network for 38-class plant disease classification
using TensorFlow / Keras Transfer Learning.
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
CLASSES_OUTPUT_PATH = BACKEND_MODELS_DIR / "class_names.json"
HISTORY_OUTPUT_PATH = BACKEND_MODELS_DIR / "training_history.json"
METRICS_OUTPUT_PATH = BACKEND_MODELS_DIR / "model_metrics.json"

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("LeafGuardTrainEngine")

IMG_SIZE = (224, 224)


def is_class_directory(path: Path) -> bool:
    """Check if a directory contains class folders with image files."""
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
        root_dir / "dataset" / "New Plant Diseases Dataset(Augmented)",
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


def train_tensorflow(train_path: Path, val_path: Path, args):
    """
    Executes transfer learning with EfficientNetB0 in TensorFlow/Keras.
    """
    try:
        import tensorflow as tf
        from tensorflow.keras import layers, models
        from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
    except ImportError as e:
        err_msg = str(e)
        logger.error(f"❌ Failed to initialize TensorFlow / Keras: {err_msg}")
        if "Application Control policy" in err_msg or "optree" in err_msg:
            logger.error("🛑 Windows 11 Smart App Control (SAC) blocked Keras/TensorFlow binary extensions (_C.pyd / _pywrap_converter_api.pyd).")
            logger.error("👉 Fix: Open Windows Security > App & browser control > Smart App Control settings > turn it Off.")
        sys.exit(1)

    logger.info("==================================================")
    logger.info("⚡ Initializing TensorFlow / Keras EfficientNetB0 Engine")
    logger.info("==================================================")

    # 1. Load Data
    if val_path:
        train_ds = tf.keras.utils.image_dataset_from_directory(
            train_path,
            image_size=IMG_SIZE,
            batch_size=args.batch_size,
            shuffle=True,
            label_mode="categorical"
        )
        val_ds = tf.keras.utils.image_dataset_from_directory(
            val_path,
            image_size=IMG_SIZE,
            batch_size=args.batch_size,
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
            batch_size=args.batch_size,
            shuffle=True,
            label_mode="categorical"
        )
        val_ds = tf.keras.utils.image_dataset_from_directory(
            train_path,
            validation_split=0.2,
            subset="validation",
            seed=42,
            image_size=IMG_SIZE,
            batch_size=args.batch_size,
            shuffle=False,
            label_mode="categorical"
        )
        class_names = train_ds.class_names

    num_classes = len(class_names)
    logger.info(f"📊 Discovered {num_classes} plant pathology categories dynamically.")

    # Save class_names.json
    with open(CLASSES_OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(class_names, f, indent=2)
    logger.info(f"💾 Class definitions saved to: {CLASSES_OUTPUT_PATH}")

    # Optimize datasets
    AUTOTUNE = tf.data.AUTOTUNE
    train_ds = train_ds.prefetch(buffer_size=AUTOTUNE)
    val_ds = val_ds.prefetch(buffer_size=AUTOTUNE)

    # 2. Data Augmentation
    data_augmentation = tf.keras.Sequential([
        layers.RandomFlip("horizontal_and_vertical"),
        layers.RandomRotation(0.15),
        layers.RandomZoom(0.15),
        layers.RandomContrast(0.15),
    ], name="data_augmentation")

    # 3. Model Architecture
    base_model = tf.keras.applications.EfficientNetB0(
        include_top=False,
        weights="imagenet",
        input_shape=(224, 224, 3)
    )
    base_model.trainable = False  # Freeze backbone for Stage 1

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
    outputs = layers.Dense(num_classes, activation="softmax", name="prediction_probabilities")(x)

    model = models.Model(inputs, outputs, name="LeafGuard_EfficientNetB0")

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=args.lr),
        loss="categorical_crossentropy",
        metrics=["accuracy"]
    )

    callbacks = [
        ModelCheckpoint(
            filepath=str(MODEL_KERAS_PATH),
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

    logger.info("🚀 Starting Transfer Learning Stage 1...")
    start_time = time.time()
    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=args.epochs,
        callbacks=callbacks
    )

    # 4. Optional Fine-Tuning Stage 2
    if args.fine_tune:
        logger.info("🚀 Starting Fine-Tuning Stage 2 (Unfreezing top backbone layers)...")
        base_model.trainable = True
        for layer in base_model.layers[:-30]:
            layer.trainable = False

        model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=args.lr * 0.1),
            loss="categorical_crossentropy",
            metrics=["accuracy"]
        )
        history_ft = model.fit(
            train_ds,
            validation_data=val_ds,
            epochs=max(3, args.epochs // 2),
            callbacks=callbacks
        )

    duration_min = (time.time() - start_time) / 60.0
    logger.info(f"✅ Training completed in {duration_min:.2f} minutes.")

    # 5. Save training history
    hist_dict = {
        "framework": "TensorFlow / Keras EfficientNetB0",
        "num_classes": num_classes,
        "class_names": class_names,
        "duration_minutes": round(duration_min, 2),
        "history": {k: [float(v) for v in vals] for k, vals in history.history.items()}
    }
    with open(HISTORY_OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(hist_dict, f, indent=2)
    logger.info(f"💾 Training history saved to: {HISTORY_OUTPUT_PATH}")
    logger.info(f"💾 Model weight artifact saved to: {MODEL_KERAS_PATH}")


def main():
    parser = argparse.ArgumentParser(description="LeafGuard AI EfficientNetB0 Training Pipeline")
    parser.add_argument("--dataset-dir", type=str, default="", help="Path to dataset directory containing train/valid folders")
    parser.add_argument("--epochs", type=int, default=12, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=32, help="Batch size")
    parser.add_argument("--lr", type=float, default=0.001, help="Initial learning rate")
    parser.add_argument("--fine-tune", action="store_true", help="Perform Stage 2 fine-tuning on top backbone layers")
    args = parser.parse_args()

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

    try:
        import tensorflow as tf
    except ImportError as e:
        err_msg = str(e)
        if sys.version_info >= (3, 13):
            logger.error(f"❌ Python {sys.version.split()[0]} is not supported by TensorFlow. TensorFlow requires Python 3.10-3.12.")
            logger.error("👉 Please use the Python 3.12 environment: '.\\.venv-tf\\Scripts\\python.exe training/train_model.py'")
        elif "Application Control policy" in err_msg or "blocked" in err_msg.lower():
            logger.error(f"❌ Windows Smart App Control blocked TensorFlow DLLs ({err_msg}).")
            logger.error("👉 Disable Smart App Control in Windows Security: Settings > Privacy & security > Windows Security > App & browser control > Smart App Control > Off")
        else:
            logger.error(f"❌ TensorFlow is required for model training. Error: {err_msg}")
            logger.error("👉 Please install tensorflow in a Python 3.11/3.12 environment: 'pip install tensorflow'")
        sys.exit(1)

    train_tensorflow(train_path, val_path, args)


if __name__ == "__main__":
    main()
