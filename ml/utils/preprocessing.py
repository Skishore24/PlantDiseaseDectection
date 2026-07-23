# ml/utils/preprocessing.py
import tensorflow as tf
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

def get_preprocessing_function():
    """
    Returns the standard MobileNetV2 preprocessing function.
    """
    return preprocess_input

def load_and_prep_image(img_path, img_size=(128, 128)):
    """
    Loads and prepares a single image for inference with batch dimension.
    """
    img = tf.io.read_file(img_path)
    img = tf.image.decode_image(img, channels=3)
    img = tf.image.resize(img, img_size)
    img = preprocess_input(img)
    return tf.expand_dims(img, axis=0)

