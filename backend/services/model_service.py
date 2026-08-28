import os
import json
import logging
import threading
from typing import List, Dict, Any, Tuple, Optional
from pathlib import Path
import numpy as np
from backend.config import settings
from backend.services.disease_service import disease_service

logger = logging.getLogger("leafguard.model_service")

# Singleton state
_model = None
_model_backend = None  # 'tensorflow', 'pytorch', or 'unloaded'
_model_lock = threading.Lock()
_class_names: Optional[List[str]] = None


class ModelService:
    def __init__(self):
        self._load_class_names()

    def _load_class_names(self) -> List[str]:
        global _class_names
        if _class_names is not None and len(_class_names) > 0:
            return _class_names

        class_path = settings.get_class_path()
        if os.path.exists(class_path):
            try:
                with open(class_path, "r", encoding="utf-8") as f:
                    raw_classes = json.load(f)
                    _class_names = [c for c in raw_classes if c != "PlantVillage"]
                logger.info(f"Loaded {len(_class_names)} class categories from {class_path}")
                return _class_names
            except Exception as e:
                logger.error(f"Error loading class names from {class_path}: {e}")

        # Fallback to standard 38 classes if file is unreadable
        _class_names = [
            "Apple___Apple_scab", "Apple___Black_rot", "Apple___Cedar_apple_rust", "Apple___healthy",
            "Blueberry___healthy", "Cherry_(including_sour)___Powdery_mildew", "Cherry_(including_sour)___healthy",
            "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot", "Corn_(maize)___Common_rust_", "Corn_(maize)___Northern_Leaf_Blight", "Corn_(maize)___healthy",
            "Grape___Black_rot", "Grape___Esca_(Black_Measles)", "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)", "Grape___healthy",
            "Orange___Haunglongbing_(Citrus_greening)", "Peach___Bacterial_spot", "Peach___healthy",
            "Pepper,_bell___Bacterial_spot", "Pepper,_bell___healthy",
            "Potato___Early_blight", "Potato___Late_blight", "Potato___healthy",
            "Raspberry___healthy", "Soybean___healthy", "Squash___Powdery_mildew",
            "Strawberry___Leaf_scorch", "Strawberry___healthy",
            "Tomato___Bacterial_spot", "Tomato___Early_blight", "Tomato___Late_blight",
            "Tomato___Leaf_Mold", "Tomato___Septoria_leaf_spot", "Tomato___Spider_mites Two-spotted_spider_mite",
            "Tomato___Target_Spot", "Tomato___Tomato_Yellow_Leaf_Curl_Virus", "Tomato___Tomato_mosaic_virus", "Tomato___healthy"
        ]
        return _class_names

    def get_class_names(self) -> List[str]:
        return self._load_class_names()

    def _load_model(self):
        global _model, _model_backend
        if _model is not None:
            return _model, _model_backend

        with _model_lock:
            if _model is not None:
                return _model, _model_backend

            class_names = self.get_class_names()
            num_classes = len(class_names)

            # 1. Attempt TensorFlow/Keras (.keras / .h5)
            keras_path = settings.get_model_path()
            if os.path.exists(keras_path):
                try:
                    logger.info(f"Loading TensorFlow/Keras model: {keras_path}")
                    try:
                        import tensorflow as tf
                        model = tf.keras.models.load_model(keras_path, compile=False)
                    except ImportError:
                        os.environ.setdefault("KERAS_BACKEND", "torch")
                        import keras
                        model = keras.models.load_model(keras_path, compile=False)

                    dummy = np.zeros((1, 224, 224, 3), dtype="float32")
                    model.predict(dummy, verbose=0)
                    _model = model
                    _model_backend = "tensorflow"
                    logger.info("TensorFlow/Keras EfficientNetB0 initialized.")
                    return _model, _model_backend
                except Exception as e:
                    logger.warning(f"Failed to load Keras model at {keras_path}: {e}")

            # 2. Attempt PyTorch (.pth)
            pth_candidates = [
                Path(keras_path).with_suffix(".pth"),
                Path(__file__).resolve().parent.parent / "models" / "plant_disease_model.pth"
            ]
            for pth_path in pth_candidates:
                if pth_path.exists():
                    try:
                        logger.info(f"Loading PyTorch EfficientNetB0 weights: {pth_path}")
                        import torch
                        import torch.nn as nn
                        from torchvision import models

                        m = models.efficientnet_b0(weights=None)
                        in_features = m.classifier[1].in_features
                        m.classifier = nn.Sequential(
                            nn.Dropout(p=0.3, inplace=False),
                            nn.Linear(in_features, 256),
                            nn.BatchNorm1d(256),
                            nn.ReLU(inplace=False),
                            nn.Dropout(p=0.2, inplace=False),
                            nn.Linear(256, num_classes)
                        )
                        state = torch.load(str(pth_path), map_location=torch.device("cpu"))
                        m.load_state_dict(state)
                        m.eval()
                        _model = m
                        _model_backend = "pytorch"
                        logger.info("PyTorch EfficientNetB0 initialized.")
                        return _model, _model_backend
                    except Exception as e:
                        logger.warning(f"Failed to load PyTorch weights from {pth_path}: {e}")

            logger.info("No trained weights found. System ready for training ('python training/train_model.py').")
            _model = None
            _model_backend = "unloaded"
            return None, "unloaded"

    def predict(self, img_batch: np.ndarray) -> Tuple[str, float, List[Dict[str, Any]], bool]:
        """
        Executes model inference on a preprocessed (1, 224, 224, 3) image batch.
        Returns: (top_class_name, confidence_percent, top_3_predictions, is_model_live)
        """
        model, backend = self._load_model()
        class_names = self.get_class_names()
        num_classes = len(class_names)

        probabilities = None

        if backend == "tensorflow" and model is not None:
            try:
                raw_preds = model.predict(img_batch, verbose=0)[0]
                probabilities = np.array(raw_preds, dtype=np.float32)
            except Exception as e:
                logger.error(f"TensorFlow inference failed: {e}")

        elif backend == "pytorch" and model is not None:
            try:
                import torch
                # (1, 224, 224, 3) -> (1, 3, 224, 224) with ImageNet normalization
                img_t = torch.from_numpy(img_batch).permute(0, 3, 1, 2).float() / 255.0
                mean = torch.tensor([0.485, 0.456, 0.406]).view(1, 3, 1, 1)
                std = torch.tensor([0.229, 0.224, 0.225]).view(1, 3, 1, 1)
                img_norm = (img_t - mean) / std

                with torch.no_grad():
                    logits = model(img_norm)
                    probs = torch.nn.functional.softmax(logits[0], dim=0).cpu().numpy()
                    probabilities = probs
            except Exception as e:
                logger.error(f"PyTorch inference failed: {e}")

        is_live = probabilities is not None

        # If model is unavailable or inference failed, use deterministic heuristic for testing
        if probabilities is None:
            seed = int(np.abs(img_batch.mean() * 100000)) % 10000
            rng = np.random.RandomState(seed)
            raw_scores = rng.dirichlet(np.ones(num_classes) * 0.2)
            top_idx = int(rng.choice(num_classes))
            raw_scores[top_idx] += 4.0
            probabilities = raw_scores / np.sum(raw_scores)

        # Compute top index and confidence
        top_idx = int(np.argmax(probabilities))
        top_class = class_names[top_idx] if top_idx < len(class_names) else "Tomato___Early_blight"
        top_conf = float(probabilities[top_idx] * 100.0)

        # Compute top 3 predictions
        sorted_indices = np.argsort(probabilities)[::-1]
        top_3: List[Dict[str, Any]] = []

        for idx in sorted_indices:
            if idx < len(class_names):
                c_name = class_names[idx]
                if c_name == "PlantVillage":
                    continue
                parsed = disease_service.parse_class_name(c_name)
                conf_val = round(float(probabilities[idx] * 100.0), 2)
                top_3.append({
                    "class_name": c_name,
                    "plant": parsed["plant"],
                    "disease": parsed["disease"],
                    "confidence": conf_val
                })
                if len(top_3) >= 3:
                    break

        return top_class, round(top_conf, 2), top_3, is_live

    def get_model_status(self) -> Dict[str, Any]:
        _, backend = self._load_model()
        return {
            "status": "ready" if backend in ["tensorflow", "pytorch"] else "training_required",
            "backend": f"EfficientNetB0 ({backend.capitalize() if backend else 'Unloaded'})",
            "architecture": "EfficientNetB0 (Transfer Learning)",
            "num_classes": len(self.get_class_names()),
            "classes_file": os.path.exists(settings.get_class_path()),
            "model_file": os.path.exists(settings.get_model_path()) or os.path.exists(str(Path(settings.get_model_path()).with_suffix(".pth"))),
        }


model_service = ModelService()
