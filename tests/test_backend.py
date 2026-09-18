import sys
import os
import unittest
import json

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app import create_app

class BackendTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()

    def test_health_endpoint(self):
        response = self.client.get('/health')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'ok')
        self.assertEqual(data['service'], 'terra-shield-api')

    def test_valid_prediction(self):
        payload = {
            "rainfall": 92.5,
            "slope": 34.7,
            "soil_moisture": 72.0,
            "ground_movement": 4.2,
            "temperature": 26.0
        }
        response = self.client.post('/api/predict', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn(data['risk_level'], ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'])
        self.assertGreaterEqual(data['risk_probability'], 0.0)

    def test_invalid_rainfall(self):
        payload = {"rainfall": -25.0, "slope": 30.0}
        response = self.client.post('/api/predict', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])

    def test_invalid_slope(self):
        payload = {"rainfall": 50.0, "slope": 120.0}
        response = self.client.post('/api/predict', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 400)

    def test_sensor_data_endpoint(self):
        payload = {
            "device_id": "ESP32-TEST",
            "site_id": "NER-SITE-001",
            "rainfall": 45.0,
            "slope": 32.0,
            "soil_moisture": 55.0,
            "ground_movement": 1.8
        }
        response = self.client.post('/api/sensor-data', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertTrue(data['success'])

    def test_get_sensor_data_and_predictions(self):
        response_readings = self.client.get('/api/sensor-data?limit=5')
        self.assertEqual(response_readings.status_code, 200)
        data_readings = json.loads(response_readings.data)
        self.assertTrue(data_readings['success'])

        response_preds = self.client.get('/api/predictions?limit=5')
        self.assertEqual(response_preds.status_code, 200)
        data_preds = json.loads(response_preds.data)
        self.assertTrue(data_preds['success'])

    def test_devices_status_endpoint(self):
        response = self.client.get('/api/devices')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])

    def test_demo_scenario_endpoints(self):
        post_resp = self.client.post('/api/demo/scenario', data=json.dumps({'scenario': 'CRITICAL'}), content_type='application/json')
        self.assertEqual(post_resp.status_code, 200)
        post_data = json.loads(post_resp.data)
        self.assertEqual(post_data['current_scenario'], 'CRITICAL')

        get_resp = self.client.get('/api/demo/scenario')
        self.assertEqual(get_resp.status_code, 200)
        get_data = json.loads(get_resp.data)
        self.assertEqual(get_data['current_scenario'], 'CRITICAL')

        # Reset back to AUTO
        self.client.post('/api/demo/scenario', data=json.dumps({'scenario': 'AUTO'}), content_type='application/json')

    def test_metadata_endpoint(self):
        response = self.client.get('/api/metadata')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('metadata', data)

    def test_weather_endpoint(self):
        response = self.client.get('/api/weather?lat=27.33&lng=88.61')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('temperature', data)

    def test_weather_forecast_endpoint(self):
        response = self.client.get('/api/weather/forecast?lat=25.9&lng=92.7')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('current', data)

    def test_export_csv_endpoint(self):
        response = self.client.get('/api/export/csv?type=readings')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, 'text/csv')

        pred_resp = self.client.get('/api/export/csv?type=predictions')
        self.assertEqual(pred_resp.status_code, 200)
        self.assertEqual(pred_resp.mimetype, 'text/csv')

    def test_reverse_geocoding_endpoint(self):
        response = self.client.get('/api/geocoding/reverse?lat=27.3389&lng=88.6065')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('name', data)

    def test_govt_alerts_workflow(self):
        # Dispatch manual alert
        payload = {
            "site_id": "NER-SITE-001",
            "site_name": "Shillong Slope Alpha",
            "state": "Meghalaya",
            "latitude": 25.5788,
            "longitude": 91.8933,
            "risk_level": "CRITICAL",
            "message": "Immediate evacuation warning"
        }
        post_resp = self.client.post('/api/alerts', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(post_resp.status_code, 201)
        post_data = json.loads(post_resp.data)
        self.assertTrue(post_data['success'])
        alert_ids = post_data.get('alert_ids', [])
        self.assertGreater(len(alert_ids), 0)

        # Get alerts
        get_resp = self.client.get('/api/alerts')
        self.assertEqual(get_resp.status_code, 200)
        get_data = json.loads(get_resp.data)
        self.assertTrue(get_data['success'])
        self.assertGreater(len(get_data['data']), 0)

        # Acknowledge first alert
        first_id = alert_ids[0]
        ack_resp = self.client.post(f'/api/alerts/{first_id}/acknowledge')
        self.assertEqual(ack_resp.status_code, 200)
        ack_data = json.loads(ack_resp.data)
        self.assertTrue(ack_data['success'])

    def test_incident_history_endpoint(self):
        response = self.client.get('/api/incident-history?lat=25.5788&lng=91.8933&radius=100')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('data', data)
        self.assertIn('ai_analysis', data)

    def test_ai_analysis_endpoint(self):
        payload = {
            "rainfall": 120.0,
            "slope": 45.0,
            "soil_moisture": 85.0,
            "ground_movement": 6.5,
            "temperature": 22.0,
            "risk_level": "CRITICAL",
            "risk_probability": 0.92,
            "site_name": "Shillong Test Pass"
        }
        response = self.client.post('/api/ai-analysis', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('narrative', data)
        self.assertIn('recommendation', data)

    def test_route_risk_endpoint(self):
        payload = {
            "coordinates": [
                [25.5788, 91.8933],
                [25.6000, 91.9000],
                [26.1500, 92.7800]
            ]
        }
        response = self.client.post('/api/route-risk', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('overall_risk', data)
        self.assertIn('route_safe', data)
        self.assertIn('advisory', data)

if __name__ == '__main__':
    unittest.main()

