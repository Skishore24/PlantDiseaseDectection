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
        global _model
        if _model is not None:
            return _model

        with _model_lock:
            if _model is not None:
                return _model

            class_names = self.get_class_names()
            num_classes = len(class_names)

            keras_path = settings.get_model_path()
            if os.path.exists(keras_path):
                try:
                    logger.info(f"Loading TensorFlow/Keras EfficientNetB0 model: {keras_path}")
                    try:
                        import tensorflow as tf
                        model = tf.keras.models.load_model(keras_path, compile=False)
                    except ImportError:
                        import keras
                        model = keras.models.load_model(keras_path, compile=False)

                    # Validate model output dimension
                    output_dim = model.output_shape[-1]
                    if output_dim != num_classes:
                        logger.error(
                            f"❌ Model artifact mismatch! Model output contains {output_dim} classes "
                            f"but class_names.json contains {num_classes} classes."
                        )
                        _model = None
                        return None

                    # Warmup prediction
                    dummy = np.zeros((1, 224, 224, 3), dtype="float32")
                    model.predict(dummy, verbose=0)
                    _model = model
                    logger.info(f"✅ TensorFlow/Keras EfficientNetB0 initialized successfully ({num_classes} classes).")
                    return _model
                except Exception as e:
                    logger.warning(f"Failed to load Keras model at {keras_path}: {e}")
                    _model = None
                    return None

            _model = None
            return None

    def is_ready(self) -> bool:
        """Returns True if the ML model is successfully loaded and ready for inference."""
        model = self._load_model()
        return model is not None

    def get_model(self):
        """Returns the loaded Keras model instance."""
        return self._load_model()

    def predict(self, img_batch: np.ndarray) -> Tuple[str, float, List[Dict[str, Any]], bool]:
        """
        Executes real neural model inference on a preprocessed (1, 224, 224, 3) image batch.
        Returns: (top_class_name, confidence_percent, top_3_predictions, is_model_live)
        Raises RuntimeError if model is unavailable.
        """
        model = self._load_model()
        if model is None:
            raise RuntimeError("Plant disease model is unavailable. Please train or deploy the model before making predictions.")

        class_names = self.get_class_names()
        num_classes = len(class_names)

        # Validate input shape
        if img_batch.shape != (1, 224, 224, 3):
            raise ValueError(f"Expected image batch shape (1, 224, 224, 3), received {img_batch.shape}")

        try:
            raw_preds = model.predict(img_batch, verbose=0)[0]
            probabilities = np.array(raw_preds, dtype=np.float32)
        except Exception as e:
            logger.error(f"TensorFlow inference failed: {e}")
            raise RuntimeError(f"Model prediction failed during inference: {e}")

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

        return top_class, round(top_conf, 2), top_3, True

    def get_model_status(self) -> Dict[str, Any]:
        is_live = self.is_ready()
        return {
            "status": "ready" if is_live else "training_required",
            "backend": "TensorFlow / Keras",
            "architecture": "EfficientNetB0 (Transfer Learning)",
            "num_classes": len(self.get_class_names()),
            "classes_file": os.path.exists(settings.get_class_path()),
            "model_file": os.path.exists(settings.get_model_path()),
        }


model_service = ModelService()
