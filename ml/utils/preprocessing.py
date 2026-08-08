# ml/utils/preprocessing.py
from PIL import Image

def get_preprocessing_function():
    """
    Returns standard ImageNet normalization transform parameters.
    """
    return {
        "mean": [0.485, 0.456, 0.406],
        "std": [0.229, 0.224, 0.225]
    }

def load_and_prep_image(img_path, img_size=(224, 224)):
    """
    Loads and resizes a single image for model inference.
    """
    img = Image.open(img_path).convert("RGB")
    return img.resize(img_size)


