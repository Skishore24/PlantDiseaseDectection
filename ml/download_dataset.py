import os
import sys
import shutil
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("DatasetDownloader")

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent
TARGET_DIR = BASE_DIR / "PlantVillage"

def download_plant_disease_dataset():
    """
    Downloads the PlantVillage dataset from Kaggle using kagglehub
    and organizes it into ml/PlantVillage directory.
    """
    logger.info("==================================================")
    logger.info("🌿 Plant AI - Kaggle Dataset Downloader")
    logger.info("==================================================")
    logger.info("Kaggle Dataset: emmarex/plantdisease")
    logger.info("Direct Link: https://www.kaggle.com/datasets/emmarex/plantdisease")
    logger.info("==================================================")

    try:
        import kagglehub
    except ImportError:
        logger.error("❌ 'kagglehub' package is missing. Install it using: pip install kagglehub")
        sys.exit(1)

    logger.info("Downloading dataset via kagglehub...")
    try:
        path = kagglehub.dataset_download("emmarex/plantdisease")
        logger.info(f"✅ Kaggle download complete. Stored at: {path}")

        download_path = Path(path)
        # Search for PlantVillage folder in downloaded files
        source_dir = None
        if (download_path / "PlantVillage").exists():
            source_dir = download_path / "PlantVillage"
        elif (download_path / "plantvillage").exists():
            source_dir = download_path / "plantvillage"
        elif (download_path / "PlantVillage_dataset").exists():
            source_dir = download_path / "PlantVillage_dataset"
        else:
            # Check subdirectories
            for item in download_path.rglob("*"):
                if item.is_dir() and item.name.lower() in ["plantvillage", "dataset", "PlantVillage_dataset"]:
                    source_dir = item
                    break

        if source_dir is None:
            source_dir = download_path

        logger.info(f"Organizing dataset from {source_dir} to {TARGET_DIR}...")
        TARGET_DIR.mkdir(parents=True, exist_ok=True)

        copied_count = 0
        for item in source_dir.iterdir():
            dest = TARGET_DIR / item.name
            if item.is_dir():
                if dest.exists():
                    shutil.rmtree(dest)
                shutil.copytree(item, dest)
                copied_count += 1
            elif item.is_file() and not dest.exists():
                shutil.copy2(item, dest)

        logger.info(f"✅ Dataset successfully initialized with {copied_count} class folders in {TARGET_DIR}")

    except Exception as e:
        logger.error(f"❌ Failed to download dataset via kagglehub: {e}")
        logger.info("💡 Manual Download Instructions:")
        logger.info("1. Visit: https://www.kaggle.com/datasets/emmarex/plantdisease")
        logger.info(f"2. Extract the dataset folder directly into: {TARGET_DIR}")

if __name__ == "__main__":
    download_plant_disease_dataset()
