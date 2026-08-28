"""
LeafGuard AI — Model Evaluation Pipeline
Evaluates the trained EfficientNetB0 plant disease classification model,
calculates Accuracy, Precision, Recall, F1-Score, Confusion Matrix, and saves model_metrics.json.
Supports TensorFlow/Keras and PyTorch/Torchvision backends.
"""

import os
import sys
import json
import logging
import argparse
from pathlib import Path
import numpy as np

# Setup paths
TRAINING_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = TRAINING_DIR.parent
BACKEND_MODELS_DIR = PROJECT_ROOT / "backend" / "models"

MODEL_KERAS_PATH = BACKEND_MODELS_DIR / "plant_disease_model.keras"
MODEL_PTH_PATH = BACKEND_MODELS_DIR / "plant_disease_model.pth"
CLASSES_PATH = BACKEND_MODELS_DIR / "class_names.json"
METRICS_PATH = BACKEND_MODELS_DIR / "model_metrics.json"

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("LeafGuardEvalEngine")


def find_eval_dataset_path(root_dir: Path):
    candidate_roots = [
        root_dir / "dataset",
        root_dir / "PlantVillage",
        root_dir,
    ]
    for root in candidate_roots:
        if not root.exists():
            continue
        for val_name in ["valid", "val", "validation", "test"]:
            cands = list(root.glob(f"**/{val_name}"))
            for c in cands:
                if c.is_dir():
                    return c
        train_cands = list(root.glob("**/train"))
        if train_cands:
            return train_cands[0]
        if root.is_dir():
            return root
    return None


def evaluate_pytorch(eval_path: Path, model_file: Path, class_names: list):
    import torch
    import torch.nn as nn
    from torch.utils.data import DataLoader
    from torchvision import datasets, transforms, models
    from sklearn.metrics import classification_report, confusion_matrix, precision_recall_fscore_support, accuracy_score

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    num_classes = len(class_names)

    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    val_dataset = datasets.ImageFolder(str(eval_path), transform=val_transform)
    val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False, num_workers=0)

    model = models.efficientnet_b0(weights=None)
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3, inplace=False),
        nn.Linear(in_features, 256),
        nn.BatchNorm1d(256),
        nn.ReLU(inplace=False),
        nn.Dropout(p=0.2, inplace=False),
        nn.Linear(256, num_classes)
    )
    state_dict = torch.load(str(model_file), map_location=device)
    model.load_state_dict(state_dict)
    model = model.to(device)
    model.eval()

    y_true, y_pred = [], []
    logger.info("⚡ Generating predictions with PyTorch EfficientNetB0...")
    with torch.no_grad():
        for images, labels in val_loader:
            images = images.to(device)
            outputs = model(images)
            _, preds = torch.max(outputs, 1)
            y_true.extend(labels.cpu().numpy())
            y_pred.extend(preds.cpu().numpy())

    return np.array(y_true), np.array(y_pred)


def evaluate_tensorflow(eval_path: Path, model_file: Path, class_names: list):
    import tensorflow as tf
    from sklearn.metrics import accuracy_score

    model = tf.keras.models.load_model(str(model_file), compile=False)
    val_ds = tf.keras.utils.image_dataset_from_directory(
        str(eval_path), image_size=(224, 224), batch_size=32, shuffle=False, label_mode="int"
    )

    y_true, y_pred = [], []
    logger.info("⚡ Generating predictions with TensorFlow/Keras EfficientNetB0...")
    for images, labels in val_ds:
        preds = model.predict(images, verbose=0)
        pred_labels = np.argmax(preds, axis=1)
        y_true.extend(labels.numpy())
        y_pred.extend(pred_labels)

    return np.array(y_true), np.array(y_pred)


def evaluate(dataset_dir: str = "", model_path: str = ""):
    from sklearn.metrics import classification_report, confusion_matrix, precision_recall_fscore_support, accuracy_score

    logger.info("==================================================")
    logger.info("🌿 LeafGuard AI — Model Evaluation Suite")
    logger.info("==================================================")

    # Locate model checkpoint
    if model_path:
        target_model = Path(model_path).resolve()
    elif MODEL_PTH_PATH.exists():
        target_model = MODEL_PTH_PATH
    elif MODEL_KERAS_PATH.exists():
        target_model = MODEL_KERAS_PATH
    else:
        logger.error("❌ No trained model found (.pth or .keras).")
        logger.error("Run 'python training/train_model.py' first.")
        sys.exit(1)

    if not CLASSES_PATH.exists():
        logger.error(f"❌ Class names mapping not found at: {CLASSES_PATH}")
        sys.exit(1)

    with open(CLASSES_PATH, "r", encoding="utf-8") as f:
        class_names = json.load(f)

    if dataset_dir:
        eval_path = find_eval_dataset_path(Path(dataset_dir).resolve())
    else:
        eval_path = find_eval_dataset_path(PROJECT_ROOT)

    if not eval_path:
        logger.error(f"❌ Evaluation dataset folder not found under {dataset_dir or (PROJECT_ROOT / 'dataset')}.")
        sys.exit(1)

    logger.info(f"📁 Loading Evaluation Data from: {eval_path}")
    logger.info(f"📦 Loading Model from: {target_model}")

    if target_model.suffix == ".pth":
        y_true, y_pred = evaluate_pytorch(eval_path, target_model, class_names)
    else:
        y_true, y_pred = evaluate_tensorflow(eval_path, target_model, class_names)

    acc = float(accuracy_score(y_true, y_pred))
    precision, recall, f1, _ = precision_recall_fscore_support(y_true, y_pred, average="macro", zero_division=0)
    unique_labels = sorted(list(set(y_true)))
    target_names = [class_names[i] if i < len(class_names) else f"Class_{i}" for i in unique_labels]

    report = classification_report(y_true, y_pred, target_names=target_names, output_dict=True, zero_division=0)
    matrix = confusion_matrix(y_true, y_pred).tolist()

    logger.info("\n" + classification_report(y_true, y_pred, target_names=target_names, zero_division=0))
    logger.info(f"🏆 OVERALL ACCURACY: {acc * 100:.2f}%")
    logger.info(f"🎯 MACRO F1-SCORE:  {f1 * 100:.2f}%")

    metrics_payload = {
        "model_architecture": "EfficientNetB0",
        "num_classes": len(class_names),
        "dataset_path": str(eval_path),
        "metrics": {
            "test_accuracy": round(acc, 4),
            "precision_macro": round(float(precision), 4),
            "recall_macro": round(float(recall), 4),
            "f1_score_macro": round(float(f1), 4)
        },
        "classification_report": report,
        "confusion_matrix": matrix,
        "disclaimer": "Predictions are generated by an AI model and may be incorrect. Results should be used as guidance and verified by agricultural professionals when necessary."
    }

    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics_payload, f, indent=2)

    logger.info(f"💾 Metrics successfully exported to: {METRICS_PATH}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="LeafGuard AI Model Evaluation Suite")
    parser.add_argument("--dataset-dir", type=str, default="", help="Path to evaluation dataset")
    parser.add_argument("--model-path", type=str, default="", help="Path to model file (.pth or .keras)")
    args = parser.parse_args()
    evaluate(dataset_dir=args.dataset_dir, model_path=args.model_path)
