# 🌿 PlantAI — Plant Disease Detection Platform

> **Enterprise AI platform for early detection of crop diseases.**  
> Upload a leaf image → get instant pathology diagnosis, treatment protocols, and PDF reports.

---

## 🚀 Live Demo

| Resource | URL |
|---|---|
| Frontend (dev) | `http://localhost:5173` |
| Backend API | `http://localhost:8000` |
| API Docs (Swagger) | `http://localhost:8000/api/v1/docs` |

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, TailwindCSS, Recharts, Framer Motion |
| **Backend** | FastAPI, Python 3.11+, Uvicorn |
| **AI / ML** | TensorFlow (Keras) · PyTorch fallback · PlantVillage dataset |
| **Database** | MongoDB Atlas (pymongo) |
| **Auth** | JWT Bearer tokens (python-jose + bcrypt) |
| **Deployment** | Vercel (frontend) · Render / Railway (backend) |

---

## 📁 Project Structure

```
Plant-Disease-Analysis/
├── backend/
│   ├── app/
│   │   ├── api/              # Route handlers (auth, predict, history, stats, health)
│   │   ├── core/             # Config, security, logging, agronomy advisory
│   │   ├── db/               # MongoDB connection singleton
│   │   ├── schemas/          # Pydantic request/response models
│   │   └── services/         # Business logic (prediction, user management)
│   ├── .env                  # 🔒 NOT committed — copy from .env.example
│   ├── .env.example          # ✅ Safe template — shows required variables
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/       # Sidebar, HeaderNav, AppLayout, Footer
│   │   │   └── routes/       # ProtectedRoute (auth guard)
│   │   ├── context/          # AuthContext (real JWT login/register)
│   │   ├── data/             # Mock data for UI charts and knowledge base
│   │   ├── pages/
│   │   │   ├── Landing.jsx   # Public marketing page (no login required)
│   │   │   ├── Login.jsx     # Auth — connects to backend JWT
│   │   │   ├── Register.jsx  # Auth — connects to backend signup
│   │   │   ├── Dashboard.jsx # Stats, charts, quick actions
│   │   │   ├── Predict.jsx   # AI diagnosis upload page
│   │   │   ├── History.jsx   # Scan history from backend
│   │   │   ├── Knowledge.jsx # Disease library with search/filter
│   │   │   ├── Analytics.jsx # Charts and telemetry
│   │   │   ├── FAQ.jsx       # Help accordion
│   │   │   └── Settings.jsx  # Profile & preferences
│   │   ├── routes/           # AppRoutes (protected + public split)
│   │   └── utils/            # api.js — JWT-authenticated API calls
│   ├── tailwind.config.js    # Design token system
│   ├── vite.config.js        # Dev proxy to backend
│   └── package.json
│
├── ml/
│   ├── output/
│   │   ├── final_plant_model.keras   # 🔒 NOT committed (too large)
│   │   └── classes.json              # Disease class names (committed)
│   └── training/                     # Training scripts
│
├── .gitignore                # Blocks secrets, models, and large files
└── README.md
```

---

## ⚙️ Local Setup

### Prerequisites
- **Python 3.11+**
- **Node.js 18+**
- **MongoDB Atlas** (free tier works)

---

### 1 — Clone the Repository

```bash
git clone https://github.com/your-username/Plant-Disease-Analysis.git
cd Plant-Disease-Analysis
```

---

### 2 — Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env and fill in your SECRET_KEY and MONGO_URI
```

**Generate a secure SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_hex(64))"
```

**Start the backend:**
```bash
# From the project root (Plant-Disease-Analysis/)
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

Or from inside the `backend/` folder:
```bash
uvicorn app.main:app --reload --port 8000
```

---

### 3 — Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (proxies /api to localhost:8000)
npm run dev
```

Open `http://localhost:5173` in your browser.

---

### 4 — ML Model

The trained model file (`final_plant_model.keras`) is **not committed** to the repo (binary, ~3–100MB).

**Option A — Use your existing model:**
Ensure `ml/output/final_plant_model.keras` and `ml/output/classes.json` exist.
The backend will auto-detect and load it.

**Option B — Run in Demo mode:**
If no model file is found, the backend runs a plausible demo inference automatically.

**Option C — Re-train:**
```bash
cd ml/training
python train.py
```

---

## 🔐 Environment Variables

Copy `backend/.env.example` → `backend/.env` and fill in:

| Variable | Description | Required |
|---|---|---|
| `SECRET_KEY` | JWT signing key (min 64 hex chars) | ✅ |
| `MONGO_URI` | MongoDB Atlas connection string | ✅ |
| `DATABASE_NAME` | MongoDB database name | ✅ |
| `MODEL_PATH` | Path to `.keras` model (from project root) | ✅ |
| `CLASS_PATH` | Path to `classes.json` | ✅ |
| `DEBUG` | `True` for dev, `False` for production | ✅ |
| `BACKEND_CORS_ORIGINS` | Comma-separated allowed origins | Optional |

---

## 🛡️ Security Notes

- **Never commit `.env`** — it's in `.gitignore`
- **Never commit model files** — they're in `.gitignore`
- Use a **randomly generated SECRET_KEY** (64+ hex chars)
- In production, set `BACKEND_CORS_ORIGINS` to your exact domain
- Set `DEBUG=False` in production
- All app routes require valid JWT — public landing page is the only unauthenticated page

---

## 🌐 Deployment

### Frontend (Vercel)
1. Push `frontend/` to GitHub
2. Import into Vercel
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Set `VITE_API_BASE` env var to your backend URL

### Backend (Render / Railway)
1. Set `Start Command` to: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
2. Add all `.env` variables in the platform's environment settings
3. Upload the model file via Render's disk or use object storage (S3/R2)

---

## 📊 API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/signup` | ❌ | Register new user |
| `POST` | `/api/v1/auth/login` | ❌ | Login → returns JWT + user |
| `GET`  | `/api/v1/auth/me`    | ✅ | Get current user profile |
| `POST` | `/api/v1/predict`    | ✅ | Run AI leaf diagnosis |
| `GET`  | `/api/v1/history`    | ✅ | Fetch scan history |
| `GET`  | `/api/v1/stats`      | ✅ | Platform statistics |
| `GET`  | `/api/v1/health`     | ❌ | Health check + model status |

Interactive API docs: `http://localhost:8000/api/v1/docs`

---

## 🎯 Supported Diseases (15 classes)

| Crop | Disease |
|---|---|
| **Tomato** | Bacterial Spot, Early Blight, Late Blight, Leaf Mold, Septoria Leaf Spot, Spider Mites, Target Spot, YellowLeaf Curl Virus, Mosaic Virus, Healthy |
| **Potato** | Early Blight, Late Blight, Healthy |
| **Pepper** | Bacterial Spot, Healthy |

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 👤 Author

Built with ❤️ by [Skishore24](https://github.com/Skishore24)
