import sqlite3
import os
from flask import g

DB_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'landslide.db')
)

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        db = g._database = sqlite3.connect(DB_PATH)
        db.row_factory = sqlite3.Row
    return db

def close_db(e=None):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def ensure_column(cursor, table_name, column_name, column_definition):
    cursor.execute(f'PRAGMA table_info({table_name})')
    existing_columns = {row[1] for row in cursor.fetchall()}
    if column_name not in existing_columns:
        cursor.execute(f'ALTER TABLE {table_name} ADD COLUMN {column_name} {column_definition}')

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Table: sensor_readings
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sensor_readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id TEXT NOT NULL,
            site_id TEXT DEFAULT 'NER-SITE-001',
            location TEXT,
            latitude REAL,
            longitude REAL,
            rainfall REAL NOT NULL,
            slope REAL NOT NULL,
            soil_moisture REAL,
            ground_movement REAL,
            temperature REAL,
            battery REAL,
            timestamp TEXT NOT NULL
        )
    ''')
    
    # Table: predictions
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reading_id INTEGER,
            device_id TEXT NOT NULL,
            risk_level TEXT NOT NULL,
            probability REAL NOT NULL,
            rainfall REAL,
            slope REAL,
            soil_moisture REAL,
            ground_movement REAL,
            temperature REAL,
            message TEXT,
            safety_override INTEGER DEFAULT 0,
            timestamp TEXT NOT NULL,
            FOREIGN KEY (reading_id) REFERENCES sensor_readings (id)
        )
    ''')
    
    # Table: devices
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS devices (
            device_id TEXT PRIMARY KEY,
            site_id TEXT NOT NULL,
            location TEXT NOT NULL,
            latitude REAL,
            longitude REAL,
            status TEXT DEFAULT 'Online',
            battery REAL DEFAULT 100.0,
            signal_quality TEXT DEFAULT 'Good',
            last_seen TEXT NOT NULL
        )
    ''')

    # Table: alerts (Government alert dispatch log - NDRF/Medical teams)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            site_id TEXT NOT NULL,
            site_name TEXT NOT NULL,
            state TEXT,
            latitude REAL,
            longitude REAL,
            risk_level TEXT NOT NULL,
            team_type TEXT NOT NULL,
            message TEXT,
            dispatched_at TEXT NOT NULL,
            acknowledged INTEGER DEFAULT 0,
            acknowledged_at TEXT
        )
    ''')

    # Table: incident_history (Historical landslide events in NE India)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS incident_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            location_name TEXT NOT NULL,
            state TEXT NOT NULL,
            event_date TEXT NOT NULL,
            rainfall_mm REAL,
            casualties INTEGER DEFAULT 0,
            injured INTEGER DEFAULT 0,
            displaced INTEGER DEFAULT 0,
            landslide_type TEXT DEFAULT 'Debris flow',
            severity TEXT DEFAULT 'MODERATE',
            trigger_cause TEXT,
            notes TEXT
        )
    ''')

    ensure_column(cursor, 'sensor_readings', 'latitude', 'REAL')
    ensure_column(cursor, 'sensor_readings', 'longitude', 'REAL')
    ensure_column(cursor, 'devices', 'latitude', 'REAL')
    ensure_column(cursor, 'devices', 'longitude', 'REAL')

    # Seed historical NE India incident data if table is empty
    cursor.execute('SELECT COUNT(*) FROM incident_history')
    if cursor.fetchone()[0] == 0:
        incidents = [
            (25.5788, 91.8933, 'Shillong East Slope', 'Meghalaya', '2024-07-12', 148.5, 3, 7, 120, 'Debris flow', 'CRITICAL', 'Heavy monsoon rainfall', 'NH-44 blocked for 36 hours. Retaining wall failure.'),
            (25.5788, 91.8933, 'Shillong Alpha Ridge', 'Meghalaya', '2023-08-04', 112.3, 1, 4, 45, 'Rock slide', 'HIGH', 'Prolonged saturation', 'Partial NH-44 closure. Slope gradient 36deg.'),
            (25.5788, 91.8933, 'Shillong Umiam Valley', 'Meghalaya', '2022-06-18', 89.0, 0, 2, 30, 'Debris flow', 'MODERATE', 'Monsoon onset surge', 'Road erosion reported. No fatalities.'),
            (27.3389, 88.6065, 'Gangtok NH-10 Corridor', 'Sikkim', '2023-10-04', 210.0, 41, 58, 4000, 'Flash landslide', 'CRITICAL', 'GLOF + extreme rainfall', 'Teesta River flooding. Major disaster. Multiple bridges destroyed.'),
            (27.3389, 88.6065, 'Gangtok Tadong Area', 'Sikkim', '2022-08-16', 134.2, 5, 12, 200, 'Debris flow', 'HIGH', 'Monsoon surge', 'National Highway blocked. Army deployed.'),
            (27.3389, 88.6065, 'Sikkim Rangpo', 'Sikkim', '2021-07-29', 98.6, 2, 6, 80, 'Soil slip', 'HIGH', 'Saturated slope', 'NH-10 landslip zone.'),
            (23.7271, 92.7176, 'Aizawl West Ridge', 'Mizoram', '2024-06-23', 167.4, 6, 18, 350, 'Debris flow', 'CRITICAL', 'Cyclonic rainfall', 'Cyclone Remal aftermath. 6 houses buried.'),
            (23.7271, 92.7176, 'Aizawl Bawngkawn', 'Mizoram', '2023-07-11', 88.5, 2, 5, 120, 'Soil slip', 'HIGH', 'Heavy monsoon', 'Urban fringe slope failure.'),
            (23.7271, 92.7176, 'Lunglei Slope', 'Mizoram', '2022-08-02', 76.0, 1, 3, 60, 'Rock slide', 'MODERATE', 'Soil saturation', 'Single road blocked.'),
            (25.6751, 94.1086, 'Kohima Highway Cut', 'Nagaland', '2023-07-28', 92.3, 0, 1, 20, 'Debris flow', 'MODERATE', 'Monsoon rainfall', 'National Highway slip. Road cleared in 12h.'),
            (25.6751, 94.1086, 'Kohima Phesama', 'Nagaland', '2022-09-10', 78.1, 1, 2, 35, 'Soil slip', 'MODERATE', 'Prolonged rain', 'Residential area affected.'),
            (27.0844, 93.6053, 'Itanagar North Face', 'Arunachal Pradesh', '2024-06-15', 182.0, 8, 22, 600, 'Debris avalanche', 'CRITICAL', 'Pre-monsoon cloudburst', 'State capital area. Emergency declared.'),
            (27.0844, 93.6053, 'Papum Pare District', 'Arunachal Pradesh', '2023-08-20', 141.5, 4, 11, 300, 'Debris flow', 'HIGH', 'Heavy monsoon', 'Village access cut off for 5 days.'),
            (27.0844, 93.6053, 'Naharlagun Slope', 'Arunachal Pradesh', '2022-07-04', 103.8, 2, 8, 150, 'Soil slip', 'HIGH', 'Intense rainfall', 'NH-415 blocked.'),
            (24.817, 93.9368, 'Imphal Senapati Road', 'Manipur', '2024-07-30', 201.7, 12, 31, 1200, 'Debris flow', 'CRITICAL', 'Extreme monsoon + deforestation', 'NH-2 completely blocked. NDRF deployed.'),
            (24.817, 93.9368, 'Imphal Valley Perimeter', 'Manipur', '2023-06-25', 156.2, 7, 19, 450, 'Debris avalanche', 'CRITICAL', 'Intense rainfall', 'Multiple villages affected.'),
            (24.817, 93.9368, 'Chandel District Manipur', 'Manipur', '2022-08-09', 118.4, 3, 9, 200, 'Rock slide', 'HIGH', 'Monsoon saturation', 'Myanmar border road blocked.'),
            (26.15, 92.78, 'Guwahati Hills', 'Assam', '2024-06-28', 178.3, 9, 25, 800, 'Debris flow', 'CRITICAL', 'Monsoon cloudburst', 'Kamrup Metro district. Urban landslide.'),
            (26.15, 92.78, 'Dispur Slope', 'Assam', '2023-07-15', 122.6, 4, 14, 320, 'Soil slip', 'HIGH', 'Heavy monsoon', 'Capital complex area affected.'),
            (25.28, 92.49, 'Silchar Barak Valley', 'Assam', '2022-06-19', 96.5, 1, 5, 80, 'Debris flow', 'MODERATE', 'Flash flooding', 'NH-306 affected.'),
            (24.14, 92.77, 'Tripura Gomati Hills', 'Tripura', '2024-07-08', 143.2, 5, 13, 420, 'Debris flow', 'HIGH', 'Bay of Bengal cyclone effect', 'Eastern Tripura corridor blocked.'),
            (24.14, 92.77, 'Dhalai Tripura', 'Tripura', '2023-08-12', 88.7, 2, 6, 130, 'Soil slip', 'MODERATE', 'Monsoon', 'State highway affected.'),
            (25.57, 91.88, 'East Khasi Hills NH', 'Meghalaya', '2024-08-10', 195.0, 7, 20, 550, 'Debris flow', 'CRITICAL', 'Extended monsoon period', 'NE India worst hit in decade.'),
            (27.22, 88.42, 'Darjeeling Toy Train Route', 'West Bengal', '2023-07-09', 167.8, 11, 29, 3200, 'Multiple debris flows', 'CRITICAL', 'Monsoon + deforestation', 'UNESCO heritage railway damaged. 11 killed.'),
        ]
        cursor.executemany('''
            INSERT INTO incident_history (latitude, longitude, location_name, state, event_date, rainfall_mm, casualties, injured, displaced, landslide_type, severity, trigger_cause, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', incidents)

    conn.commit()
    conn.close()
