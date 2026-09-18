import sqlite3
import os

DB_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'landslide.db')
)

def get_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def insert_sensor_reading(data):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO sensor_readings (
            device_id, site_id, location, latitude, longitude, rainfall, slope, soil_moisture, ground_movement, temperature, battery, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data.get('device_id', 'ESP32-001'),
        data.get('site_id', 'NER-SITE-001'),
        data.get('location', 'Shillong, Meghalaya'),
        data.get('latitude'),
        data.get('longitude'),
        data['rainfall'],
        data['slope'],
        data.get('soil_moisture', 0.0),
        data.get('ground_movement', 0.0),
        data.get('temperature', 25.0),
        data.get('battery', 100.0),
        data['timestamp']
    ))
    reading_id = cursor.lastrowid
    
    # Upsert device status
    cursor.execute('''
        INSERT INTO devices (device_id, site_id, location, latitude, longitude, status, battery, last_seen)
        VALUES (?, ?, ?, ?, ?, 'Online', ?, ?)
        ON CONFLICT(device_id) DO UPDATE SET
            site_id=excluded.site_id,
            location=excluded.location,
            latitude=excluded.latitude,
            longitude=excluded.longitude,
            status='Online',
            battery=excluded.battery,
            last_seen=excluded.last_seen
    ''', (
        data.get('device_id', 'ESP32-001'),
        data.get('site_id', 'NER-SITE-001'),
        data.get('location', 'Shillong, Meghalaya'),
        data.get('latitude'),
        data.get('longitude'),
        data.get('battery', 100.0),
        data['timestamp']
    ))
    
    conn.commit()
    conn.close()
    return reading_id

def insert_prediction(data):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO predictions (
            reading_id, device_id, risk_level, probability, rainfall, slope, soil_moisture, ground_movement, temperature, message, safety_override, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data.get('reading_id'),
        data.get('device_id', 'ESP32-001'),
        data['risk_level'],
        data['risk_probability'],
        data.get('inputs', {}).get('rainfall'),
        data.get('inputs', {}).get('slope'),
        data.get('inputs', {}).get('soil_moisture'),
        data.get('inputs', {}).get('ground_movement'),
        data.get('inputs', {}).get('temperature'),
        data['message'],
        1 if data.get('safety_override') else 0,
        data['timestamp']
    ))
    prediction_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return prediction_id

def fetch_recent_readings(limit=20, device_id=None):
    conn = get_connection()
    cursor = conn.cursor()
    if device_id:
        cursor.execute(
            'SELECT * FROM sensor_readings WHERE device_id = ? ORDER BY id DESC LIMIT ?',
            (device_id, limit)
        )
    else:
        cursor.execute(
            'SELECT * FROM sensor_readings ORDER BY id DESC LIMIT ?',
            (limit,)
        )
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows

def fetch_recent_predictions(limit=20, device_id=None):
    conn = get_connection()
    cursor = conn.cursor()
    if device_id:
        cursor.execute(
            'SELECT * FROM predictions WHERE device_id = ? ORDER BY id DESC LIMIT ?',
            (device_id, limit)
        )
    else:
        cursor.execute(
            'SELECT * FROM predictions ORDER BY id DESC LIMIT ?',
            (limit,)
        )
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows

def fetch_devices():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM devices ORDER BY device_id ASC')
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows
