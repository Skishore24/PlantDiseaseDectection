# ml/training/evaluate.py
import os
import sys
import json
import torch
import torch.nn as nn
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader
from sklearn.metrics import classification_report, confusion_matrix
import numpy as np
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


IMG_SIZE = (224, 224)
BASE_DIR = Path(__file__).resolve().parent
ML_DIR = BASE_DIR.parent
ROOT_DIR = ML_DIR.parent
OUTPUT_DIR = ML_DIR / "output"

MODEL_PATH_PTH = OUTPUT_DIR / "final_plant_model.pth"
CLASSES_PATH = OUTPUT_DIR / "classes.json"


def is_class_directory(path: Path) -> bool:
    if not path.exists() or not path.is_dir():
        return False
    subdirs = [d for d in path.iterdir() if d.is_dir() and not d.name.startswith(".")]
    if subdirs and not any(s.name.lower() in ["train", "valid", "val", "test", "__pycache__"] for s in subdirs):
        return True
    return False


def resolve_dataset_paths(ml_dir: Path, root_dir: Path):
    candidate_roots = [
        ml_dir / "dataset",
        ml_dir / "PlantVillage",
        root_dir / "dataset",
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


def evaluate():
    if not MODEL_PATH_PTH.exists():
        print(f"[ERROR] Model checkpoint missing at {MODEL_PATH_PTH}. Please run 'python ml/training/train.py' first.")
        return

    if not CLASSES_PATH.exists():
        print(f"[ERROR] Classes mapping file missing at {CLASSES_PATH}.")
        return

    train_path, val_path = resolve_dataset_paths(ML_DIR, ROOT_DIR)
    eval_path = val_path if val_path else train_path

    if not eval_path:
        print(f"[ERROR] Dataset path missing in {ML_DIR / 'dataset'}.")
        return

    with open(CLASSES_PATH, "r") as f:
        class_names = json.load(f)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print("==================================================")
    print("[EVAL] EVALUATING PLANT AI DIAGNOSTIC MODEL")
    print(f"[DEVICE] Device: {device}")
    print(f"[CHECKPOINT] Checkpoint: {MODEL_PATH_PTH}")
    print(f"[DATASET] Dataset Path: {eval_path}")
    print("==================================================")

    state_dict = torch.load(MODEL_PATH_PTH, map_location=device)
    if "classifier.3.weight" in state_dict:
        ckpt_num_classes = state_dict["classifier.3.weight"].shape[0]
    else:
        ckpt_num_classes = len(class_names)

    model = models.mobilenet_v3_large(weights=None)
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(in_features, ckpt_num_classes)
    model.load_state_dict(state_dict)
    model = model.to(device)
    model.eval()


    transform_val = transforms.Compose([
        transforms.Resize(IMG_SIZE),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    dataset = datasets.ImageFolder(root=str(eval_path), transform=transform_val)
    val_loader = DataLoader(dataset, batch_size=32, shuffle=False, num_workers=0 if os.name == "nt" else 2)

    y_true = []
    y_pred = []

    print(f"[STATUS] Running model evaluation on {len(dataset)} samples...")
    with torch.no_grad():
        for images, labels in val_loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            _, preds = torch.max(outputs, 1)
            y_true.extend(labels.cpu().numpy())
            y_pred.extend(preds.cpu().numpy())

    y_true = np.array(y_true)
    y_pred = np.array(y_pred)

    unique_labels = sorted(list(set(y_true)))
    target_names = [dataset.classes[i] for i in unique_labels]

    print("\n==================================================")
    print("[REPORT] CLASSIFICATION REPORT")
    print("==================================================")
    print(classification_report(y_true, y_pred, target_names=target_names))

    print("\n==================================================")
    print("[MATRIX] CONFUSION MATRIX")
    print("==================================================")
    print(confusion_matrix(y_true, y_pred))

    accuracy = np.mean(y_pred == y_true)
    print(f"\n[ACCURACY] OVERALL TEST ACCURACY: {accuracy * 100:.2f}%")



if __name__ == "__main__":
    evaluate()