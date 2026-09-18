from flask import Blueprint, jsonify

health_bp = Blueprint('health', __name__)

@health_bp.route('/', methods=['GET'])
def index():
    return jsonify({
        "status": "ok",
        "service": "terra-shield-api",
        "version": "1.0.0",
        "message": "Terra Shield landslide risk monitoring REST API is running.",
        "dashboard_url": "http://localhost:3000",
        "endpoints": {
            "health": "/health",
            "predict": "POST /api/predict",
            "sensor_data_post": "POST /api/sensor-data",
            "sensor_data_get": "GET /api/sensor-data",
            "predictions": "GET /api/predictions",
            "devices": "GET /api/devices",
            "demo_scenario": "POST /api/demo/scenario",
            "metadata": "GET /api/metadata"
        }
    }), 200

@health_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "ok",
        "service": "terra-shield-api",
        "version": "1.0.0",
        "region": "North Eastern Region (NER) India"
    }), 200
