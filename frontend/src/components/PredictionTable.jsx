import React from 'react';
import { formatTimestamp, getRiskColor, normalizeRiskLevel } from '../utils/formatters';

const PredictionTable = ({ predictions = [] }) => {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-stone-950">Risk Prediction Log</h2>
          <p className="mt-0.5 text-xs text-stone-500">Automated ML classifications from recent sensor transmissions</p>
        </div>
        <span className="rounded border border-stone-200 bg-stone-50 px-2.5 py-1 font-mono text-xs text-stone-600">
          {predictions.length} rows
        </span>
      </div>

      <div className="overflow-x-auto rounded-md border border-stone-200">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 text-[10px] font-semibold uppercase tracking-wide text-stone-500">
              <th className="px-3 py-2.5">Timestamp</th>
              <th className="px-3 py-2.5">Device Node</th>
              <th className="px-3 py-2.5">Rainfall</th>
              <th className="px-3 py-2.5">Slope</th>
              <th className="px-3 py-2.5">Displacement</th>
              <th className="px-3 py-2.5">Risk Level</th>
              <th className="px-3 py-2.5">Probability</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {predictions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-sm text-stone-500">
                  No prediction entries recorded yet.
                </td>
              </tr>
            ) : (
              predictions.slice(0, 10).map((prediction, index) => {
                const level = normalizeRiskLevel(prediction.risk_level, prediction);
                const colors = getRiskColor(level);
                const probability = Math.round((prediction.probability || prediction.risk_probability || 0) * 100);
                return (
                  <tr key={prediction.id || index} className="bg-white transition-colors hover:bg-stone-50">
                    <td className="px-3 py-2.5 font-mono text-[11px] text-stone-600">
                      {formatTimestamp(prediction.timestamp)}
                    </td>
                    <td className="px-3 py-2.5 text-stone-700">{prediction.device_id || 'ESP32-001'}</td>
                    <td className="px-3 py-2.5 font-mono font-semibold text-blue-700">
                      {prediction.rainfall != null ? `${prediction.rainfall} mm` : 'N/A'}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-semibold text-earth-700">
                      {prediction.slope != null ? `${prediction.slope} deg` : 'N/A'}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-stone-700">
                      {prediction.ground_movement != null ? `${prediction.ground_movement} mm` : 'N/A'}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${colors.pillBg}`}>
                        {colors.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono font-semibold tabular-nums text-stone-900">{probability}%</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default PredictionTable;
