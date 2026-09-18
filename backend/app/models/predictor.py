import os
import json
import joblib
import pandas as pd
import numpy as np
from app.utils.logger import logger

class LandslidePredictor:
    def __init__ (self):
        self.model = None
        self.metadata = None
        self.load_model()
        
    def load_model(self):
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
        model_path = os.path.join(base_dir, 'models', 'landslide_model.joblib')
        meta_path = os.path.join(base_dir, 'models', 'metadata.json')
        
        if not os.path.exists(model_path):
            logger.warning(f"ML Model file not found at {model_path}. Attempting training...")
            try:
                import sys
                ml_dir = os.path.abspath(os.path.join(base_dir, '..', 'ml'))
                sys.path.append(ml_dir)
                from train import train_and_save_model
                train_and_save_model()
            except Exception as e:
                logger.error(f"Failed to auto-train ML model: {e}")
                return
                
        if os.path.exists(model_path):
            self.model = joblib.load(model_path)
            logger.info(f"Loaded trained ML model from {model_path}")
            
        if os.path.exists(meta_path):
            with open(meta_path, 'r') as f:
                self.metadata = json.load(f)
            logger.info("Loaded ML metadata.")

    def predict(self, sanitized_inputs):
        """
        Runs prediction using trained model.
        Returns risk_probability (float between 0 and 1).
        """
        if self.model is None:
            self.load_model()
            if self.model is None:
                raise RuntimeError("ML model is not initialized or trained.")

        feature_cols = self.metadata.get('features', ['rainfall_mm', 'slope_degree', 'soil_moisture', 'ground_movement', 'temperature']) if self.metadata else ['rainfall_mm', 'slope_degree', 'soil_moisture', 'ground_movement', 'temperature']
        
        input_data = {
            'rainfall_mm': sanitized_inputs['rainfall'],
            'slope_degree': sanitized_inputs['slope'],
            'soil_moisture': sanitized_inputs.get('soil_moisture', 0.0),
            'ground_movement': sanitized_inputs.get('ground_movement', 0.0),
            'temperature': sanitized_inputs.get('temperature', 25.0)
        }
        
        df_input = pd.DataFrame([input_data])[feature_cols]
        
        # Predict probability of risk
        # Classes: ['HIGH', 'LOW', 'MODERATE'] or similar order
        classes = list(self.model.classes_)
        probabilities = self.model.predict_proba(df_input)[0]
        
        prob_dict = dict(zip(classes, probabilities))
        
        # Calculate risk probability score:
        # LOW weight: 0.1, MODERATE weight: 0.5, HIGH weight: 0.95
        high_prob = prob_dict.get('HIGH', 0.0)
        mod_prob = prob_dict.get('MODERATE', 0.0)
        low_prob = prob_dict.get('LOW', 0.0)
        
        risk_probability = (high_prob * 0.95) + (mod_prob * 0.50) + (low_prob * 0.05)
        risk_probability = np.clip(risk_probability, 0.01, 0.99)
        
        return float(risk_probability), prob_dict

predictor = LandslidePredictor()
