# Terra Shield Presentation Notes

## Positioning

Terra Shield is an AI-powered landslide risk monitoring and early warning platform for rainfall-prone mountainous terrain. It gives response teams a live operational view of sensor telemetry, AI risk analysis, station health, and geographic warning status.

## Problem

Heavy rainfall, fragile slopes, and remote road corridors can create rapidly changing landslide risk. Disaster-management teams need earlier visibility into where conditions are deteriorating and which locations require verification or intervention.

## Solution

Terra Shield connects field sensor nodes to a validated backend API, estimates risk with an AI model and safety-rule layer, then visualizes the result in a professional monitoring console with charts, logs, alerts, and Google Maps station overlays.

## Key Talking Points

1. **IoT telemetry:** ESP32 or LoRaWAN nodes transmit rainfall, slope, soil moisture, displacement, temperature, battery, location, and coordinates.
2. **Validation:** Invalid readings are rejected before reaching the model or database.
3. **AI inference:** A Random Forest model handles nonlinear interactions such as rainfall plus slope plus saturated soil.
4. **Safety rules:** Deterministic thresholds escalate dangerous physical conditions even if model confidence is lower.
5. **Map visualization:** Risk appears directly on Google Maps through colored station markers, overlays, search, and selected coordinates.
6. **Operational UX:** The UI prioritizes quick scanning, calm visual hierarchy, and clear warning states.

## Risk Levels

- Low: routine monitoring.
- Moderate: watch advisory.
- High: field verification requested.
- Critical: warning escalation active.

## Deployment Caveat

The current system demonstrates the end-to-end workflow. Real deployment requires calibrated sensors, local geotechnical sampling, historical landslide inventory validation, production alert channels, and coordination with official authorities.

## Future Scope

- PostgreSQL/PostGIS for spatial indexing.
- LoRaWAN mesh gateway deployment in low-connectivity valleys.
- Sentinel-1 InSAR displacement integration.
- SMS, WhatsApp, siren, and dispatch-system alert integrations.
