import os
import json
import logging
import threading
import numpy as np
from PIL import Image
from datetime import datetime
from typing import List, Dict, Any, Optional

from fastapi.concurrency import run_in_threadpool

from app.core.config import settings
from app.core.agronomy import get_agronomic_advisory
from app.db.mongo import mongo_db

logger = logging.getLogger(__name__)

import tempfile

def _get_history_file() -> str:
    try:
        log_dir = os.path.join(os.path.dirname(__file__), "..", "..", "logs")
        os.makedirs(log_dir, exist_ok=True)
        return os.path.join(log_dir, "history_store.json")
    except Exception:
        return os.path.join(tempfile.gettempdir(), "history_store.json")


def _load_local_history() -> List[Dict[str, Any]]:
    filepath = _get_history_file()
    if not os.path.exists(filepath):
        return []
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Failed loading local history file: {e}")
        return []


def _save_local_history(history: List[Dict[str, Any]]):
    try:
        filepath = _get_history_file()
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(history, f, indent=2)
    except Exception as e:
        logger.error(f"Failed saving local history file: {e}")

# ─────────────────────────────────────────────
# ML CONSTANTS & SINGLETON STATE
# ─────────────────────────────────────────────
IMG_SIZE = (224, 224)
_model = None
_model_type = None  # 'pytorch', 'tensorflow', 'onnx', or 'demo'
_model_lock = threading.Lock()
_class_names = None

# Attempt ML Framework Imports
HAS_TORCH = False
HAS_TF = False
HAS_ONNX = False

try:
    import torch
    import torch.nn as nn
    from torchvision import transforms, models
    HAS_TORCH = True
except Exception:
    torch = None

try:
    import tensorflow as tf
    from tensorflow.keras.preprocessing import image
    from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
    HAS_TF = True
except Exception:
    tf = None

try:
    import onnxruntime as ort
    HAS_ONNX = True
except Exception:
    ort = None


def _load_local_history() -> List[Dict[str, Any]]:
    if not os.path.exists(HISTORY_FILE):
        return []
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def _save_local_history(item: Dict[str, Any]):
    try:
        current = _load_local_history()
        current.insert(0, item)
        # Keep up to 200 records
        current = current[:200]
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(current, f, indent=2)
    except Exception as e:
        logger.error(f"Failed to save local history: {e}")


class PredictionService:
    def __init__(self):
        self.db_name = settings.DATABASE_NAME

    def _get_collection(self):
        if mongo_db.db is None:
            return None
        try:
            return mongo_db.db["predictions"]
        except Exception:
            return None

    def _get_class_names(self) -> List[str]:
        global _class_names
        if _class_names is not None:
            return _class_names

        try:
            class_path = settings.get_class_path()
            if os.path.exists(class_path):
                with open(class_path, "r") as f:
                    raw_classes = json.load(f)
                    _class_names = [c for c in raw_classes if c != "PlantVillage"]
                logger.info(f"✅ Loaded {len(_class_names)} classes from {class_path}")
            else:
                logger.warning(f"⚠️ Classes file missing at {class_path}. Using standard plant disease defaults.")
                _class_names = [
                    "Pepper__bell___Bacterial_spot", "Pepper__bell___healthy",
                    "Potato___Early_blight", "Potato___Late_blight", "Potato___healthy",
                    "Tomato_Bacterial_spot", "Tomato_Early_blight", "Tomato_Late_blight",
                    "Tomato_Leaf_Mold", "Tomato_Septoria_leaf_spot", "Tomato_Spider_mites_Two_spotted_spider_mite",
                    "Tomato__Target_Spot", "Tomato__Tomato_YellowLeaf__Curl_Virus", "Tomato__Tomato_mosaic_virus",
                    "Tomato_healthy"
                ]
        except Exception as e:
            logger.exception(f"Failed to load class names: {e}")
            _class_names = []

        if not _class_names:
            _class_names = [
                "Pepper__bell___Bacterial_spot", "Pepper__bell___healthy",
                "Potato___Early_blight", "Potato___Late_blight", "Potato___healthy",
                "Tomato_Bacterial_spot", "Tomato_Early_blight", "Tomato_Late_blight",
                "Tomato_Leaf_Mold", "Tomato_Septoria_leaf_spot", "Tomato_Spider_mites_Two_spotted_spider_mite",
                "Tomato__Target_Spot", "Tomato__Tomato_YellowLeaf__Curl_Virus", "Tomato__Tomato_mosaic_virus",
                "Tomato_healthy"
            ]
        return _class_names

    def _load_model(self):
        global _model, _model_type
        if _model is not None:
            return _model, _model_type

        with _model_lock:
            if _model is not None:
                return _model, _model_type

            # 1. Check PyTorch (.pth)
            pth_path = os.path.join(os.path.dirname(settings.get_model_path()), "final_plant_model.pth")
            if HAS_TORCH and os.path.exists(pth_path):
                try:
                    logger.info(f"🔥 Loading PyTorch Model: {pth_path}")
                    class_names = self._get_class_names()
                    num_classes = len(class_names) if class_names else 15

                    state_dict = torch.load(pth_path, map_location=torch.device("cpu"))
                    ckpt_num_classes = state_dict.get("classifier.3.weight", torch.zeros((num_classes, 1))).shape[0]

                    loaded_model = None
                    for arch_fn in [models.mobilenet_v3_large, models.mobilenet_v3_small]:
                        try:
                            m = arch_fn(weights=None)
                            in_features = m.classifier[3].in_features
                            m.classifier[3] = nn.Linear(in_features, ckpt_num_classes)
                            m.load_state_dict(state_dict)
                            loaded_model = m
                            logger.info(f"✅ PyTorch model ({arch_fn.__name__}) loaded successfully with {ckpt_num_classes} classes!")
                            break
                        except Exception as ex:
                            logger.debug(f"Failed loading with {arch_fn.__name__}: {ex}")

                    if loaded_model is not None:
                        loaded_model.eval()
                        _model = loaded_model
                        _model_type = "pytorch"
                        return _model, _model_type
                except Exception as e:
                    logger.error(f"Failed loading PyTorch model: {e}")

            # 2. Check TensorFlow (.keras)
            keras_path = settings.get_model_path()
            if HAS_TF and os.path.exists(keras_path):
                try:
                    logger.info(f"🔥 Loading TensorFlow Model: {keras_path}")
                    model = tf.keras.models.load_model(keras_path)
                    dummy = np.zeros((1, *IMG_SIZE, 3), dtype="float32")
                    model.predict(dummy, verbose=0)
                    _model = model
                    _model_type = "tensorflow"
                    logger.info("✅ TensorFlow model ready!")
                    return _model, _model_type
                except Exception as e:
                    logger.error(f"Failed loading TensorFlow model: {e}")

            # 3. Fallback to Demo Mode
            logger.warning("⚠️ No live ML weight file found or frameworks unavailable. Running in Demo Mode.")
            _model = None
            _model_type = "demo"
            return None, "demo"

    def _mock_inference(self, img_path: Optional[str] = None) -> Dict[str, Any]:
        """Generates plausible diagnosis when model weight file is unpopulated"""
        class_names = self._get_class_names()
        import random
        disease = random.choice(class_names)
        confidence = random.uniform(89.5, 98.8)

        others = [c for c in class_names if c != disease and c != "PlantVillage"]
        top_others = random.sample(others, min(2, len(others)))
        top3 = [{"name": disease, "conf": round(confidence, 2)}]
        for o in top_others:
            top3.append({"name": o, "conf": round(random.uniform(0.5, 7.5), 2)})

        advisory = get_agronomic_advisory(disease)

        return {
            "disease": disease,
            "confidence": round(confidence, 2),
            "top3": top3,
            "advisory": advisory,
            "demo": True
        }

    def _run_inference(self, img_path: str) -> Dict[str, Any]:
        model, m_type = self._load_model()
        class_names = self._get_class_names()

        if m_type == "demo" or model is None:
            return self._mock_inference(img_path)

        try:
            pil_img = Image.open(img_path).convert("RGB").resize(IMG_SIZE)

            if m_type == "pytorch" and HAS_TORCH:
                preprocess = transforms.Compose([
                    transforms.ToTensor(),
                    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
                ])
                tensor = preprocess(pil_img).unsqueeze(0)
                with torch.no_grad():
                    outputs = model(tensor)
                    probabilities = torch.nn.functional.softmax(outputs[0], dim=0).numpy()

            elif m_type == "tensorflow" and HAS_TF:
                img_array = np.array(pil_img, dtype=np.float32)
                img_array = np.expand_dims(img_array, axis=0)
                img_array = preprocess_input(img_array)
                probabilities = model.predict(img_array, verbose=0)[0]

            else:
                return self._mock_inference(img_path)

            idx = int(np.argmax(probabilities))
            confidence = float(probabilities[idx] * 100)

            # Top 3 probabilities excluding invalid non-disease class names
            sorted_idx = probabilities.argsort()[::-1]
            top3 = []
            for i in sorted_idx:
                if i < len(class_names):
                    name = class_names[i]
                    if name == "PlantVillage":
                        continue
                    conf = float(probabilities[i] * 100)
                    top3.append({"name": name, "conf": round(conf, 2)})
                    if len(top3) >= 3:
                        break

            disease = class_names[idx] if idx < len(class_names) else "Unknown Disease"
            if disease == "PlantVillage" and len(top3) > 0:
                disease = top3[0]["name"]
                confidence = top3[0]["conf"]
            advisory = get_agronomic_advisory(disease)

            low_confidence_warning = None
            if confidence < 55.0:
                low_confidence_warning = (
                    f"Low confidence diagnosis ({confidence:.1f}% match). "
                    "The leaf may belong to an unsupported plant species (e.g. Pear tree, which is not in the 38 trained dataset classes) "
                    "or the visual symptoms may be ambiguous."
                )
                if isinstance(advisory, dict) and "description" in advisory:
                    advisory["warning"] = low_confidence_warning

            return {
                "disease": disease,
                "confidence": round(confidence, 2),
                "top3": top3,
                "advisory": advisory,
                "low_confidence_warning": low_confidence_warning,
                "demo": False
            }

        except Exception as e:
            logger.error(f"Inference processing error: {e}")
            return self._mock_inference(img_path)

    async def create_prediction(self, img_path: str, user_id: Optional[str] = None) -> Dict[str, Any]:
        try:
            result = await run_in_threadpool(self._run_inference, img_path)

            if "error" in result:
                return result

            timestamp_iso = datetime.utcnow().isoformat()
            filename = os.path.basename(img_path)
            img_url = f"/uploads/{filename}"
            result["img_url"] = img_url

            record = {
                "user_id": user_id or "unknown",
                "disease": result["disease"],
                "confidence": result["confidence"],
                "top3": result["top3"],
                "scanned_at": timestamp_iso,
                "timestamp": timestamp_iso,
                "img_path": filename,
                "img_url": img_url,
            }

            # Save locally for guaranteed instant persistence
            _save_local_history(record)

            # Save to MongoDB Atlas collection if available
            coll = self._get_collection()
            if coll is not None:
                try:
                    db_record = dict(record)
                    db_record["timestamp"] = datetime.utcnow()
                    coll.insert_one(db_record)
                except Exception as e:
                    logger.error(f"Database insertion failed: {e}")

            return result
        except Exception as e:
            logger.exception("Prediction service error")
            return {"error": "Internal service error"}

    def get_user_history(self, user_id: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        coll = self._get_collection()
        mongo_items = []
        if coll is not None:
            try:
                query = {"user_id": user_id} if user_id and user_id != "unknown" else {}
                cursor = coll.find(query).sort("timestamp", -1).limit(limit)
                for item in list(cursor):
                    if "_id" in item:
                        item["id"] = str(item["_id"])
                        del item["_id"]
                    if "timestamp" in item and isinstance(item["timestamp"], datetime):
                        item["scanned_at"] = item["timestamp"].isoformat()
                    mongo_items.append(item)
            except Exception as e:
                logger.error(f"Error fetching history from MongoDB: {e}")

        # Combine with local persistent store
        local_items = _load_local_history()
        if user_id and user_id != "unknown":
            filtered_local = [x for x in local_items if x.get("user_id") == user_id or x.get("user_id") == "unknown"]
            if filtered_local:
                local_items = filtered_local

        all_items = mongo_items + local_items
        seen = set()
        unique = []
        for idx, it in enumerate(all_items):
            key = (it.get("disease"), it.get("scanned_at"))
            if key not in seen:
                seen.add(key)
                if not it.get("id"):
                    it["id"] = f"{it.get('disease')}-{it.get('scanned_at') or idx}"
                if not it.get("img_url") and it.get("img_path"):
                    it["img_url"] = f"/uploads/{it['img_path']}"
                unique.append(it)

        return unique[:limit]

    def delete_history_item(self, target_id: str, user_id: Optional[str] = None) -> bool:
        deleted = False
        coll = self._get_collection()

        # 1. Try deleting from MongoDB
        if coll is not None:
            try:
                from bson import ObjectId
                if ObjectId.is_valid(target_id):
                    res = coll.delete_one({"_id": ObjectId(target_id)})
                    if res.deleted_count > 0:
                        deleted = True
                else:
                    res = coll.delete_one({"$or": [{"id": target_id}, {"disease": target_id}]})
                    if res.deleted_count > 0:
                        deleted = True
            except Exception as e:
                logger.error(f"Error deleting history item from MongoDB: {e}")

        # 2. Delete from local JSON file
        try:
            local_items = _load_local_history()
            new_local = []
            for x in local_items:
                item_id = x.get("id") or f"{x.get('disease')}-{x.get('scanned_at') or x.get('timestamp')}"
                if item_id == target_id or x.get("id") == target_id:
                    deleted = True
                    continue
                new_local.append(x)

            with open(HISTORY_FILE, "w", encoding="utf-8") as f:
                json.dump(new_local, f, indent=2)
        except Exception as e:
            logger.error(f"Error updating local history file: {e}")

        return deleted

    def delete_history_batch(self, target_ids: List[str], user_id: Optional[str] = None) -> int:
        count = 0
        for tid in target_ids:
            if self.delete_history_item(tid, user_id):
                count += 1
        return count

    def clear_user_history(self, user_id: Optional[str] = None) -> bool:
        coll = self._get_collection()
        if coll is not None:
            try:
                res = coll.delete_many({})
                logger.info(f"Cleared {res.deleted_count} documents from MongoDB predictions collection.")
            except Exception as e:
                logger.error(f"Error clearing MongoDB history: {e}")

        try:
            with open(HISTORY_FILE, "w", encoding="utf-8") as f:
                json.dump([], f)
            logger.info("Cleared local history_store.json file.")
        except Exception as e:
            logger.error(f"Error clearing local history file: {e}")

        return True

    def get_stats(self) -> Dict[str, Any]:
        coll = self._get_collection()
        if coll is not None:
            try:
                total = coll.count_documents({})
                if total > 0:
                    pipeline = [
                        {"$group": {"_id": "$disease", "count": {"$sum": 1}}},
                        {"$sort": {"count": -1}},
                        {"$limit": 1}
                    ]
                    top_res = list(coll.aggregate(pipeline))
                    top_disease = top_res[0]["_id"] if top_res else None

                    avg_pipeline = [{"$group": {"_id": None, "avg_conf": {"$avg": "$confidence"}}}]
                    avg_res = list(coll.aggregate(avg_pipeline))
                    avg_conf = round(avg_res[0]["avg_conf"], 1) if avg_res else 0.0

                    return {
                        "total_predictions": total,
                        "top_disease": top_disease,
                        "avg_confidence": avg_conf
                    }
            except Exception as e:
                logger.error(f"MongoDB stats error: {e}")

        # Local stats fallback
        local_items = _load_local_history()
        if not local_items:
            return {"total_predictions": 0, "top_disease": None, "avg_confidence": 0.0}

        total = len(local_items)
        conf_sum = sum(x.get("confidence", 0) for x in local_items)
        avg_conf = round(conf_sum / total, 1)

        counts = {}
        for x in local_items:
            d = x.get("disease")
            if d:
                counts[d] = counts.get(d, 0) + 1
        top_disease = max(counts, key=counts.get) if counts else None

        return {
            "total_predictions": total,
            "top_disease": top_disease,
            "avg_confidence": avg_conf
        }

    def get_analytics_telemetry(self) -> Dict[str, Any]:
        items = self.get_user_history(limit=200)
        total_scans = len(items)
        healthy_scans = sum(1 for x in items if "healthy" in (x.get("disease", "")).lower())
        diseased_scans = total_scans - healthy_scans

        conf_sum = sum(x.get("confidence", 0) for x in items)
        avg_confidence = round(conf_sum / total_scans, 1) if total_scans > 0 else 0.0

        # Disease distribution
        counts: Dict[str, int] = {}
        for x in items:
            d = x.get("disease", "Unknown")
            clean_d = d.replace("__", " ").replace("_", " ") if isinstance(d, str) else str(d)
            counts[clean_d] = counts.get(clean_d, 0) + 1


        top_disease = max(counts, key=counts.get) if counts else "None"

        palette = ["#DC2626", "#D97706", "#16A34A", "#7C3AED", "#2563EB", "#059669"]
        disease_dist = []
        idx = 0
        for name, count in sorted(counts.items(), key=lambda x: x[1], reverse=True)[:5]:
            disease_dist.append({
                "name": name,
                "count": count,
                "color": palette[idx % len(palette)]
            })
            idx += 1

        # Crop Health
        crops = ["Potato", "Tomato", "Pepper"]
        crop_radar = []
        for c in crops:
            c_scans = [x for x in items if c.lower() in (x.get("disease", "")).lower()]
            c_total = len(c_scans)
            c_healthy = sum(1 for x in c_scans if "healthy" in (x.get("disease", "")).lower())
            health_pct = round((c_healthy / c_total * 100)) if c_total > 0 else 85
            crop_radar.append({
                "crop": c,
                "health": health_pct,
                "scans": c_total
            })

        return {
            "totalScans": total_scans,
            "healthyScans": healthy_scans,
            "diseasedScans": diseased_scans,
            "avgConfidence": avg_confidence,
            "topDisease": top_disease,
            "diseaseDistribution": disease_dist,
            "cropHealthRadar": crop_radar,
            "history": items[:20]
        }

    def get_model_status(self) -> str:
        _, m_type = self._load_model()
        return "live" if m_type in ["pytorch", "tensorflow", "onnx"] else "demo"


prediction_service = PredictionService()