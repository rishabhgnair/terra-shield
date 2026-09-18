"""
Terra Shield — Government Alert Engine
Handles dispatch of NDRF/Medical team alerts when risk reaches HIGH/CRITICAL levels.
Provides persistence in SQLite and can be extended to integrate with real govt APIs.
"""
import datetime
import math
from app.database.models import get_connection
from app.utils.logger import logger


RISK_TEAM_MAPPING = {
    'CRITICAL': ['NDRF', 'Medical', 'Police'],
    'HIGH': ['NDRF', 'Medical'],
    'MODERATE': ['Revenue_Officer'],
    'LOW': []
}

RISK_DISPATCH_THRESHOLD = {'HIGH', 'CRITICAL'}


def _haversine_km(lat1, lon1, lat2, lon2):
    """Calculate great-circle distance in km between two lat/lng points."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def dispatch_govt_alert(site_id, site_name, state, latitude, longitude, risk_level, message=None):
    """
    Dispatch government alert for a given monitoring site.
    Creates alert records for each applicable team type.
    Returns list of dispatched alert IDs.
    """
    if risk_level not in RISK_DISPATCH_THRESHOLD:
        return []

    teams = RISK_TEAM_MAPPING.get(risk_level, [])
    dispatched_at = datetime.datetime.now(datetime.timezone.utc).isoformat()

    if not message:
        if risk_level == 'CRITICAL':
            message = (
                f"CRITICAL LANDSLIDE RISK at {site_name}, {state}. "
                "Immediate field response required. Evacuate vulnerable populations. "
                "All NDRF units to deploy within 30 minutes."
            )
        else:
            message = (
                f"HIGH LANDSLIDE RISK detected at {site_name}, {state}. "
                "Field verification and standby deployment requested. "
                "Medical unit on alert."
            )

    conn = get_connection()
    cursor = conn.cursor()
    alert_ids = []

    for team in teams:
        # Check for recent duplicate (within last 2 hours for same site + team)
        cursor.execute('''
            SELECT id FROM alerts
            WHERE site_id = ? AND team_type = ? AND acknowledged = 0
              AND datetime(dispatched_at) >= datetime('now', '-2 hours')
        ''', (site_id, team))
        existing = cursor.fetchone()
        if existing:
            logger.info(f"Skipping duplicate alert for {site_id}/{team} — active alert exists.")
            alert_ids.append(existing['id'])
            continue

        cursor.execute('''
            INSERT INTO alerts (site_id, site_name, state, latitude, longitude, risk_level, team_type, message, dispatched_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (site_id, site_name, state, latitude, longitude, risk_level, team, message, dispatched_at))
        alert_ids.append(cursor.lastrowid)
        logger.info(f"[GOVT ALERT] Dispatched {team} to {site_name} ({risk_level})")

    conn.commit()
    conn.close()
    return alert_ids


def get_all_alerts(limit=50, unacknowledged_only=False):
    """Fetch recent government alerts from database."""
    conn = get_connection()
    cursor = conn.cursor()
    if unacknowledged_only:
        cursor.execute(
            'SELECT * FROM alerts WHERE acknowledged = 0 ORDER BY id DESC LIMIT ?',
            (limit,)
        )
    else:
        cursor.execute('SELECT * FROM alerts ORDER BY id DESC LIMIT ?', (limit,))
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows


def acknowledge_alert(alert_id):
    """Mark a government alert as acknowledged."""
    conn = get_connection()
    cursor = conn.cursor()
    acked_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
    cursor.execute(
        'UPDATE alerts SET acknowledged = 1, acknowledged_at = ? WHERE id = ?',
        (acked_at, alert_id)
    )
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0


def get_incident_history(lat=None, lng=None, radius_km=100.0, limit=20, state=None):
    """
    Fetch historical landslide incidents, optionally filtered by proximity or state.
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM incident_history ORDER BY event_date DESC LIMIT 200')
    all_incidents = [dict(row) for row in cursor.fetchall()]
    conn.close()

    if state:
        all_incidents = [i for i in all_incidents if i.get('state', '').lower() == state.lower()]

    if lat is not None and lng is not None:
        all_incidents = [
            i for i in all_incidents
            if _haversine_km(lat, lng, i['latitude'], i['longitude']) <= radius_km
        ]
        # Sort by distance
        all_incidents.sort(key=lambda i: _haversine_km(lat, lng, i['latitude'], i['longitude']))

    return all_incidents[:limit]
