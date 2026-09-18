import sys
import os
import unittest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ml')))

from generate_dataset import generate_landslide_dataset

class MLTestCase(unittest.TestCase):
    def test_dataset_generation(self):
        df = generate_landslide_dataset(num_samples=100)
        self.assertEqual(len(df), 100)
        self.assertIn('rainfall_mm', df.columns)
        self.assertIn('slope_degree', df.columns)
        self.assertIn('risk_label', df.columns)
        
        # Check label set
        labels = set(df['risk_label'].unique())
        self.assertTrue(labels.issubset({'LOW', 'MODERATE', 'HIGH'}))

if __name__ == '__main__':
    unittest.main()
