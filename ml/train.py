import os
import json
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score, precision_recall_fscore_support, confusion_matrix
from generate_dataset import generate_landslide_dataset

def train_and_save_model():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(script_dir, 'dataset.csv')
    
    if not os.path.exists(dataset_path):
        print("Dataset not found. Generating dataset...")
        df = generate_landslide_dataset()
        df.to_csv(dataset_path, index=False)
    else:
        df = pd.read_csv(dataset_path)
        
    print(f"Dataset loaded. Total samples: {len(df)}")
    
    # Feature columns used for primary model
    # Primary required features: rainfall_mm, slope_degree
    # Extended features: soil_moisture, ground_movement, temperature
    feature_cols = ['rainfall_mm', 'slope_degree', 'soil_moisture', 'ground_movement', 'temperature']
    target_col = 'risk_label'
    
    # Validate required columns
    for col in feature_cols + [target_col]:
        if col not in df.columns:
            raise ValueError(f"Missing required column: {col}")
            
    # Handle missing values if any
    df = df.dropna(subset=feature_cols + [target_col])
    
    X = df[feature_cols]
    y = df[target_col]
    
    # Train / Test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    
    print(f"Training set: {len(X_train)} samples, Test set: {len(X_test)} samples")
    
    # Train RandomForestClassifier
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        class_weight='balanced'
    )
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_pred, average='weighted')
    report_dict = classification_report(y_test, y_pred, output_dict=True)
    report_str = classification_report(y_test, y_pred)
    
    print("\n--- MODEL EVALUATION REPORT ---")
    print(report_str)
    print(f"Accuracy: {acc:.4f}")
    
    # Save target directory in backend/models
    backend_models_dir = os.path.abspath(os.path.join(script_dir, '..', 'backend', 'models'))
    os.makedirs(backend_models_dir, exist_ok=True)
    
    model_filepath = os.path.join(backend_models_dir, 'landslide_model.joblib')
    metadata_filepath = os.path.join(backend_models_dir, 'metadata.json')
    
    # Feature importances
    importances = dict(zip(feature_cols, [round(float(v), 4) for v in model.feature_importances_]))
    
    metadata = {
        'model_type': 'RandomForestClassifier',
        'n_estimators': 100,
        'features': feature_cols,
        'target_classes': list(model.classes_),
        'metrics': {
            'accuracy': round(float(acc), 4),
            'precision': round(float(precision), 4),
            'recall': round(float(recall), 4),
            'f1_score': round(float(f1), 4)
        },
        'feature_importances': importances,
        'classification_report': report_dict
    }
    
    joblib.dump(model, model_filepath)
    with open(metadata_filepath, 'w') as f:
        json.dump(metadata, f, indent=2)
        
    print(f"\nModel successfully saved to: {model_filepath}")
    print(f"Metadata saved to: {metadata_filepath}")
    return metadata

if __name__ == '__main__':
    train_and_save_model()
