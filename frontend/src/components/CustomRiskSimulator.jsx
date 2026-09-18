import React, { useState } from 'react';
import { Activity, AlertTriangle, ArrowRight, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import { predictRisk } from '../services/api';
import { getRiskColor, normalizeRiskLevel } from '../utils/formatters';

const presets = {
  normal: {
    label: 'Normal Day',
    data: { rainfall: 15.0, slope: 22.0, soil_moisture: 35.0, ground_movement: 0.2, temperature: 24.0 }
  },
  warning: {
    label: 'Monsoon Rain',
    data: { rainfall: 85.0, slope: 38.0, soil_moisture: 72.0, ground_movement: 2.1, temperature: 19.0 }
  },
  hazard: {
    label: 'Landslide Hazard',
    data: { rainfall: 165.0, slope: 44.0, soil_moisture: 88.0, ground_movement: 7.5, temperature: 16.0 }
  }
};

const CustomRiskSimulator = () => {
  const [inputs, setInputs] = useState(presets.warning.data);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (field, value) => {
    setInputs((prev) => ({ ...prev, [field]: Number(value) }));
  };

  const applyPreset = (presetKey) => {
    const selected = presets[presetKey].data;
    setInputs(selected);
    runPrediction(selected);
  };

  const runPrediction = async (customPayload = inputs) => {
    setLoading(true);
    setError(null);
    try {
      const res = await predictRisk(customPayload);
      if (res.success) {
        setResult(res);
      } else {
        setError(res.error || 'Prediction failed');
      }
    } catch (err) {
      setError(err.message || 'API request error');
    } finally {
      setLoading(false);
    }
  };

  const riskLevel = result ? normalizeRiskLevel(result.risk_level, result) : null;
  const colors = riskLevel ? getRiskColor(riskLevel) : null;

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-stone-200 pb-3">
        <div>
          <div className="flex items-center gap-2 text-emerald-800">
            <Sparkles className="h-5 w-5" />
            <h2 className="text-base font-semibold tracking-tight text-stone-950">Interactive AI Risk Engine Simulator</h2>
          </div>
          <p className="mt-1 text-xs text-stone-600">
            Test custom slope & environmental parameters live against Terra Shield's hybrid Random Forest & Safety Rules.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[11px] font-semibold text-stone-500">Presets:</span>
          {Object.entries(presets).map(([key, preset]) => (
            <button
              key={key}
              type="button"
              onClick={() => applyPreset(key)}
              className="rounded-md border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-700 hover:border-stone-300 hover:bg-stone-100 transition"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Sliders Form */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-stone-800">Rainfall Rate (mm/h)</span>
              <span className="font-mono text-emerald-800 font-bold">{inputs.rainfall} mm</span>
            </div>
            <input
              type="range"
              min="0"
              max="250"
              step="1"
              value={inputs.rainfall}
              onChange={(e) => handleInputChange('rainfall', e.target.value)}
              className="w-full accent-emerald-700"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-stone-800">Slope Angle (degrees)</span>
              <span className="font-mono text-emerald-800 font-bold">{inputs.slope}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="75"
              step="1"
              value={inputs.slope}
              onChange={(e) => handleInputChange('slope', e.target.value)}
              className="w-full accent-emerald-700"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-stone-800">Soil Moisture Content (%)</span>
              <span className="font-mono text-emerald-800 font-bold">{inputs.soil_moisture}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={inputs.soil_moisture}
              onChange={(e) => handleInputChange('soil_moisture', e.target.value)}
              className="w-full accent-emerald-700"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-stone-800">Ground Displacement (mm)</span>
              <span className="font-mono text-emerald-800 font-bold">{inputs.ground_movement} mm</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="0.1"
              value={inputs.ground_movement}
              onChange={(e) => handleInputChange('ground_movement', e.target.value)}
              className="w-full accent-emerald-700"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-stone-800">Temperature (°C)</span>
              <span className="font-mono text-emerald-800 font-bold">{inputs.temperature}°C</span>
            </div>
            <input
              type="range"
              min="-10"
              max="45"
              step="1"
              value={inputs.temperature}
              onChange={(e) => handleInputChange('temperature', e.target.value)}
              className="w-full accent-emerald-700"
            />
          </div>

          <button
            type="button"
            onClick={() => runPrediction()}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-md bg-emerald-800 px-4 py-2.5 text-xs font-semibold text-white shadow hover:bg-emerald-900 transition disabled:opacity-50"
          >
            {loading ? 'Evaluating AI Model...' : 'Assess Landslide Risk Now'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Prediction Results Panel */}
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 flex flex-col justify-between">
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <AlertTriangle className="h-4 w-4 mb-1" />
              {error}
            </div>
          ) : result ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Predicted Risk Output</span>
                <span className={`rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${colors?.pillBg}`}>
                  {colors?.label} RISK
                </span>
              </div>

              <div className="rounded-md border border-stone-200 bg-white p-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-stone-600">Risk Score Probability</span>
                  <span className="font-mono text-lg font-bold text-stone-900">
                    {(result.risk_probability * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-stone-200 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(result.risk_probability * 100, 100)}%`, backgroundColor: colors?.hex }}
                  />
                </div>
              </div>

              {result.safety_override && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <ShieldAlert className="h-4 w-4 text-amber-700" />
                    Physical Safety Rule Override Escalation
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-amber-800">{result.safety_reason}</p>
                </div>
              )}

              <div className="rounded-md border border-stone-200 bg-white p-3">
                <p className="text-[11px] font-semibold text-stone-700 mb-2">Class Probabilities (ML Random Forest)</p>
                <div className="space-y-1.5 text-xs">
                  {Object.entries(result.class_probabilities || {}).map(([cName, cProb]) => (
                    <div key={cName} className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-stone-600">{cName}</span>
                      <span className="font-semibold text-stone-900">{(cProb * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[11px] leading-relaxed text-stone-600 italic">
                "{result.message}"
              </p>
            </div>
          ) : (
            <div className="my-auto py-10 text-center text-xs text-stone-500">
              <Activity className="mx-auto h-8 w-8 mb-2 text-stone-400" />
              Adjust sliders or pick a preset above to run real-time risk assessment.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CustomRiskSimulator;
