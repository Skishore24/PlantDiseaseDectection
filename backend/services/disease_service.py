import os
import json
import logging
from typing import Dict, Any, List, Optional
from backend.config import settings

logger = logging.getLogger("leafguard.disease_service")


class DiseaseService:
    def __init__(self):
        self._disease_info: Dict[str, Dict[str, Any]] = {}
        self._load_disease_info()

    def _load_disease_info(self):
        """Loads disease metadata from disease_info.json."""
        path = settings.get_disease_info_path()
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    self._disease_info = json.load(f)
                logger.info(f"Loaded disease metadata for {len(self._disease_info)} classes from {path}")
            except Exception as e:
                logger.error(f"Error loading disease_info.json from {path}: {e}")
                self._disease_info = {}
        else:
            logger.warning(f"Disease info file not found at {path}. Dynamic fallbacks will be used.")

    def parse_class_name(self, raw_class: str) -> Dict[str, str]:
        """
        Parses raw class names like 'Tomato___Early_blight' into {'plant': 'Tomato', 'disease': 'Early Blight'}.
        """
        if "___" in raw_class:
            parts = raw_class.split("___", 1)
            raw_plant = parts[0]
            raw_disease = parts[1]
        elif "__" in raw_class:
            parts = raw_class.split("__", 1)
            raw_plant = parts[0]
            raw_disease = parts[1]
        elif "_" in raw_class:
            parts = raw_class.split("_", 1)
            raw_plant = parts[0]
            raw_disease = parts[1]
        else:
            raw_plant = "Plant"
            raw_disease = raw_class

        # Clean formatting
        clean_plant = (
            raw_plant
            .replace("Pepper,_bell", "Bell Pepper")
            .replace("Pepper__bell", "Bell Pepper")
            .replace("Pepper", "Bell Pepper")
            .replace("Corn_(maize)", "Corn")
            .replace("Cherry_(including_sour)", "Cherry")
            .replace("_", " ")
            .strip()
        )

        clean_disease = (
            raw_disease
            .replace("_", " ")
            .replace("  ", " ")
            .strip()
        )

        if clean_disease.lower() == "healthy":
            clean_disease = "Healthy"
        elif not clean_disease:
            clean_disease = "General Condition"

        return {
            "plant": clean_plant,
            "disease": clean_disease
        }

    def get_disease_info(self, class_name: str) -> Dict[str, Any]:
        """
        Retrieves agronomic information for a given disease class.
        """
        if not self._disease_info:
            self._load_disease_info()

        # Direct match
        if class_name in self._disease_info:
            info = dict(self._disease_info[class_name])
            return info

        # Fuzzy / normalized match
        normalized_target = class_name.lower().replace("_", "").replace(",", "")
        for k, v in self._disease_info.items():
            if k.lower().replace("_", "").replace(",", "") == normalized_target:
                return dict(v)

        # Fallback generation for unrecognized classes
        parsed = self.parse_class_name(class_name)
        is_healthy = "healthy" in class_name.lower() or parsed["disease"].lower() == "healthy"

        if is_healthy:
            return {
                "plant": parsed["plant"],
                "disease": "Healthy",
                "severity": "Optimal Health",
                "description": f"The {parsed['plant']} leaf shows normal cellular structure, vibrant chlorophyll pigmentation, and no symptoms of disease or infection.",
                "symptoms": [
                  "Vibrant green leaf blades with crisp margins",
                  "No spots, necrotic lesions, or viral mottling"
                ],
                "causes": [
                  "Optimal soil moisture, balanced nutrition, and appropriate crop care"
                ],
                "treatment": [
                  "No chemical or disease treatment required",
                  "Maintain regular hydration and organic care routine"
                ],
                "prevention": [
                  "Monitor foliage weekly for early pest or disease signs",
                  "Water at root level to prevent foliage humidity"
                ]
            }
        else:
            return {
                "plant": parsed["plant"],
                "disease": parsed["disease"],
                "severity": "Moderate",
                "description": f"Diagnostic analysis detected symptoms consistent with {parsed['disease']} on {parsed['plant']} foliage.",
                "symptoms": [
                  f"Discoloration, spotting, or leaf lesions characteristic of {parsed['disease']}"
                ],
                "causes": [
                  "Fungal, bacterial, or environmental stress pathogen"
                ],
                "treatment": [
                  "Prune off severely affected or spotted leaves and dispose in trash (do not compost)",
                  "Apply organic copper fungicide or bio-fungicide as a protective foliar spray",
                  "Consult a local agricultural extension expert before applying commercial synthetic chemical pesticides"
                ],
                "prevention": [
                  "Avoid overhead sprinkler watering to keep leaves dry",
                  "Ensure good crop spacing for adequate airflow",
                  "Practice 2-3 year crop rotation with non-host species"
                ]
            }


disease_service = DiseaseService()
