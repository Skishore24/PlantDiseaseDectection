# ml/utils/metrics.py
import numpy as np
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score

def calculate_ml_metrics(y_true, y_pred):
    """
    Calculates standard classification metrics.
    """
    return {
        "accuracy": accuracy_score(y_true, y_pred),
        "f1_macro": f1_score(y_true, y_pred, average='macro'),
        "precision_macro": precision_score(y_true, y_pred, average='macro'),
        "recall_macro": recall_score(y_true, y_pred, average='macro')
    }
