def validate_sensor_inputs(data):
    """
    Validates input sensor data for landslide risk prediction.
    Returns (is_valid, error_message, sanitized_data)
    """
    if not isinstance(data, dict):
        return False, "Invalid JSON payload structure.", None

    # Required fields check
    if 'rainfall' not in data or data['rainfall'] is None:
        return False, "Missing required field: 'rainfall'", None

    if 'slope' not in data or data['slope'] is None:
        return False, "Missing required field: 'slope'", None

    try:
        rainfall = float(data['rainfall'])
        slope = float(data['slope'])
    except (ValueError, TypeError):
        return False, "Fields 'rainfall' and 'slope' must be numeric values.", None

    # Numerical range checks
    if rainfall < 0 or rainfall > 500:
        return False, f"Invalid rainfall value: {rainfall}. Must be between 0 and 500 mm.", None

    if slope < 0 or slope > 90:
        return False, f"Invalid slope value: {slope}. Must be between 0 and 90 degrees.", None

    soil_moisture = 0.0
    if 'soil_moisture' in data and data['soil_moisture'] is not None:
        try:
            soil_moisture = float(data['soil_moisture'])
            if soil_moisture < 0 or soil_moisture > 100:
                return False, f"Invalid soil moisture value: {soil_moisture}. Must be between 0% and 100%.", None
        except (ValueError, TypeError):
            return False, "Field 'soil_moisture' must be numeric.", None

    ground_movement = 0.0
    if 'ground_movement' in data and data['ground_movement'] is not None:
        try:
            ground_movement = float(data['ground_movement'])
            if ground_movement < 0 or ground_movement > 200:
                return False, f"Invalid ground movement value: {ground_movement}. Must be between 0 and 200 mm.", None
        except (ValueError, TypeError):
            return False, "Field 'ground_movement' must be numeric.", None

    temperature = 25.0
    if 'temperature' in data and data['temperature'] is not None:
        try:
            temperature = float(data['temperature'])
            if temperature < -50 or temperature > 60:
                return False, f"Invalid temperature value: {temperature}. Must be between -50 deg C and 60 deg C.", None
        except (ValueError, TypeError):
            return False, "Field 'temperature' must be numeric.", None

    latitude = data.get('latitude')
    if latitude is not None:
        try:
            latitude = float(latitude)
            if latitude < -90 or latitude > 90:
                return False, f"Invalid latitude value: {latitude}. Must be between -90 and 90.", None
        except (ValueError, TypeError):
            return False, "Field 'latitude' must be numeric.", None

    longitude = data.get('longitude')
    if longitude is not None:
        try:
            longitude = float(longitude)
            if longitude < -180 or longitude > 180:
                return False, f"Invalid longitude value: {longitude}. Must be between -180 and 180.", None
        except (ValueError, TypeError):
            return False, "Field 'longitude' must be numeric.", None

    sanitized = {
        'rainfall': round(rainfall, 2),
        'slope': round(slope, 2),
        'soil_moisture': round(soil_moisture, 2),
        'ground_movement': round(ground_movement, 2),
        'temperature': round(temperature, 2),
        'device_id': data.get('device_id', 'ESP32-001'),
        'site_id': data.get('site_id', 'NER-SITE-001'),
        'location': data.get('location', 'Shillong, Meghalaya'),
        'latitude': round(latitude, 6) if latitude is not None else None,
        'longitude': round(longitude, 6) if longitude is not None else None,
        'battery': float(data.get('battery', 100.0))
    }

    return True, None, sanitized
