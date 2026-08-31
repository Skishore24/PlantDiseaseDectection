<div align="center">

# 🌿 LeafGuard AI
### AI-Powered Plant Leaf Disease Detection & Agronomic Advisory Platform

[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![TensorFlow](https://img.shields.io/badge/TensorFlow%20%2F%20Keras-EfficientNetB0-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)](https://www.tensorflow.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

---

<p align="center">
  <b>LeafGuard AI</b> is a full-stack, deep learning-powered crop pathology diagnostic platform. It identifies <b>38 distinct plant leaf disease categories</b> with fine-grained severity assessments, treatment advice, and exportable diagnostic reports.
</p>

</div>

---

## 🌟 Key Features

- 🌿 **38-Class Plant Disease Recognition**: Detects pathologies across Apple, Blueberry, Cherry, Corn, Grape, Orange, Peach, Pepper, Potato, Raspberry, Soybean, Squash, Strawberry, and Tomato.
- ⚡ **EfficientNetB0 Architecture**: Powered by transfer learning on deep convolutional representations with automated data augmentation.
- 🛡️ **Fail-Safe Predictions**: Validates image formats (JPEG, PNG, WEBP), MIME types, and Pillow decode integrity. If the model is not loaded, safely returns `503 Service Unavailable` with **zero artificial/fake prediction generation**.
- 🔒 **Hardened Security**:
  - OWASP-aligned password complexity enforcement (uppercase, lowercase, number, special char, min 8 chars).
  - 5-attempt threshold with 15-minute progressive account lockout.
  - Constant-time dummy hash verification mitigating timing attacks.
  - Strict MongoDB Atlas TLS/SSL certificate validation via `certifi`.
  - Secure JWT authentication with user-isolated scan histories.
- 📊 **Real Agronomic Telemetry**: Live disease distribution charts, scan activity timelines, healthy/diseased ratios, and confidence indicators.
- 📄 **Exportable PDF Reports**: Generates professional field diagnosis sheets with disease background, causes, symptoms, and actionable chemical/organic treatments.

---

## 🏗️ System Architecture

```
Plant-Disease-Analysis/
├── api/
│   └── index.py                     # Serverless ASGI bridge
├── backend/
│   ├── app.py                       # FastAPI application & lifecycle management
│   ├── config.py                    # Environment configuration & security constants
│   ├── database.py                  # MongoDB Atlas manager (TLS enabled) + local fallback
│   ├── data/
│   │   └── disease_info.json        # Agronomic pathology database (38 classes)
│   ├── models/
│   │   ├── class_names.json         # 38 pathology class mappings
│   │   ├── model_metrics.json       # Real evaluation metrics
│   │   └── plant_disease_model.keras # Trained EfficientNetB0 weights
│   ├── routes/
│   │   ├── auth.py                  # Register, Login, Me, Change-Password
│   │   ├── prediction.py            # Leaf image validation & neural inference
│   │   ├── history.py               # User-isolated scan history CRUD
│   │   ├── analytics.py             # Agronomic telemetry & distribution stats
│   │   └── health.py                # System, database, and model readiness status
│   ├── services/
│   │   ├── image_service.py         # Pillow validation, decode & canonical preprocessing
│   │   ├── model_service.py         # TensorFlow/Keras EfficientNetB0 inference engine
│   │   └── disease_service.py       # Disease dictionary parser & lookup
│   ├── utils/
│   │   ├── auth.py                  # JWT creation & verification
│   │   ├── security.py              # Password strength validator & dummy timing mitigations
│   │   └── rate_limiter.py          # IP rate limiting & failed-attempt security tracker
│   └── tests/
│       └── test_api.py              # Automated Pytest suite (17 test cases)
├── frontend/                        # React 18 + Vite + Tailwind CSS Single-Page App
│   ├── src/
│   │   ├── components/              # Reusable UI components (Navbar, ProtectedRoute, CameraModal)
│   │   ├── pages/                   # Landing, Dashboard, Predict, History, Analytics, Knowledge, Login, Register, Settings
│   │   └── utils/                   # api.js client layer, pdfExport.js
├── training/
│   ├── train_model.py               # TensorFlow/Keras EfficientNetB0 training pipeline
│   └── evaluate_model.py            # Model evaluation, accuracy, F1, and confusion matrix
├── dataset/
│   └── README.md                    # Kaggle New Plant Diseases Dataset instructions
├── requirements.txt                 # Production Python dependencies
└── vercel.json                      # Vercel deployment configuration
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Python**: 3.10 to 3.12 (TensorFlow compatible)
- **Node.js**: 18.x or higher
- **MongoDB Atlas** (optional for cloud persistence; local development store is included)

### 2. Backend Setup

```bash
# 1. Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env

# 4. Start backend development server
uvicorn backend.app:app --reload --port 8000
```

The interactive OpenAPI documentation will be accessible at `http://localhost:8000/api/v1/docs`.

### 3. Frontend Setup

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start Vite dev server
npm run dev
```

The web interface will open at `http://localhost:5173`.

---

## 🧠 Model Training & Evaluation

### Dataset
LeafGuard AI uses the **New Plant Diseases Dataset (Augmented)** from Kaggle (~87,000 RGB images across 38 classes).

1. Download the dataset as detailed in [`dataset/README.md`](dataset/README.md).
2. Extract the dataset into `dataset/train/` and `dataset/valid/`.

### Training the Model
```bash
# Run EfficientNetB0 transfer learning (12 epochs)
python training/train_model.py

# Optional: fine-tune top backbone layers
python training/train_model.py --epochs 15 --batch-size 32 --lr 0.001 --fine-tune
```

Outputs generated:
- `backend/models/plant_disease_model.keras`
- `backend/models/class_names.json`
- `backend/models/training_history.json`

### Evaluating the Model
```bash
python training/evaluate_model.py
```
Outputs generated:
- `backend/models/model_metrics.json` (Accuracy, Precision, Recall, F1-Score, Confusion Matrix)

---

## 🧪 Testing

Run the automated test suite covering authentication, security lockout, image validation, fail-safe inference, and database authorization:

```bash
python -m pytest backend/tests/test_api.py -v
```

---

## 🌐 API Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/health` | Server health, MongoDB status, model readiness | No |
| `POST` | `/api/v1/auth/register` | Register new user with strong password check | No |
| `POST` | `/api/v1/auth/login` | Login and receive JWT access token | No |
| `GET` | `/api/v1/auth/me` | Current authenticated user profile | Yes |
| `POST` | `/api/v1/auth/change-password` | Update account password | Yes |
| `POST` | `/api/v1/predict` | Upload leaf image for neural disease diagnosis | Yes |
| `GET` | `/api/v1/history` | Retrieve user scan history | Yes |
| `GET` | `/api/v1/history/{id}` | Retrieve specific scan record | Yes |
| `DELETE` | `/api/v1/history/{id}` | Delete specific scan record | Yes |
| `POST` | `/api/v1/history/delete` | Batch delete scan records | Yes |
| `DELETE` | `/api/v1/history` | Clear all history for current user | Yes |
| `GET` | `/api/v1/analytics` | Telemetry, disease distribution, and weekly trends | Yes |
| `GET` | `/api/v1/stats` | High-level summary metrics | Yes |

---

## ⚠️ Agricultural & AI Disclaimer

> **Important**: Predictions generated by LeafGuard AI are produced by a Convolutional Neural Network trained on visual leaf symptoms. Results are intended for guidance, monitoring, and educational purposes. For commercial crop interventions, always consult certified agronomists or local agricultural extension offices.

---

<div align="center">
  <sub>Built with ❤️ for precision agriculture and sustainable crop protection.</sub>
</div>
