def evaluate_safety_rules(rainfall, slope, soil_moisture, ground_movement):
    """
    Layer 2 deterministic safety rules.
    Evaluates physical thresholds that can override or escalate ML predictions.

    Returns:
        (triggered: bool, forced_risk: str, reason: str)
    """
    if rainfall >= 120.0 and ground_movement >= 8.0:
        return True, 'HIGH', "Critical safety trigger: severe precipitation (>=120mm) combined with active ground displacement (>=8mm)."

    if slope >= 48.0 and rainfall >= 90.0:
        return True, 'HIGH', "Critical safety trigger: steep slope (>=48 deg) subjected to intense rainfall (>=90mm)."

    if soil_moisture >= 85.0 and ground_movement >= 10.0:
        return True, 'HIGH', "Critical safety trigger: near-saturated soil moisture (>=85%) with significant shear movement (>=10mm)."

    if rainfall >= 60.0 and ground_movement >= 6.0:
        return True, 'MODERATE', "Safety rule trigger: elevated rainfall and noticeable ground instability."

    return False, None, None
