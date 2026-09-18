# Terra Shield Architecture

## Overview

Terra Shield is a modular landslide risk monitoring platform for environmental and disaster-management operations.

```text
Field sensors
  -> ESP32 / edge node
  -> Cellular or LoRaWAN gateway
  -> Flask REST API validation
  -> SQLite telemetry and device state
  -> Random Forest risk inference
  -> Deterministic safety rules
  -> React operations console
  -> Google Maps risk visualization and warning state
```

## Data Validation

Before any reading reaches the ML model or SQLite storage, it passes through `backend/app/services/validation.py`:

- `rainfall`: 0 to 500 mm
- `slope`: 0 to 90 degrees
- `soil_moisture`: 0 to 100 percent
- `ground_movement`: 0 to 200 mm
- `temperature`: -50 to 60 deg C
- `latitude`: -90 to 90, optional
- `longitude`: -180 to 180, optional

Invalid readings are rejected with HTTP 400.

## Risk Engine

1. **Machine Learning Layer:** A `RandomForestClassifier` estimates landslide risk probability from rainfall, slope, soil moisture, and displacement.
2. **Safety Rule Layer:** Deterministic thresholds escalate risk when physical conditions are dangerous, even if the probabilistic score is lower.
3. **Console Layer:** The frontend normalizes risk into Low, Moderate, High, and Critical operating states for alerts, cards, charts, and map markers.

## Map Integration

The frontend uses the official Google Maps JavaScript API through `VITE_GOOGLE_MAPS_API_KEY`. The map module supports:

- station markers with risk colors,
- risk-zone circles,
- Places search,
- click-to-select coordinates,
- station info windows,
- live telemetry merged with station registry fallbacks.
