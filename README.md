# 🌿 LeafGuard AI — AI-Powered Plant Leaf Disease Detection Platform

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React Vite](https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61DAFB.svg?logo=react&logoColor=black)](https://vitejs.dev)
[![TensorFlow](https://img.shields.io/badge/Vision_Model-EfficientNetB0-FF6F00.svg?logo=tensorflow&logoColor=white)](https://www.tensorflow.org)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB_Atlas-47A248.svg?logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **LeafGuard AI** is a full-stack, production-quality agronomic web application that detects plant leaf diseases across **38 disease classes and 14 agricultural crop species** using deep neural transfer learning (EfficientNetB0) and provides structured agronomic advice, biological controls, and cultural prevention protocols.

---

## 📌 Features

- 🌿 **38-Class Deep Vision Classification**: Identifies plant diseases across Apples, Blueberries, Cherries, Corn, Grapes, Oranges, Peaches, Bell Peppers, Potatoes, Raspberries, Soybeans, Squash, Strawberries, and Tomatoes.
- ⚡ **Sub-Second Real-Time Inference**: Powered by Transfer Learning with EfficientNetB0, convolutional feature pooling, and top-3 probability distribution extraction.
- 🛡️ **Actionable Treatment & Prevention**: Provides structured symptoms, causes, bio-fungicides/treatments, and long-term cultural prevention guidelines.
- 📊 **Real Database Analytics & Telemetry**: Farm-level disease frequency, health-to-infection ratio, most scanned crops, and 7-day diagnosis charts without mock data placeholders.
- 🗄️ **Persistent Cloud History & Export**: Complete scan history synced with MongoDB Atlas (and offline local storage fallback) with 1-click PDF Diagnostic Certificate generation.
- 🔒 **Enterprise-Grade Security**: JWT authentication with bcrypt password hashing, non-wildcard configurable CORS, in-memory/Redis rate limiting, and strict Pillow binary image verification.

---

## 🏗️ System Architecture

```
Plant-Disease-Analysis/
├── backend/
│   ├── app.py                     # FastAPI application & route aggregation
│   ├── config.py                  # Pydantic BaseSettings & environment manager
│   ├── database.py                # MongoDB Atlas manager & local JSON fallback
│   ├── main.py                    # Local uvicorn development launcher
│   ├── data/
│   │   └── disease_info.json      # Structured 38-class agronomic knowledge base
│   ├── models/
│   │   ├── class_names.json       # Dynamic 38-class category mapping
│   │   ├── model_metrics.json     # Model evaluation benchmarks
│   │   └── plant_disease_model.keras # Trained EfficientNetB0 neural weights
│   ├── routes/
│   │   ├── analytics.py           # Real database telemetry & stats
│   │   ├── auth.py                # User registration, login, and profile lookup
│   │   ├── health.py              # Health check & diagnostics
│   │   ├── history.py             # Scan history CRUD & batch deletion
│   │   └── prediction.py          # Leaf disease classification endpoint
│   ├── services/
│   │   ├── disease_service.py     # Pathology metadata & class parsing
│   │   ├── image_service.py       # Pillow validation & temp file lifecycle
│   │   └── model_service.py       # Keras / PyTorch inference execution
│   ├── utils/
│   │   ├── auth.py                # JWT creation, decode & user dependency
│   │   ├── logging_config.py      # Safe rotating file & stream logger
│   │   ├── rate_limiter.py        # Sliding window rate limiter
│   │   └── security.py            # Bcrypt hashing & verification
│   └── tests/
│       └── test_api.py            # Pytest automated test suite
├── training/
│   ├── train_model.py             # EfficientNetB0 transfer learning training pipeline
│   └── evaluate_model.py          # Model evaluation, F1, and confusion matrix
├── dataset/
│   └── README.md                  # Kaggle dataset setup & folder guide
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx        # Marketing page (Hero, Features, How it works, FAQ)
│   │   │   ├── Dashboard.jsx      # Leaf upload & analysis hub
│   │   │   ├── Predict.jsx        # Dedicated diagnosis suite
│   │   │   ├── History.jsx        # History search, filters, & batch delete
│   │   │   └── Analytics.jsx      # Telemetry charts & crop distribution
│   │   ├── components/            # Layout, camera modal, toasts, UI components
│   │   ├── utils/
│   │   │   ├── api.js             # Authenticated client fetch library
│   │   │   └── pdfExport.js       # jsPDF report certificate generator
│   │   └── context/
│   │       └── AuthContext.jsx    # Auth state & token manager
│   └── package.json
└── .env.example                   # Environment configuration template
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Python 3.10+** (Tested on Python 3.10, 3.11, 3.12, 3.14)
- **Node.js 18+** & **npm**
- **MongoDB Atlas** (Optional; automatically uses local storage if unconfigured)

---

### 2. Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/Skishore24/PlantDiseaseDectection.git
cd PlantDiseaseDectection

# 2. Create virtual environment
python -m venv venv
venv\Scripts\activate
mac: source venv/bin/activate  

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy environment configuration
cp backend/.env.example backend/.env

# 5. Start the backend API server
uvicorn app:app --reload
```
> The API server will start on `http://127.0.0.1:8000` with interactive Swagger docs at `http://127.0.0.1:8000/api/v1/docs`.

---

### 3. Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
> The web application will launch on `http://localhost:5173`.

---

## 🧠 ML Model Training & Evaluation

### 1. Download Dataset
Download the **New Plant Diseases Dataset (Augmented)** from Kaggle:
🔗 [https://www.kaggle.com/datasets/vipoooool/new-plant-diseases-dataset](https://www.kaggle.com/datasets/vipoooool/new-plant-diseases-dataset)

Extract into the `dataset/` directory:
```
dataset/
├── train/
└── valid/
```

### 2. Run Training
```bash
# Train EfficientNetB0 on the 38 classes
python training/train_model.py --epochs 12 --batch-size 32 --lr 0.001 --fine-tune
```
The script will save:
- `backend/models/plant_disease_model.keras`
- `backend/models/class_names.json`
- `backend/models/training_history.json`

### 3. Evaluate Model
```bash
python training/evaluate_model.py
```
This generates precision, recall, F1-scores, and exports `backend/models/model_metrics.json`.

---

## 📡 API Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/health` | Server, database, and ML model diagnostic status | No |
| `POST` | `/api/v1/auth/register` | Register a new user account | No |
| `POST` | `/api/v1/auth/login` | Authenticate user and receive JWT bearer token | No |
| `GET` | `/api/v1/auth/me` | Retrieve authenticated user profile | Yes |
| `POST` | `/api/v1/predict` | Upload leaf image for neural disease classification | Yes |
| `GET` | `/api/v1/history` | Retrieve user scan history with optional filters | Yes |
| `GET` | `/api/v1/history/{id}` | Retrieve details of a single scan record | Yes |
| `DELETE`| `/api/v1/history/{id}` | Delete a scan record | Yes |
| `POST` | `/api/v1/history/delete`| Batch delete multiple scan records | Yes |
| `DELETE`| `/api/v1/history` | Clear all history records | Yes |
| `GET` | `/api/v1/stats` | Platform summary counts & top detected pathogen | Yes |
| `GET` | `/api/v1/analytics` | Aggregated disease distribution & weekly telemetry | Yes |

---

## 🧪 Testing

Run the automated test suite with pytest:

```bash
python -m pytest backend/tests/test_api.py -v
```

---

## ⚠️ Agricultural & AI Disclaimer

> **Disclaimer**: Predictions and recommendations provided by **LeafGuard AI** are generated by artificial intelligence models and may occasionally produce errors. Results are intended solely as supportive guidance and should be verified by certified agronomists or local agricultural extension services before applying commercial chemical pesticides or making critical farming investments.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
