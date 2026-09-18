import sys
import os
import unittest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'iot')))

from realistic_scenarios import ScenarioGenerator

class IoTTestCase(unittest.TestCase):
    def setUp(self):
        self.generator = ScenarioGenerator()

    def test_normal_scenario_ranges(self):
        data = self.generator.generate_normal()
        self.assertGreaterEqual(data['rainfall'], 0.0)
        self.assertLessEqual(data['rainfall'], 40.0)
        self.assertGreaterEqual(data['slope'], 5.0)

    def test_critical_scenario_ranges(self):
        data = self.generator.generate_critical()
        self.assertGreaterEqual(data['rainfall'], 70.0)
        self.assertGreaterEqual(data['soil_moisture'], 60.0)

if __name__ == '__main__':
    unittest.main()
