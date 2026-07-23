import os
import json
import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report, confusion_matrix
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

# ── CONFIG ──────────────────────────────
IMG_SIZE = (128, 128)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ML_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))
ROOT_DIR = os.path.abspath(os.path.join(ML_DIR, ".."))

DATASET_PATH = os.path.join(ROOT_DIR, "dataset", "PlantVillage")
if not os.path.exists(DATASET_PATH):
    DATASET_PATH = os.path.join(ML_DIR, "PlantVillage")

MODEL_PATH = os.path.join(ML_DIR, "output", "final_plant_model.keras")
if not os.path.exists(MODEL_PATH):
    MODEL_PATH = os.path.join(ROOT_DIR, "backend", "models", "plant_model_fast.h5")

CLASSES_PATH = os.path.join(ML_DIR, "output", "classes.json")


def evaluate():
    if not os.path.exists(MODEL_PATH):
        print(f"❌ Model not found at {MODEL_PATH}")
        return

    print(f"🔍 Loading model: {MODEL_PATH}")
    model = tf.keras.models.load_model(MODEL_PATH)

    print("📂 Loading evaluation data...")
    datagen = ImageDataGenerator(
        preprocessing_function=preprocess_input,
        validation_split=0.2
    )

    val_data = datagen.flow_from_directory(
        DATASET_PATH,
        target_size=IMG_SIZE,
        batch_size=32,
        class_mode="categorical",
        subset="validation",
        shuffle=False
    )

    class_names = list(val_data.class_indices.keys())

    print("📊 Generating predictions...")
    preds = model.predict(val_data)
    y_pred = np.argmax(preds, axis=1)
    y_true = val_data.classes

    print("\n=== CLASSIFICATION REPORT ===")
    print(classification_report(y_true, y_pred, target_names=class_names))

    print("\n=== CONFUSION MATRIX ===")
    print(confusion_matrix(y_true, y_pred))

    accuracy = np.mean(y_pred == y_true)
    print(f"\n🎯 FINAL ACCURACY: {accuracy * 100:.2f}%")

if __name__ == "__main__":
    evaluate()