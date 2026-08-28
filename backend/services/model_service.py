import os
import json
import logging
import threading
from typing import List, Dict, Any, Tuple, Optional
import numpy as np
from backend.config import settings
from backend.services.disease_service import disease_service

logger = logging.getLogger("leafguard.model_service")

# Singleton state
_model = None
_model_backend = None  # 'tensorflow', 'pytorch', or None
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

            # 1. Attempt TensorFlow/Keras model loading (.keras / .h5)
            keras_path = settings.get_model_path()
            if os.path.exists(keras_path):
                try:
                    logger.info(f"Loading TensorFlow/Keras model: {keras_path}")
                    import tensorflow as tf
                    model = tf.keras.models.load_model(keras_path, compile=False)
                    # Warmup run
                    dummy = np.zeros((1, 224, 224, 3), dtype="float32")
                    model.predict(dummy, verbose=0)
                    _model = model
                    _model_backend = "tensorflow"
                    logger.info("TensorFlow/Keras model initialized successfully.")
                    return _model, _model_backend
                except Exception as e:
                    logger.warning(f"Failed to load TensorFlow model at {keras_path}: {e}")

            # 2. Attempt PyTorch fallback model loading (.pth)
            alt_pth = os.path.join(os.path.dirname(keras_path), "final_plant_model.pth")
            ml_pth = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ml", "output", "final_plant_model.pth")
            
            pth_candidates = [alt_pth, ml_pth]
            for pth_path in pth_candidates:
                if os.path.exists(pth_path):
                    try:
                        logger.info(f"Loading PyTorch fallback model from: {pth_path}")
                        import torch
                        import torch.nn as nn
                        from torchvision import models

                        class_names = self.get_class_names()
                        state_dict = torch.load(pth_path, map_location=torch.device("cpu"))
                        ckpt_classes = state_dict.get("classifier.3.weight", torch.zeros((len(class_names), 1))).shape[0]

                        loaded = None
                        for arch_fn in [models.mobilenet_v3_large, models.mobilenet_v3_small]:
                            try:
                                m = arch_fn(weights=None)
                                in_features = m.classifier[3].in_features
                                m.classifier[3] = nn.Linear(in_features, ckpt_classes)
                                m.load_state_dict(state_dict)
                                m.eval()
                                loaded = m
                                break
                            except Exception:
                                continue

                        if loaded is not None:
                            _model = loaded
                            _model_backend = "pytorch"
                            logger.info(f"PyTorch model loaded successfully with {ckpt_classes} classes.")
                            return _model, _model_backend
                    except Exception as e:
                        logger.warning(f"Failed to load PyTorch model from {pth_path}: {e}")

            logger.warning("No pre-trained ML model weight file found. System is ready for training.")
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
                # Convert (1, 224, 224, 3) to PyTorch tensor (1, 3, 224, 224) with standard normalization
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

        # If model is unavailable or inference failed, use deterministic heuristic for testing
        is_live = probabilities is not None
        if probabilities is None:
            # Generate deterministic fallback probabilities based on image byte distribution
            seed = int(np.abs(img_batch.mean() * 100000)) % 10000
            rng = np.random.RandomState(seed)
            raw_scores = rng.dirichlet(np.ones(num_classes) * 0.2)
            # Give primary class highest weight
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
            "backend": backend,
            "architecture": "EfficientNetB0 (TensorFlow/Keras)",
            "num_classes": len(self.get_class_names()),
            "classes_file": os.path.exists(settings.get_class_path()),
            "model_file": os.path.exists(settings.get_model_path()),
        }


model_service = ModelService()
