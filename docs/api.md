# Terra Shield API

Base endpoint: `http://127.0.0.1:5000/api`

## Health Check

`GET /health`

```json
{
  "status": "ok",
  "service": "terra-shield-api",
  "version": "1.0.0",
  "region": "North Eastern Region (NER) India"
}
```

## Predict Risk

`POST /api/predict`

```json
{
  "rainfall": 92.5,
  "slope": 34.7,
  "soil_moisture": 72.0,
  "ground_movement": 4.2,
  "temperature": 26.0
}
```

## Ingest Sensor Data

`POST /api/sensor-data`

Coordinates are optional for backward compatibility. When present, Terra Shield persists them for map-based station monitoring.

```json
{
  "device_id": "ESP32-001",
  "site_id": "NER-SITE-001",
  "location": "Shillong Slope Alpha, Meghalaya",
  "latitude": 25.5788,
  "longitude": 91.8933,
  "rainfall": 75.3,
  "slope": 31.5,
  "soil_moisture": 68.0,
  "ground_movement": 2.4,
  "battery": 86.0
}
```

```json
{
  "success": true,
  "message": "Sensor data received and processed successfully",
  "reading_id": 14,
  "prediction_id": 14,
  "risk_level": "MODERATE",
  "risk_probability": 0.58
}
```

## Query Sensor Readings

`GET /api/sensor-data?limit=20&device_id=ESP32-001`

## Query Predictions

`GET /api/predictions?limit=20`

## Query Devices

`GET /api/devices`

## Government Emergency Alert Dispatch

`GET /api/alerts?limit=50&unacknowledged=false`

`POST /api/alerts`
```json
{
  "site_id": "NER-SITE-001",
  "site_name": "Shillong Slope Alpha",
  "state": "Meghalaya",
  "latitude": 25.5788,
  "longitude": 91.8933,
  "risk_level": "CRITICAL",
  "message": "Immediate evacuation recommended"
}
```

`POST /api/alerts/<alert_id>/acknowledge`

---

## Historical Incident Query

`GET /api/incident-history?lat=25.5788&lng=91.8933&radius=150&limit=20`

Returns historical events (2021–2024) across NE India along with AI recurrence risk assessment.

---

## AI Risk Narrative Analysis

`POST /api/ai-analysis`
```json
{
  "rainfall": 120.0,
  "slope": 45.0,
  "soil_moisture": 85.0,
  "ground_movement": 6.5,
  "temperature": 22.0,
  "risk_level": "CRITICAL",
  "risk_probability": 0.92,
  "site_name": "Shillong Slope Alpha",
  "weather_text": "Heavy rain showers",
  "windspeed": 18.5
}
```

---

## Live Weather & Forecast

`GET /api/weather?lat=27.33&lng=88.61`

`GET /api/weather/forecast?lat=25.9&lng=92.7`

Fetches real-time atmospheric conditions and 12-hour precipitation forecast from Open-Meteo with automated AI commentary.

---

## Route Risk Assessment

`POST /api/route-risk`
```json
{
  "coordinates": [
    [25.5788, 91.8933],
    [25.6000, 91.9000],
    [26.1500, 92.7800]
  ]
}
```

---

## CSV Data Export

`GET /api/export/csv?type=readings&limit=500`

`GET /api/export/csv?type=predictions&limit=500`

---

## Reverse Geocoding

`GET /api/geocoding/reverse?lat=27.3389&lng=88.6065`

---

## Model Metadata

`GET /api/metadata`

