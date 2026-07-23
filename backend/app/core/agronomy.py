# app/core/agronomy.py
"""
Botanical Agronomic Knowledge Base.
Provides structured diagnostic metadata, classification, health risks,
spread vectors, organic/chemical treatment plans, and preventive care guidelines
for plant disease classes.
"""

from typing import Dict, Any

AGRONOMIC_KNOWLEDGE_BASE: Dict[str, Dict[str, Any]] = {
    "Pepper__bell___Bacterial_spot": {
        "display_name": "Bell Pepper Bacterial Spot",
        "plant_species": "Bell Pepper (Capsicum annuum)",
        "type": "Bacterial Infection",
        "severity": "High Risk",
        "spread": "Splashing Water & Seeds",
        "treatment": "Copper-based bactericides & pruning infected foliage",
        "prevention": "Use pathogen-free seeds, avoid overhead irrigation, and crop rotation for 2-3 years.",
        "description": "Xanthomonas bacterial spot causes water-soaked spots on leaves and fruit, leading to defoliation and severe yield drop under warm, humid conditions."
    },
    "Pepper__bell___healthy": {
        "display_name": "Bell Pepper (Healthy)",
        "plant_species": "Bell Pepper (Capsicum annuum)",
        "type": "Healthy Crop",
        "severity": "Optimal Health",
        "spread": "None",
        "treatment": "Maintain balanced care routine",
        "prevention": "Ensure well-drained soil, consistent watering at root level, and balanced N-P-K fertilization.",
        "description": "Foliage exhibits vibrant green pigmentation with no signs of fungal, bacterial, or pest degradation."
    },
    "Potato___Early_blight": {
        "display_name": "Potato Early Blight",
        "plant_species": "Potato (Solanum tuberosum)",
        "type": "Fungal Infection",
        "severity": "Moderate Risk",
        "spread": "Wind-borne Spores & Soil",
        "treatment": "Apply Chlorothalonil or Mancozeb protective fungicides",
        "prevention": "Remove crop debris after harvest, maintain adequate nitrogen levels, and water early in the day.",
        "description": "Alternaria solani causes characteristic target-board brown spots with yellow halos on older foliage, progressing upwards if untreated."
    },
    "Potato___Late_blight": {
        "display_name": "Potato Late Blight",
        "plant_species": "Potato (Solanum tuberosum)",
        "type": "Oomycete / Fungal",
        "severity": "Critical Risk",
        "spread": "Wind & Rain Splashing",
        "treatment": "Systemic fungicides (e.g. Metalaxyl, Dimethomorph)",
        "prevention": "Plant resistant cultivars, destroy volunteer potatoes, and apply preventive sprays during cool damp weather.",
        "description": "Phytophthora infestans causes rapid dark water-soaked leaf decay with white fuzzy fungal growth under humid conditions. Can destroy fields within days."
    },
    "Potato___healthy": {
        "display_name": "Potato (Healthy)",
        "plant_species": "Potato (Solanum tuberosum)",
        "type": "Healthy Crop",
        "severity": "Optimal Health",
        "spread": "None",
        "treatment": "Continue preventive monitoring",
        "prevention": "Provide adequate hilling, drip irrigation, and monitor weekly for early pest/disease presence.",
        "description": "Foliage is robust and healthy with bright green turgid leaves free from lesions or discoloration."
    },
    "Tomato_Bacterial_spot": {
        "display_name": "Tomato Bacterial Spot",
        "plant_species": "Tomato (Solanum lycopersicum)",
        "type": "Bacterial Infection",
        "severity": "High Risk",
        "spread": "Rain Splashing & Tools",
        "treatment": "Apply copper hydroxide mixed with Mancozeb",
        "prevention": "Sanitize tools, practice strict crop rotation, and avoid working in wet foliage.",
        "description": "Xanthomonas species induce small, dark brown circular lesions on leaves and fruit, causing severe defoliation and sunscald."
    },
    "Tomato_Early_blight": {
        "display_name": "Tomato Early Blight",
        "plant_species": "Tomato (Solanum lycopersicum)",
        "type": "Fungal Infection",
        "severity": "Moderate Risk",
        "spread": "Airborne Spores & Soil Splash",
        "treatment": "Apply bio-fungicides (Bacillus subtilis) or Copper sprays",
        "prevention": "Mulch root zones to stop soil splash, stake plants upright, and prune lower 12 inches of leaves.",
        "description": "Alternaria solani creates concentric ring spots starting on lower leaves, causing premature yellowing and dropping."
    },
    "Tomato_Late_blight": {
        "display_name": "Tomato Late Blight",
        "plant_species": "Tomato (Solanum lycopersicum)",
        "type": "Oomycete / Fungal",
        "severity": "Critical Risk",
        "spread": "Wind-driven Spores",
        "treatment": "Remove infected plants immediately; spray Copper/Mancozeb",
        "prevention": "Ensure maximum air circulation, avoid leaf wetness, and grow certified disease-resistant seeds.",
        "description": "Phytophthora infestans attacks stems, leaves, and fruit rapidly under cool moist weather, creating dark greasy lesions."
    },
    "Tomato_Leaf_Mold": {
        "display_name": "Tomato Leaf Mold",
        "plant_species": "Tomato (Solanum lycopersicum)",
        "type": "Fungal Infection",
        "severity": "Moderate Risk",
        "spread": "High Humidity & Spores",
        "treatment": "Apply Sulfur or Copper fungicides",
        "prevention": "Maintain relative humidity below 85% in greenhouses, space foliage, and increase ventilation.",
        "description": "Passalora fulva causes pale green/yellow spots on upper leaf surfaces with olive-green velvety mold underneath."
    },
    "Tomato_Septoria_leaf_spot": {
        "display_name": "Tomato Septoria Leaf Spot",
        "plant_species": "Tomato (Solanum lycopersicum)",
        "type": "Fungal Infection",
        "severity": "Moderate Risk",
        "spread": "Splashing Water",
        "treatment": "Copper or Chlorothalonil fungicide spray",
        "prevention": "Mulch soil surface, avoid overhead watering, and weed Solanaceous wild plants nearby.",
        "description": "Septoria lycopersici forms numerous tiny dark spots with light grey centers on lower leaves, leading to leaf drop."
    },
    "Tomato_Spider_mites_Two_spotted_spider_mite": {
        "display_name": "Two-Spotted Spider Mites",
        "plant_species": "Tomato (Solanum lycopersicum)",
        "type": "Arthropod Pest Damage",
        "severity": "Moderate-High Risk",
        "spread": "Wind & Direct Contact",
        "treatment": "Apply Insecticidal Soap, Neem Oil, or Abamectin",
        "prevention": "Keep plants hydrated, spray underside of leaves with water jets, and release predatory mites (Phytoseiulus).",
        "description": "Tetranychus urticae causes fine yellow stippling on leaf tops and delicate silk webbing under leaves in dry hot conditions."
    },
    "Tomato__Target_Spot": {
        "display_name": "Tomato Target Spot",
        "plant_species": "Tomato (Solanum lycopersicum)",
        "type": "Fungal Infection",
        "severity": "Moderate Risk",
        "spread": "Airborne Spores",
        "treatment": "Apply Azoxystrobin or Chlorothalonil fungicides",
        "prevention": "Ensure good field drainage, remove plant debris, and avoid night watering.",
        "description": "Corynespora cassiicola causes brown necrotic spots with light centers and dark concentric circles, targeting foliage and fruit."
    },
    "Tomato__Tomato_YellowLeaf__Curl_Virus": {
        "display_name": "Tomato Yellow Leaf Curl Virus (TYLCV)",
        "plant_species": "Tomato (Solanum lycopersicum)",
        "type": "Viral Infection",
        "severity": "Critical Risk",
        "spread": "Bemisia tabaci (Whiteflies)",
        "treatment": "No cure for viral infection; control whitefly vector",
        "prevention": "Install fine mesh netting, use yellow sticky traps, and plant TYLCV-resistant hybrids.",
        "description": "Geminivirus causes extreme leaf curling, yellow margins, stunting, and severe reduction in flower/fruit set."
    },
    "Tomato__Tomato_mosaic_virus": {
        "display_name": "Tomato Mosaic Virus (ToMV)",
        "plant_species": "Tomato (Solanum lycopersicum)",
        "type": "Viral Infection",
        "severity": "High Risk",
        "spread": "Mechanical Contact & Tools",
        "treatment": "Disinfect all tools; rogue out infected plants",
        "prevention": "Wash hands before handling plants, sanitize pruning shears with 10% bleach, and use resistant varieties.",
        "description": "Tobamovirus causes mottled light/dark green mosaic patterns on leaves, leaf distortion, and stunted plant growth."
    },
    "Tomato_healthy": {
        "display_name": "Tomato (Healthy)",
        "plant_species": "Tomato (Solanum lycopersicum)",
        "type": "Healthy Crop",
        "severity": "Optimal Health",
        "spread": "None",
        "treatment": "Maintain balanced care routine",
        "prevention": "Prune suckers, support with stakes/cages, water deeply at soil line, and fertilize with calcium-rich nutrients.",
        "description": "Foliage shows vibrant deep green leaf structures, strong stems, and healthy blossom development."
    }
}


def get_agronomic_advisory(class_name: str) -> Dict[str, Any]:
    """
    Retrieves agronomic guidance for a given class name.
    Falls back to intelligent defaults if class is unknown.
    """
    if class_name in AGRONOMIC_KNOWLEDGE_BASE:
        return AGRONOMIC_KNOWLEDGE_BASE[class_name]

    # Clean formatting fallback for unrecognized classes
    clean_title = class_name.replace("__", " ").replace("_", " ").title().strip()
    is_healthy = "healthy" in class_name.lower()

    return {
        "display_name": clean_title,
        "plant_species": "Botanic Specimen",
        "type": "Healthy Crop" if is_healthy else "Pathogen Detected",
        "severity": "Optimal Health" if is_healthy else "Moderate Risk",
        "spread": "None" if is_healthy else "Airborne Spores & Contact",
        "treatment": "Maintain regular care routine" if is_healthy else "Apply broad-spectrum organic copper fungicide",
        "prevention": "Monitor leaves regularly and maintain balanced watering.",
        "description": f"Diagnosis result for {clean_title}."
    }
