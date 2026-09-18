import numpy as np
import pandas as pd
import os

def generate_landslide_dataset(num_samples=3000, random_state=42, stress_fraction=0.30):
    """
    Generates a realistic synthetic dataset for Landslide Risk Monitoring in NER India.

    Features:
    - rainfall_mm: 24-hour accumulated rainfall in mm (0 to 300 mm)
    - slope_degree: Terrain slope in degrees (5 to 65 degrees)
    - soil_moisture: Volumetric soil moisture percentage (10% to 98%)
    - ground_movement: Micro-displacement in mm (0 to 25 mm)
    - temperature: Ambient temperature in Celsius (5 to 38 °C)

    Target:
    - risk_label: LOW, MODERATE, HIGH

    Generation strategy:
    Samples are drawn from a two-regime mixture rather than one distribution:
      - "baseline" regime (everyday conditions) -- the majority of samples.
      - "stress" regime (active storm systems over steep terrain) -- a smaller
        fraction, biased toward higher rainfall and steeper slope.
    Real landslide-triggering conditions are genuinely rare, so HIGH-risk rows
    should stay a minority class -- but earlier versions of this generator drew
    every sample from one distribution centered on "normal" weather, which made
    HIGH so rare (~2% of rows) that the classifier had almost nothing to learn
    from and the reported HIGH-class precision/recall were noisy artifacts of a
    single-digit test-set count. Mixing in a stress regime keeps the same
    domain-scoring formula and decision thresholds below, but gives the model
    enough real HIGH examples (both to train on and to be evaluated against)
    to make its metrics meaningful.
    """
    rng = np.random.RandomState(random_state)

    n_stress = int(num_samples * stress_fraction)
    n_base = num_samples - n_stress

    # Baseline regime: everyday rainfall and terrain conditions.
    rainfall_base = rng.exponential(scale=35, size=n_base) + rng.uniform(0, 150, size=n_base)
    slope_base = rng.normal(loc=30, scale=11, size=n_base)

    # Stress regime: storm-driven rainfall on steeper terrain.
    rainfall_stress = rng.uniform(70, 300, size=n_stress)
    slope_stress = rng.normal(loc=42, scale=9, size=n_stress)

    rainfall = np.concatenate([rainfall_base, rainfall_stress])
    slope = np.concatenate([slope_base, slope_stress])

    # Shuffle so regime membership isn't encoded in row order.
    shuffle_idx = rng.permutation(num_samples)
    rainfall = rainfall[shuffle_idx]
    slope = slope[shuffle_idx]

    rainfall = np.clip(rainfall, 0, 300)
    slope = np.clip(slope, 5, 65)

    # Soil moisture correlates with rainfall
    soil_moisture = 15 + (rainfall * 0.22) + rng.normal(0, 8, num_samples)
    soil_moisture = np.clip(soil_moisture, 10, 98)

    # Ground movement correlates with slope and soil moisture
    ground_movement = (slope * 0.1) + (soil_moisture * 0.08) + rng.exponential(scale=1.5, size=num_samples)
    ground_movement = np.clip(ground_movement, 0, 25)

    temperature = rng.normal(loc=24, scale=6, size=num_samples)
    temperature = np.clip(temperature, 5, 38)
    
    # Domain-inspired scoring formula for risk label assignment
    # Higher rainfall + slope + soil moisture + ground movement -> Higher risk
    risk_score = (
        (rainfall / 300.0) * 0.40 +
        (slope / 65.0) * 0.25 +
        (soil_moisture / 100.0) * 0.20 +
        (ground_movement / 25.0) * 0.15
    )
    
    # Add realistic environmental noise (±5%) so model doesn't overfit artificially
    noise = rng.normal(0, 0.05, num_samples)
    final_score = np.clip(risk_score + noise, 0, 1)
    
    # Classify into LOW, MODERATE, HIGH based on domain boundaries
    labels = []
    for score in final_score:
        if score < 0.38:
            labels.append('LOW')
        elif score < 0.68:
            labels.append('MODERATE')
        else:
            labels.append('HIGH')
            
    df = pd.DataFrame({
        'rainfall_mm': np.round(rainfall, 2),
        'slope_degree': np.round(slope, 2),
        'soil_moisture': np.round(soil_moisture, 2),
        'ground_movement': np.round(ground_movement, 2),
        'temperature': np.round(temperature, 2),
        'risk_label': labels
    })
    
    return df

if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(script_dir, 'dataset.csv')
    df = generate_landslide_dataset()
    df.to_csv(output_path, index=False)
    print(f"Generated {len(df)} sample landslide dataset at: {output_path}")
    print("Class distribution:")
    print(df['risk_label'].value_counts())
