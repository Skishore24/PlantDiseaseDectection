"""
LeafGuard AI — Model Evaluation Pipeline
Evaluates the trained EfficientNetB0 plant disease classification model on a validation/test dataset,
calculates real Accuracy, Precision, Recall, F1-Score, Confusion Matrix, and saves model_metrics.json.
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
CLASSES_PATH = BACKEND_MODELS_DIR / "class_names.json"
METRICS_PATH = BACKEND_MODELS_DIR / "model_metrics.json"

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("LeafGuardEvalEngine")


def find_eval_dataset_path(root_dir: Path):
    candidate_roots = [
        root_dir / "dataset",
        root_dir / "dataset" / "New Plant Diseases Dataset(Augmented)",
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


def evaluate_tensorflow(eval_path: Path, model_file: Path, class_names: list):
    import tensorflow as tf
    from sklearn.metrics import classification_report, confusion_matrix, precision_recall_fscore_support, accuracy_score

    logger.info(f"Loading TensorFlow/Keras model from: {model_file}")
    model = tf.keras.models.load_model(str(model_file), compile=False)

    num_classes = len(class_names)
    eval_ds = tf.keras.utils.image_dataset_from_directory(
        eval_path,
        image_size=(224, 224),
        batch_size=32,
        shuffle=False,
        label_mode="int"
    )

    y_true = []
    y_pred = []

    logger.info("⚡ Generating evaluation predictions with EfficientNetB0...")
    for images, labels in eval_ds:
        preds = model.predict(images, verbose=0)
        top_preds = np.argmax(preds, axis=1)
        y_true.extend(labels.numpy())
        y_pred.extend(top_preds)

    return np.array(y_true), np.array(y_pred)


def main():
    parser = argparse.ArgumentParser(description="LeafGuard AI Model Evaluation")
    parser.add_argument("--model-path", type=str, default="", help="Path to .keras model file")
    parser.add_argument("--eval-dir", type=str, default="", help="Path to evaluation dataset")
    args = parser.parse_args()

    logger.info("==================================================")
    logger.info("🌿 LeafGuard AI — Model Evaluation Pipeline")
    logger.info("==================================================")

    # 1. Resolve Class Names
    if not CLASSES_PATH.exists():
        logger.error(f"❌ Class names definition not found at {CLASSES_PATH}")
        sys.exit(1)

    with open(CLASSES_PATH, "r", encoding="utf-8") as f:
        class_names = json.load(f)

    # 2. Resolve Model File
    target_model = Path(args.model_path) if args.model_path else MODEL_KERAS_PATH
    if not target_model.exists():
        logger.error(f"❌ Model artifact not found at {target_model}")
        logger.info("Run 'python training/train_model.py' to train the model first.")
        sys.exit(1)

    # 3. Resolve Evaluation Dataset
    if args.eval_dir:
        eval_path = Path(args.eval_dir).resolve()
    else:
        eval_path = find_eval_dataset_path(PROJECT_ROOT)

    if not eval_path or not eval_path.exists():
        logger.error(f"❌ Evaluation dataset not found at '{eval_path}'")
        sys.exit(1)

    logger.info(f"📁 Evaluating on dataset: {eval_path}")

    # 4. Run Evaluation
    try:
        import tensorflow as tf
        from sklearn.metrics import classification_report, confusion_matrix, precision_recall_fscore_support, accuracy_score
    except ImportError:
        logger.error("❌ tensorflow and scikit-learn are required for model evaluation.")
        sys.exit(1)

    y_true, y_pred = evaluate_tensorflow(eval_path, target_model, class_names)

    # 5. Compute Metrics
    acc = float(accuracy_score(y_true, y_pred))
    precision, recall, f1, _ = precision_recall_fscore_support(y_true, y_pred, average="weighted", zero_division=0)
    cm = confusion_matrix(y_true, y_pred).tolist()

    # Per-class metrics
    p_per, r_per, f1_per, sup_per = precision_recall_fscore_support(y_true, y_pred, average=None, zero_division=0)
    per_class_summary = {}
    for i, c_name in enumerate(class_names):
        if i < len(p_per):
            per_class_summary[c_name] = {
                "precision": round(float(p_per[i]) * 100, 2),
                "recall": round(float(r_per[i]) * 100, 2),
                "f1": round(float(f1_per[i]) * 100, 2),
                "support": int(sup_per[i]) if i < len(sup_per) else 0
            }

    metrics_payload = {
        "framework": "TensorFlow / Keras",
        "architecture": "EfficientNetB0 (Transfer Learning)",
        "num_classes": len(class_names),
        "overall_accuracy": round(acc * 100, 2),
        "weighted_precision": round(float(precision) * 100, 2),
        "weighted_recall": round(float(recall) * 100, 2),
        "weighted_f1_score": round(float(f1) * 100, 2),
        "evaluation_samples": int(len(y_true)),
        "confusion_matrix": cm,
        "per_class_metrics": per_class_summary,
        "evaluation_dataset": str(eval_path.name)
    }

    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics_payload, f, indent=2)

    logger.info("==================================================")
    logger.info("📊 Evaluation Summary:")
    logger.info(f"Accuracy:  {metrics_payload['overall_accuracy']}%")
    logger.info(f"Precision: {metrics_payload['weighted_precision']}%")
    logger.info(f"Recall:    {metrics_payload['weighted_recall']}%")
    logger.info(f"F1-Score:  {metrics_payload['weighted_f1_score']}%")
    logger.info(f"💾 Metrics saved to: {METRICS_PATH}")
    logger.info("==================================================")


if __name__ == "__main__":
    main()
