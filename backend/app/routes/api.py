import datetime
import csv
import io
import math
import requests
from flask import Blueprint, request, jsonify, Response
from app.services.validation import validate_sensor_inputs
from app.models.predictor import predictor
from app.services.risk_engine import determine_risk_level
from app.services.alert_engine import (
    dispatch_govt_alert, get_all_alerts, acknowledge_alert, get_incident_history
)
from app.database.models import (
    insert_sensor_reading,
    insert_prediction,
    fetch_recent_readings,
    fetch_recent_predictions,
    fetch_devices
)
from app.utils.logger import logger


api_bp = Blueprint('api', __name__)

# Global state for presentation demo mode
current_demo_scenario = 'AUTO'

@api_bp.route('/predict', methods=['POST'])
def predict_risk():
    try:
        data = request.get_json(force=True, silent=True)
        if not data:
            return jsonify({"success": False, "error": "Invalid or missing JSON payload"}), 400

        is_valid, error_msg, sanitized = validate_sensor_inputs(data)
        if not is_valid:
            return jsonify({"success": False, "error": error_msg}), 400

        timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        probability, class_probs = predictor.predict(sanitized)
        risk_result = determine_risk_level(probability, sanitized)

        response = {
            "success": True,
            "risk_level": risk_result['risk_level'],
            "risk_probability": risk_result['risk_probability'],
            "message": risk_result['message'],
            "safety_override": risk_result['safety_override'],
            "safety_reason": risk_result['safety_reason'],
            "contributing_factors": risk_result['contributing_factors'],
            "class_probabilities": class_probs,
            "disclaimer": risk_result['disclaimer'],
            "timestamp": timestamp,
            "inputs": {
                "rainfall": sanitized['rainfall'],
                "slope": sanitized['slope'],
                "soil_moisture": sanitized['soil_moisture'],
                "ground_movement": sanitized['ground_movement'],
                "temperature": sanitized['temperature']
            }
        }
        return jsonify(response), 200

    except Exception as e:
        logger.error(f"Error processing /predict: {str(e)}")
        return jsonify({"success": False, "error": f"Prediction server error: {str(e)}"}), 500


@api_bp.route('/sensor-data', methods=['POST'])
def receive_sensor_data():
    try:
        data = request.get_json(force=True, silent=True)
        if not data:
            return jsonify({"success": False, "error": "Invalid or missing JSON payload"}), 400

        is_valid, error_msg, sanitized = validate_sensor_inputs(data)
        if not is_valid:
            logger.warning(f"Rejected invalid sensor reading: {error_msg}")
            return jsonify({"success": False, "error": error_msg}), 400

        timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
        sanitized['timestamp'] = timestamp

        # Store in database
        reading_id = insert_sensor_reading(sanitized)

        # Run risk prediction
        probability, class_probs = predictor.predict(sanitized)
        risk_result = determine_risk_level(probability, sanitized)

        prediction_payload = {
            'reading_id': reading_id,
            'device_id': sanitized['device_id'],
            'risk_level': risk_result['risk_level'],
            'risk_probability': risk_result['risk_probability'],
            'message': risk_result['message'],
            'safety_override': risk_result['safety_override'],
            'timestamp': timestamp,
            'inputs': sanitized
        }
        prediction_id = insert_prediction(prediction_payload)

        # Auto-dispatch government alerts for HIGH/CRITICAL risk
        if risk_result['risk_level'] in ('HIGH', 'CRITICAL'):
            try:
                dispatch_govt_alert(
                    site_id=sanitized.get('site_id', 'NER-SITE-001'),
                    site_name=sanitized.get('location', 'Monitoring Station'),
                    state=sanitized.get('state', 'North East India'),
                    latitude=sanitized.get('latitude', 25.9),
                    longitude=sanitized.get('longitude', 92.7),
                    risk_level=risk_result['risk_level'],
                    message=risk_result['message']
                )
            except Exception as ae:
                logger.warning(f"Alert dispatch failed (non-fatal): {ae}")

        return jsonify({
            "success": True,
            "message": "Sensor data received and processed successfully",
            "reading_id": reading_id,
            "prediction_id": prediction_id,
            "risk_level": risk_result['risk_level'],
            "risk_probability": risk_result['risk_probability']
        }), 201

    except Exception as e:
        logger.error(f"Error processing /sensor-data: {str(e)}")
        return jsonify({"success": False, "error": f"Sensor API server error: {str(e)}"}), 500


@api_bp.route('/sensor-data', methods=['GET'])
def get_sensor_data():
    try:
        limit = request.args.get('limit', default=20, type=int)
        device_id = request.args.get('device_id', default=None, type=str)
        readings = fetch_recent_readings(limit=limit, device_id=device_id)
        return jsonify({
            "success": True,
            "count": len(readings),
            "data": readings
        }), 200
    except Exception as e:
        logger.error(f"Error fetching sensor data: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@api_bp.route('/predictions', methods=['GET'])
def get_predictions():
    try:
        limit = request.args.get('limit', default=20, type=int)
        device_id = request.args.get('device_id', default=None, type=str)
        predictions = fetch_recent_predictions(limit=limit, device_id=device_id)
        return jsonify({
            "success": True,
            "count": len(predictions),
            "data": predictions
        }), 200
    except Exception as e:
        logger.error(f"Error fetching predictions: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@api_bp.route('/devices', methods=['GET'])
def get_devices_status():
    try:
        devices = fetch_devices()
        return jsonify({
            "success": True,
            "count": len(devices),
            "data": devices
        }), 200
    except Exception as e:
        logger.error(f"Error fetching devices: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@api_bp.route('/demo/scenario', methods=['POST', 'GET'])
def handle_demo_scenario():
    global current_demo_scenario
    if request.method == 'POST':
        data = request.get_json(force=True, silent=True) or {}
        scenario = data.get('scenario', 'AUTO').upper()
        if scenario in ['NORMAL', 'WARNING', 'CRITICAL', 'FAULT', 'AUTO']:
            current_demo_scenario = scenario
            logger.info(f"Demo scenario switched to: {current_demo_scenario}")
            return jsonify({
                "success": True,
                "current_scenario": current_demo_scenario,
                "message": f"Demo scenario updated to {current_demo_scenario}"
            }), 200
        else:
            return jsonify({"success": False, "error": "Invalid scenario type"}), 400
    else:
        return jsonify({
            "success": True,
            "current_scenario": current_demo_scenario
        }), 200


@api_bp.route('/metadata', methods=['GET'])
def get_model_metadata():
    try:
        if predictor.metadata:
            return jsonify({
                "success": True,
                "metadata": predictor.metadata
            }), 200
        else:
            return jsonify({"success": False, "error": "Metadata unavailable"}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


WEATHER_DESCRIPTIONS = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Depositing rime fog",
    51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
    61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
    71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
    80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
    95: "Thunderstorm", 96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail"
}

@api_bp.route('/weather', methods=['GET'])
def get_live_weather():
    try:
        lat = request.args.get('lat', default=27.3389, type=float)
        lng = request.args.get('lng', default=88.6065, type=float)
        
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&current_weather=true&hourly=relative_humidity_2m,precipitation&timezone=auto"
        res = requests.get(url, timeout=4)
        
        if res.status_code == 200:
            wdata = res.json()
            cw = wdata.get('current_weather', {})
            wcode = cw.get('weathercode', 0)
            
            return jsonify({
                "success": True,
                "provider": "Open-Meteo (Free Open API)",
                "latitude": lat,
                "longitude": lng,
                "elevation": wdata.get('elevation', 0),
                "temperature": cw.get('temperature'),
                "windspeed": cw.get('windspeed'),
                "winddirection": cw.get('winddirection'),
                "weather_code": wcode,
                "weather_text": WEATHER_DESCRIPTIONS.get(wcode, "Variable conditions"),
                "timestamp": cw.get('time')
            }), 200
        else:
            return jsonify({
                "success": False,
                "error": f"Open-Meteo returned status {res.status_code}"
            }), 502

    except Exception as e:
        logger.warning(f"Free Weather API call failed: {str(e)}")
        return jsonify({
            "success": True,
            "provider": "Fallback (Offline mode)",
            "latitude": lat,
            "longitude": lng,
            "elevation": 1400,
            "temperature": 21.5,
            "windspeed": 8.2,
            "weather_text": "Moderate Mountainous Conditions",
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }), 200


@api_bp.route('/export/csv', methods=['GET'])
def export_csv_data():
    try:
        data_type = request.args.get('type', default='readings', type=str)
        limit = request.args.get('limit', default=500, type=int)
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        if data_type == 'predictions':
            predictions = fetch_recent_predictions(limit=limit)
            writer.writerow(['Prediction ID', 'Reading ID', 'Device ID', 'Risk Level', 'Risk Probability', 'Message', 'Safety Override', 'Timestamp'])
            for row in predictions:
                writer.writerow([
                    row.get('id'), row.get('reading_id'), row.get('device_id'),
                    row.get('risk_level'), row.get('risk_probability'),
                    row.get('message'), row.get('safety_override'), row.get('timestamp')
                ])
            filename = f"terra_shield_predictions_{datetime.date.today()}.csv"
        else:
            readings = fetch_recent_readings(limit=limit)
            writer.writerow(['Reading ID', 'Device ID', 'Rainfall (mm)', 'Slope (deg)', 'Soil Moisture (%)', 'Displacement (mm)', 'Temperature (C)', 'Battery (%)', 'Latitude', 'Longitude', 'Timestamp'])
            for row in readings:
                writer.writerow([
                    row.get('id'), row.get('device_id'), row.get('rainfall'),
                    row.get('slope'), row.get('soil_moisture'), row.get('ground_movement'),
                    row.get('temperature'), row.get('battery'), row.get('latitude'),
                    row.get('longitude'), row.get('timestamp')
                ])
            filename = f"terra_shield_readings_{datetime.date.today()}.csv"
            
        output.seek(0)
        return Response(
            output.getvalue(),
            mimetype="text/csv",
            headers={"Content-Disposition": f"attachment;filename={filename}"}
        )

    except Exception as e:
        logger.error(f"Error exporting CSV: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@api_bp.route('/geocoding/reverse', methods=['GET'])
def reverse_geocode():
    try:
        lat = request.args.get('lat', type=float)
        lng = request.args.get('lng', type=float)

        if lat is None or lng is None:
            return jsonify({"success": False, "error": "Missing lat or lng parameter"}), 400

        url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lng}&format=json"
        headers = {'User-Agent': 'TerraShield-LandslideMonitoring/1.0'}
        res = requests.get(url, headers=headers, timeout=4)

        if res.status_code == 200:
            gdata = res.json()
            addr = gdata.get('address', {})
            place_name = (
                addr.get('village') or
                addr.get('town') or
                addr.get('city') or
                addr.get('suburb') or
                addr.get('county') or
                addr.get('state_district') or
                addr.get('state') or
                'Unmapped Terrain Point'
            )
            state = addr.get('state', 'North East India')

            return jsonify({
                "success": True,
                "provider": "OpenStreetMap Nominatim (Free Open API)",
                "display_name": gdata.get('display_name'),
                "name": place_name,
                "state": state,
                "address": addr,
                "latitude": lat,
                "longitude": lng
            }), 200
        else:
            return jsonify({
                "success": False,
                "error": f"Nominatim returned status {res.status_code}"
            }), 502

    except Exception as e:
        logger.warning(f"Reverse geocoding call failed: {str(e)}.")
        return jsonify({
            "success": True,
            "provider": "Fallback (Offline)",
            "name": "Selected Terrain Coordinates",
            "state": "North East Region",
            "latitude": lat,
            "longitude": lng
        }), 200


# ---------------------------------------------------------------------------
# Government Alert Endpoints
# ---------------------------------------------------------------------------

@api_bp.route('/alerts', methods=['GET'])
def get_alerts():
    """Fetch all government dispatch alerts."""
    try:
        limit = request.args.get('limit', default=50, type=int)
        unacknowledged_only = request.args.get('unacknowledged', default='false').lower() == 'true'
        alerts = get_all_alerts(limit=limit, unacknowledged_only=unacknowledged_only)
        return jsonify({"success": True, "count": len(alerts), "data": alerts}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@api_bp.route('/alerts', methods=['POST'])
def dispatch_alert():
    """Manually dispatch a government alert for a site."""
    try:
        data = request.get_json(force=True, silent=True) or {}
        required = ['site_id', 'site_name', 'risk_level']
        for field in required:
            if not data.get(field):
                return jsonify({"success": False, "error": f"Missing field: {field}"}), 400

        alert_ids = dispatch_govt_alert(
            site_id=data['site_id'],
            site_name=data['site_name'],
            state=data.get('state', 'North East India'),
            latitude=data.get('latitude', 25.9),
            longitude=data.get('longitude', 92.7),
            risk_level=data['risk_level'].upper(),
            message=data.get('message')
        )
        return jsonify({
            "success": True,
            "alert_ids": alert_ids,
            "message": f"Dispatched {len(alert_ids)} team alert(s)"
        }), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@api_bp.route('/alerts/<int:alert_id>/acknowledge', methods=['POST'])
def ack_alert(alert_id):
    """Mark a government alert as acknowledged."""
    try:
        ok = acknowledge_alert(alert_id)
        if ok:
            return jsonify({"success": True, "message": f"Alert {alert_id} acknowledged"}), 200
        return jsonify({"success": False, "error": "Alert not found"}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ---------------------------------------------------------------------------
# Incident History Endpoint
# ---------------------------------------------------------------------------

@api_bp.route('/incident-history', methods=['GET'])
def get_incident_history_route():
    """Fetch historical landslide incidents, optionally filtered by proximity."""
    try:
        lat = request.args.get('lat', type=float)
        lng = request.args.get('lng', type=float)
        radius_km = request.args.get('radius', default=150.0, type=float)
        limit = request.args.get('limit', default=20, type=int)
        state = request.args.get('state', type=str)

        incidents = get_incident_history(lat=lat, lng=lng, radius_km=radius_km, limit=limit, state=state)

        # Calculate AI risk analysis for the location
        ai_commentary = None
        if incidents:
            total_incidents = len(incidents)
            critical_count = sum(1 for i in incidents if i.get('severity') == 'CRITICAL')
            total_casualties = sum(i.get('casualties', 0) for i in incidents)
            avg_rainfall = sum(i.get('rainfall_mm', 0) for i in incidents) / total_incidents
            years_span = 5  # 2019-2024 window

            recurrence_rate = round(total_incidents / years_span, 1)
            risk_pct = min(95, int((critical_count / max(total_incidents, 1)) * 100))

            if critical_count >= 2:
                risk_verdict = "HIGH RECURRENCE RISK"
            elif critical_count == 1 or total_incidents >= 3:
                risk_verdict = "MODERATE RECURRENCE RISK"
            else:
                risk_verdict = "LOW RECURRENCE RISK"

            ai_commentary = {
                "total_incidents": total_incidents,
                "critical_count": critical_count,
                "total_casualties": total_casualties,
                "avg_rainfall_mm": round(avg_rainfall, 1),
                "recurrence_per_year": recurrence_rate,
                "risk_verdict": risk_verdict,
                "risk_percentage": risk_pct,
                "narrative": (
                    f"This area has recorded {total_incidents} landslide event(s) between 2021–2024, "
                    f"of which {critical_count} were CRITICAL severity. "
                    f"Average triggering rainfall: {round(avg_rainfall, 1)} mm. "
                    f"Total casualties in region: {total_casualties}. "
                    f"AI Assessment: {risk_verdict} — estimated {risk_pct}% probability of recurrence "
                    f"during heavy monsoon conditions (>100mm/day rainfall)."
                )
            }

        return jsonify({
            "success": True,
            "count": len(incidents),
            "data": incidents,
            "ai_analysis": ai_commentary
        }), 200
    except Exception as e:
        logger.error(f"Incident history error: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


# ---------------------------------------------------------------------------
# AI Risk Analysis Endpoint
# ---------------------------------------------------------------------------

@api_bp.route('/ai-analysis', methods=['POST'])
def ai_risk_analysis():
    """
    Generate AI risk narrative from weather + sensor data.
    Combines live weather with current site readings to produce human-readable commentary.
    """
    try:
        data = request.get_json(force=True, silent=True) or {}
        rainfall = float(data.get('rainfall', 0))
        slope = float(data.get('slope', 0))
        soil_moisture = float(data.get('soil_moisture', 0))
        ground_movement = float(data.get('ground_movement', 0))
        temperature = float(data.get('temperature', 25))
        risk_level = data.get('risk_level', 'LOW').upper()
        risk_probability = float(data.get('risk_probability', 0.05))
        site_name = data.get('site_name', 'the monitored site')
        weather_text = data.get('weather_text', '')
        windspeed = float(data.get('windspeed', 0))

        # Build AI narrative
        risk_pct = int(risk_probability * 100)
        factors = []
        urgency = []

        if rainfall > 150:
            factors.append(f"extreme rainfall of {rainfall}mm")
            urgency.append("EVACUATE immediately")
        elif rainfall > 80:
            factors.append(f"heavy rainfall of {rainfall}mm")
            urgency.append("deploy NDRF standby units")
        elif rainfall > 35:
            factors.append(f"elevated rainfall of {rainfall}mm")

        if soil_moisture > 80:
            factors.append(f"critically saturated soil ({soil_moisture}%)")
            urgency.append("slope failure imminent")
        elif soil_moisture > 60:
            factors.append(f"high soil saturation ({soil_moisture}%)")

        if slope > 40:
            factors.append(f"steep slope angle of {slope}°")
        elif slope > 25:
            factors.append(f"elevated slope angle of {slope}°")

        if ground_movement > 5:
            factors.append(f"critical ground displacement of {ground_movement}mm")
            urgency.append("active movement detected — zone closure required")
        elif ground_movement > 1.5:
            factors.append(f"elevated displacement of {ground_movement}mm")

        factor_text = ", ".join(factors) if factors else "baseline environmental conditions"
        urgency_text = "; ".join(urgency) if urgency else "Continue monitoring"

        if risk_level in ('CRITICAL', 'HIGH') and risk_probability >= 0.70:
            timeframe = "within 2–6 hours"
        elif risk_level == 'MODERATE':
            timeframe = "within 12–24 hours if conditions persist"
        else:
            timeframe = "if conditions escalate beyond current levels"

        narrative = (
            f"AI Analysis for {site_name}: "
            f"Current conditions show {factor_text}. "
            f"The ML model estimates a {risk_pct}% landslide probability {timeframe}. "
            f"Weather: {weather_text}, windspeed {windspeed} km/h. "
            f"Recommended action — {urgency_text}. "
            f"Risk Classification: {risk_level}."
        )

        recommendation = "MAINTAIN_WATCH"
        if risk_level == 'CRITICAL':
            recommendation = "EVACUATE_AND_DISPATCH_NDRF"
        elif risk_level == 'HIGH':
            recommendation = "DISPATCH_NDRF_MEDICAL"
        elif risk_level == 'MODERATE':
            recommendation = "INCREASE_MONITORING_FREQUENCY"

        return jsonify({
            "success": True,
            "risk_level": risk_level,
            "risk_percentage": risk_pct,
            "narrative": narrative,
            "recommendation": recommendation,
            "key_factors": factors,
            "urgency_actions": urgency,
            "timeframe": timeframe
        }), 200

    except Exception as e:
        logger.error(f"AI analysis error: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


# ---------------------------------------------------------------------------
# Enhanced Weather with Hourly Forecast + AI Commentary
# ---------------------------------------------------------------------------

@api_bp.route('/weather/forecast', methods=['GET'])
def get_weather_forecast():
    """Fetch hourly precipitation forecast + AI risk commentary for a location."""
    try:
        lat = request.args.get('lat', default=25.9, type=float)
        lng = request.args.get('lng', default=92.7, type=float)

        url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lng}"
            f"&current_weather=true"
            f"&hourly=precipitation,precipitation_probability,relative_humidity_2m,windspeed_10m,temperature_2m"
            f"&daily=precipitation_sum,precipitation_hours"
            f"&timezone=auto&forecast_days=3"
        )
        res = requests.get(url, timeout=5)

        if res.status_code != 200:
            raise Exception(f"Open-Meteo returned {res.status_code}")

        wdata = res.json()
        current = wdata.get('current_weather', {})
        hourly = wdata.get('hourly', {})
        daily = wdata.get('daily', {})

        # Next 12 hours precipitation
        hours = hourly.get('time', [])[:12]
        precip = hourly.get('precipitation', [])[:12]
        precip_prob = hourly.get('precipitation_probability', [])[:12]
        humidity = hourly.get('relative_humidity_2m', [])[:12]

        # AI commentary
        max_precip_12h = max(precip) if precip else 0
        avg_humidity = sum(humidity) / len(humidity) if humidity else 0
        daily_precip_today = (daily.get('precipitation_sum') or [0])[0]

        if max_precip_12h > 15:
            forecast_risk = "HIGH"
            forecast_comment = f"Heavy precipitation forecast ({max_precip_12h}mm/hr peak). Landslide risk elevated significantly."
        elif max_precip_12h > 5:
            forecast_risk = "MODERATE"
            forecast_comment = f"Moderate rainfall expected ({max_precip_12h}mm/hr peak). Monitor soil moisture closely."
        elif daily_precip_today > 30:
            forecast_risk = "MODERATE"
            forecast_comment = f"Cumulative daily rainfall {daily_precip_today}mm. Continued saturation risk."
        else:
            forecast_risk = "LOW"
            forecast_comment = "Light or no significant precipitation forecast. Low meteorological risk."

        return jsonify({
            "success": True,
            "current": {
                "temperature": current.get('temperature'),
                "windspeed": current.get('windspeed'),
                "weather_code": current.get('weathercode'),
                "weather_text": WEATHER_DESCRIPTIONS.get(current.get('weathercode', 0), "Variable"),
            },
            "hourly_forecast": [
                {"time": hours[i], "precipitation_mm": precip[i] if i < len(precip) else 0,
                 "probability_pct": precip_prob[i] if i < len(precip_prob) else 0,
                 "humidity_pct": humidity[i] if i < len(humidity) else 0}
                for i in range(len(hours))
            ],
            "daily_precipitation_mm": daily_precip_today,
            "forecast_risk_level": forecast_risk,
            "ai_forecast_commentary": forecast_comment,
            "elevation": wdata.get('elevation', 0),
            "latitude": lat,
            "longitude": lng
        }), 200

    except Exception as e:
        logger.warning(f"Weather forecast error: {str(e)}")
        return jsonify({
            "success": True,
            "current": {"temperature": 21.5, "windspeed": 8.2, "weather_text": "Mountainous conditions"},
            "hourly_forecast": [],
            "daily_precipitation_mm": 0,
            "forecast_risk_level": "UNKNOWN",
            "ai_forecast_commentary": "Weather forecast unavailable (offline mode).",
            "elevation": 1400,
            "latitude": lat,
            "longitude": lng
        }), 200


# ---------------------------------------------------------------------------
# Route Risk Assessment Endpoint
# ---------------------------------------------------------------------------

def _haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# Known risk zones for route analysis (extend with monitoring sites)
KNOWN_RISK_ZONES = [
    {"lat": 25.5788, "lng": 91.8933, "name": "Shillong Slope Alpha", "risk": "LOW", "radius_km": 18},
    {"lat": 27.3389, "lng": 88.6065, "name": "Gangtok Highway Ridge", "risk": "LOW", "radius_km": 18},
    {"lat": 23.7271, "lng": 92.7176, "name": "Aizawl West Pass", "risk": "MODERATE", "radius_km": 22},
    {"lat": 25.6751, "lng": 94.1086, "name": "Kohima Bypass Sector", "risk": "LOW", "radius_km": 15},
    {"lat": 27.0844, "lng": 93.6053, "name": "Itanagar North Slope", "risk": "HIGH", "radius_km": 28},
    {"lat": 24.817, "lng": 93.9368, "name": "Imphal Valley Ridge", "risk": "CRITICAL", "radius_km": 35},
]


@api_bp.route('/route-risk', methods=['POST'])
def assess_route_risk():
    """
    Assess landslide risk along a route defined by a list of coordinates.
    Returns risk zones intersected by the route.
    """
    try:
        data = request.get_json(force=True, silent=True) or {}
        coordinates = data.get('coordinates', [])  # List of [lat, lng]

        if not coordinates or len(coordinates) < 2:
            return jsonify({"success": False, "error": "At least 2 coordinates required"}), 400

        intersected_zones = []
        overall_risk = "LOW"
        risk_priority = {"LOW": 1, "MODERATE": 2, "HIGH": 3, "CRITICAL": 4}

        for zone in KNOWN_RISK_ZONES:
            # Check if any route point falls within zone radius
            min_dist = min(
                _haversine_km(coord[0], coord[1], zone['lat'], zone['lng'])
                for coord in coordinates
            )
            if min_dist <= zone['radius_km']:
                intersected_zones.append({
                    **zone,
                    "distance_km": round(min_dist, 1),
                    "warning": f"Route passes within {round(min_dist, 1)}km of {zone['name']} ({zone['risk']} risk zone)"
                })
                if risk_priority.get(zone['risk'], 0) > risk_priority.get(overall_risk, 0):
                    overall_risk = zone['risk']

        route_safe = overall_risk in ("LOW",)
        advisory = ""
        if overall_risk == "CRITICAL":
            advisory = "ROUTE NOT RECOMMENDED. Critical landslide risk zones detected along this corridor. Use alternate route or wait for conditions to improve."
        elif overall_risk == "HIGH":
            advisory = "CAUTION: High risk zones on route. Travel only if essential. Maintain emergency contacts and inform authorities."
        elif overall_risk == "MODERATE":
            advisory = "ADVISORY: Moderate risk zones detected. Check latest weather forecasts before travel. Avoid travel during heavy rainfall."
        else:
            advisory = "Route appears relatively safe under current conditions. Standard monsoon travel precautions apply."

        return jsonify({
            "success": True,
            "overall_risk": overall_risk,
            "route_safe": route_safe,
            "advisory": advisory,
            "risk_zones_intersected": intersected_zones,
            "total_zones_checked": len(KNOWN_RISK_ZONES)
        }), 200

    except Exception as e:
        logger.error(f"Route risk error: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500
