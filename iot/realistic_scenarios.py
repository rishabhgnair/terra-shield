import random
import time

SITE_REGISTRY = {
    "NER-SITE-001": {
        "location": "Shillong Slope Alpha, Meghalaya",
        "latitude": 25.5788,
        "longitude": 91.8933
    },
    "NER-SITE-002": {
        "location": "Gangtok Highway Ridge, Sikkim",
        "latitude": 27.3389,
        "longitude": 88.6065
    },
    "NER-SITE-003": {
        "location": "Aizawl West Pass, Mizoram",
        "latitude": 23.7271,
        "longitude": 92.7176
    }
}

class ScenarioGenerator:
    def __init__(self):
        self.step = 0

    def site_metadata(self, site_id):
        return SITE_REGISTRY.get(site_id, SITE_REGISTRY["NER-SITE-001"])

    def generate_normal(self, device_id="ESP32-001", site_id="NER-SITE-001"):
        """
        NORMAL Scenario: Stable geological and weather conditions.
        Operational simulation values.
        """
        site = self.site_metadata(site_id)
        return {
            "device_id": device_id,
            "site_id": site_id,
            "location": site["location"],
            "latitude": site["latitude"],
            "longitude": site["longitude"],
            "rainfall": round(random.uniform(5.0, 25.0), 2),
            "slope": round(random.uniform(15.0, 25.0), 2),
            "soil_moisture": round(random.uniform(20.0, 45.0), 2),
            "ground_movement": round(random.uniform(0.1, 1.2), 2),
            "temperature": round(random.uniform(20.0, 28.0), 2),
            "battery": round(random.uniform(85.0, 100.0), 1)
        }

    def generate_warning(self, device_id="ESP32-001", site_id="NER-SITE-001"):
        """
        WARNING Scenario: Increasing rainfall and moderately unstable conditions.
        Operational simulation values.
        """
        site = self.site_metadata(site_id)
        return {
            "device_id": device_id,
            "site_id": site_id,
            "location": site["location"],
            "latitude": site["latitude"],
            "longitude": site["longitude"],
            "rainfall": round(random.uniform(45.0, 78.0), 2),
            "slope": round(random.uniform(28.0, 38.0), 2),
            "soil_moisture": round(random.uniform(50.0, 72.0), 2),
            "ground_movement": round(random.uniform(2.5, 5.2), 2),
            "temperature": round(random.uniform(18.0, 24.0), 2),
            "battery": round(random.uniform(70.0, 95.0), 1)
        }

    def generate_critical(self, device_id="ESP32-001", site_id="NER-SITE-001"):
        """
        CRITICAL Scenario: Heavy rainfall, saturated soil, and active ground displacement.
        Operational simulation values.
        """
        site = self.site_metadata(site_id)
        return {
            "device_id": device_id,
            "site_id": site_id,
            "location": site["location"],
            "latitude": site["latitude"],
            "longitude": site["longitude"],
            "rainfall": round(random.uniform(85.0, 145.0), 2),
            "slope": round(random.uniform(36.0, 52.0), 2),
            "soil_moisture": round(random.uniform(75.0, 96.0), 2),
            "ground_movement": round(random.uniform(6.5, 16.0), 2),
            "temperature": round(random.uniform(16.0, 22.0), 2),
            "battery": round(random.uniform(60.0, 90.0), 1)
        }

    def generate_auto(self, device_id="ESP32-001", site_id="NER-SITE-001"):
        """
        AUTO Scenario: Seamless progression from Normal -> Warning -> Critical -> Normal.
        Hands-free progression for live Terra Shield demonstrations.
        """
        self.step += 1
        cycle_pos = self.step % 18
        
        if cycle_pos < 6:
            # Normal phase
            return self.generate_normal(device_id, site_id)
        elif cycle_pos < 12:
            # Warning phase
            return self.generate_warning(device_id, site_id)
        else:
            # Critical phase
            return self.generate_critical(device_id, site_id)

    def generate_fault(self, device_id="ESP32-001", site_id="NER-SITE-001"):
        """
        FAULT Simulation: Injects intentional invalid readings to demonstrate backend data validation.
        """
        fault_type = random.choice(['invalid_slope', 'negative_rain', 'out_of_range_moisture'])
        
        reading = self.generate_normal(device_id, site_id)
        if fault_type == 'invalid_slope':
            reading['slope'] = 120.0  # Impossible slope (> 90 degrees)
        elif fault_type == 'negative_rain':
            reading['rainfall'] = -15.0  # Invalid negative rainfall
        else:
            reading['soil_moisture'] = 150.0  # Invalid percentage (> 100%)
            
        return reading
