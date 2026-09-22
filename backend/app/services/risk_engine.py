from app.services.safety_rules import evaluate_safety_rules

# Configurable Terra Shield risk thresholds
LOW_THRESHOLD = 0.35
HIGH_THRESHOLD = 0.70


def determine_risk_level(probability, sanitized_inputs):
    """
    Evaluates risk level from ML probability and applies Layer 2 safety overrides.
    Generates explainability factors and human-readable early warning messages.
    """
    rainfall = sanitized_inputs.get('rainfall', 0.0)
    slope = sanitized_inputs.get('slope', 0.0)
    soil_moisture = sanitized_inputs.get('soil_moisture', 0.0)
    ground_movement = sanitized_inputs.get('ground_movement', 0.0)

    if probability < LOW_THRESHOLD:
        ml_risk_level = 'LOW'
    elif probability <= HIGH_THRESHOLD:
        ml_risk_level = 'MODERATE'
    else:
        ml_risk_level = 'HIGH'

    triggered, forced_risk, safety_reason = evaluate_safety_rules(
        rainfall, slope, soil_moisture, ground_movement
    )

    final_risk_level = ml_risk_level
    safety_override = False

    if triggered and forced_risk:
        risk_priority = {'LOW': 1, 'MODERATE': 2, 'HIGH': 3, 'CRITICAL': 4}
        if risk_priority[forced_risk] > risk_priority[ml_risk_level]:
            final_risk_level = forced_risk
            safety_override = True

    contributing_factors = []

    if rainfall > 80:
        contributing_factors.append({'factor': 'Rainfall Intensity', 'level': 'CRITICAL', 'value': f"{rainfall} mm"})
    elif rainfall > 35:
        contributing_factors.append({'factor': 'Rainfall Intensity', 'level': 'ELEVATED', 'value': f"{rainfall} mm"})
    else:
        contributing_factors.append({'factor': 'Rainfall Intensity', 'level': 'NORMAL', 'value': f"{rainfall} mm"})

    if slope > 40:
        contributing_factors.append({'factor': 'Slope Steepness', 'level': 'CRITICAL', 'value': f"{slope} deg"})
    elif slope > 25:
        contributing_factors.append({'factor': 'Slope Steepness', 'level': 'ELEVATED', 'value': f"{slope} deg"})
    else:
        contributing_factors.append({'factor': 'Slope Steepness', 'level': 'NORMAL', 'value': f"{slope} deg"})

    if soil_moisture > 75:
        contributing_factors.append({'factor': 'Soil Saturation', 'level': 'CRITICAL', 'value': f"{soil_moisture}%"})
    elif soil_moisture > 45:
        contributing_factors.append({'factor': 'Soil Saturation', 'level': 'ELEVATED', 'value': f"{soil_moisture}%"})

    if ground_movement > 5.0:
        contributing_factors.append({'factor': 'Ground Displacement', 'level': 'CRITICAL', 'value': f"{ground_movement} mm"})
    elif ground_movement > 1.5:
        contributing_factors.append({'factor': 'Ground Displacement', 'level': 'ELEVATED', 'value': f"{ground_movement} mm"})

    if final_risk_level == 'CRITICAL':
        message = "CRITICAL LANDSLIDE RISK DETECTED. Extreme environmental conditions present. Immediate evacuation advisory — deploy NDRF and emergency response teams."
    elif final_risk_level == 'HIGH':
        message = "HIGH LANDSLIDE RISK DETECTED. Environmental and geological metrics indicate severe risk. Heightened monitoring and safety protocols recommended."
    elif final_risk_level == 'MODERATE':
        message = "MODERATE LANDSLIDE RISK DETECTED. Environmental conditions elevated. Continued sensor monitoring is recommended."
    else:
        message = "LOW ESTIMATED LANDSLIDE RISK. Observed parameters remain within safe baseline bounds."

    if safety_override:
        message += f" (Safety layer rule override: {safety_reason})"

    return {
        'risk_level': final_risk_level,
        'ml_risk_level': ml_risk_level,
        'risk_probability': round(float(probability), 4),
        'safety_override': safety_override,
        'safety_reason': safety_reason if safety_override else None,
        'message': message,
        'contributing_factors': contributing_factors,
        'disclaimer': "Estimated risk model for monitoring support. Not a guaranteed event prediction."
    }
