# Terra Shield

**AI-Powered Landslide Risk Monitoring & Early Warning System**

Terra Shield is an end-to-end environmental monitoring platform for rainfall-prone, mountainous terrain. It combines IoT telemetry, backend validation, AI risk analysis, Google Maps visualization, and alerting workflows for disaster-management and field operations teams.

## Core Capabilities

- **Live telemetry ingestion** for rainfall, slope angle, soil moisture, displacement, temperature, battery, and station coordinates.
- **AI risk classification** using a Random Forest model (trained on synthetic sensor data, see [Model & Dataset](#model--dataset)) with feature contribution visibility.
- **Safety-rule escalation** for physically dangerous threshold combinations.
- **Google Maps monitoring console** with station markers, risk colors, search, selected coordinates, risk zones, alerts, and station details.
- **Operational dashboard** with charts, sensor health, prediction logs, and scenario controls.

## Technology Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React Icons, Recharts, Google Maps JavaScript API.
- **Backend API:** Python, Flask, Flask-CORS, SQLite.
- **Machine Learning:** pandas, NumPy, scikit-learn, joblib.
- **IoT Simulator:** Python requests and scenario generation for `NORMAL`, `WARNING`, `CRITICAL`, `AUTO`, and `FAULT`.

## Repository Structure

```text
SIH/
├── frontend/                     # React + Vite Terra Shield console
│   ├── src/
│   │   ├── components/           # Header, cards, charts, map, controls
│   │   ├── data/                 # Monitoring station registry
│   │   ├── hooks/                # Polling and Google Maps loader hooks
│   │   ├── pages/                # Dashboard, Analytics, Devices, Map, Architecture, Methodology
│   │   ├── services/             # Axios API client
│   │   └── utils/                # Date and risk formatters
├── backend/                      # Flask REST API
│   ├── app/routes/               # /predict, /sensor-data, /predictions, /devices, /demo
│   ├── app/services/             # Risk engine, safety rules, validation
│   ├── app/models/               # Predictor ML wrapper
│   └── app/database/             # SQLite connection and queries
├── iot/                          # Terra Shield IoT simulator
├── ml/                           # Dataset generation, training, evaluation
├── docs/                         # API, architecture, and presentation notes
└── tests/                        # Backend, ML, and IoT tests
```

## Environment

Copy `.env.example` and provide local values:

```bash
PORT=5000
FLASK_DEBUG=True
DATABASE_URL=sqlite:///backend/data/landslide.db
MODEL_PATH=backend/models/landslide_model.joblib
VITE_BACKEND_URL=http://127.0.0.1:5000/api
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
POLLING_INTERVAL=5000
```

The Google Maps key is read by the frontend through `VITE_GOOGLE_MAPS_API_KEY`. Do not hard-code API keys in source files.

## Quick Start

1. Install backend dependencies and train the model:

```bash
cd backend
pip install -r requirements.txt
cd ..
python ml/train.py
```

2. Install frontend dependencies:

```bash
cd frontend
npm install
cd ..
```

3. Start the Flask backend:

```bash
python backend/run.py
```

4. Start the IoT simulator:

```bash
python iot/sensor_simulator.py --mode auto
```

5. Start the Terra Shield frontend:

```bash
cd frontend
npm run dev
```

## Demonstration Flow

1. Launch the backend, IoT simulator, and frontend console.
2. Open `http://localhost:3000`.
3. Confirm live telemetry updates every few seconds.
4. Use **Telemetry Scenario Controls**:
   - `Normal` displays low estimated risk.
   - `Warning` displays moderate risk.
   - `Critical` escalates high or critical warning states.
   - `Fault Test` confirms invalid sensor values are rejected without crashing the backend.
5. Open **Risk Map** to inspect Google Maps markers, station overlays, selected coordinates, search, and risk details.

## Tests

```bash
python -m unittest discover tests
cd frontend
npm run build
```

## Model & Dataset

The Random Forest classifier (`ml/train.py`) is trained on a **synthetic** dataset (`ml/generate_dataset.py`) rather than real landslide inventory records — there is no public, sensor-matched, per-station landslide dataset for the target region that this project has access to. Labels are assigned by a domain-inspired weighted formula (rainfall 40%, slope 25%, soil moisture 20%, ground movement 15%, plus noise) rather than observed outcomes, so the model is a **proof of concept that the ingestion → prediction → alerting pipeline works end-to-end**, not a validated landslide predictor.

Two things worth knowing when reading the reported metrics:

- **Two-layer risk design.** Because a model trained this way shouldn't be trusted as the sole authority, `backend/app/services/safety_rules.py` applies deterministic physical-threshold rules (e.g. sustained heavy rainfall combined with active ground displacement) that can escalate — never downgrade — the ML output. This is the layer that should carry the most weight in any real deployment.
- **Class balance.** Genuinely landslide-triggering conditions are rare, so the dataset generator mixes a small "storm on steep terrain" regime into the otherwise everyday-conditions distribution, keeping HIGH-risk rows a minority (~9% of samples) while still giving the model enough HIGH examples to learn from and be evaluated against meaningfully — earlier versions of the dataset had so few HIGH examples that the reported precision/recall for that class were essentially noise.

Current held-out test metrics (regenerate with `python ml/generate_dataset.py && python ml/train.py`) are written to `backend/models/metadata.json` after each training run.

## Deployment Note

Terra Shield demonstrates a production-style monitoring workflow, not a field-ready predictor. Real deployment requires calibrated field sensors, local geotechnical soil data, historical landslide inventory to retrain and validate the model against actual outcomes, operational alert channels, and approval from disaster-management authorities.
