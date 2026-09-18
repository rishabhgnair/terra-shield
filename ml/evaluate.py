import os
import json
import pandas as pd
import joblib
from sklearn.metrics import classification_report, accuracy_score

def evaluate_saved_model():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(script_dir, 'dataset.csv')
    backend_models_dir = os.path.abspath(os.path.join(script_dir, '..', 'backend', 'models'))
    model_path = os.path.join(backend_models_dir, 'landslide_model.joblib')
    metadata_path = os.path.join(backend_models_dir, 'metadata.json')
    
    if not os.path.exists(model_path):
        print(f"Error: Model not found at {model_path}. Run train.py first.")
        return
        
    if not os.path.exists(dataset_path):
        print(f"Error: Dataset not found at {dataset_path}.")
        return
        
    model = joblib.load(model_path)
    df = pd.read_csv(dataset_path)
    
    with open(metadata_path, 'r') as f:
        metadata = json.load(f)
        
    feature_cols = metadata.get('features', ['rainfall_mm', 'slope_degree', 'soil_moisture', 'ground_movement', 'temperature'])
    
    X = df[feature_cols]
    y = df['risk_label']
    
    y_pred = model.predict(X)
    acc = accuracy_score(y, y_pred)
    
    print("\n================ Saved Model Evaluation ================")
    print(f"Model File: {model_path}")
    print(f"Evaluated Samples: {len(df)}")
    print(f"Overall Accuracy: {acc:.4f}\n")
    print(classification_report(y, y_pred))
    print("========================================================")

if __name__ == '__main__':
    evaluate_saved_model()
