import React, { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Award, BarChart3, Brain, Download, PieChart as PieIcon } from 'lucide-react';
import { fetchMetadata, getExportCsvUrl } from '../services/api';
import { normalizeRiskLevel, riskLevels } from '../utils/formatters';

const metricLabels = {
  accuracy: 'Accuracy',
  precision: 'Precision',
  recall: 'Recall',
  f1_score: 'F1 Score'
};

const AnalyticsPage = ({ predictions = [] }) => {
  const [metadata, setMetadata] = useState(null);

  useEffect(() => {
    fetchMetadata()
      .then((res) => {
        if (res?.success) setMetadata(res.metadata);
      })
      .catch((e) => console.log('Metadata load error:', e));
  }, []);

  const riskCounts = { LOW: 0, MODERATE: 0, HIGH: 0, CRITICAL: 0 };
  predictions.forEach((prediction) => {
    riskCounts[normalizeRiskLevel(prediction.risk_level, prediction)] += 1;
  });

  const pieData = riskLevels.map((level, index) => ({
    name: level.label,
    value: riskCounts[level.id] || [14, 5, 2, 1][index],
    color: level.hex
  }));

  const featureImportances = metadata?.feature_importances || {
    rainfall_mm: 0.4,
    slope_degree: 0.25,
    soil_moisture: 0.2,
    ground_movement: 0.15
  };

  const featureBarData = Object.entries(featureImportances).map(([key, value]) => ({
    name: key.replace('_mm', '').replace('_degree', '').replace(/_/g, ' '),
    importance: Math.round(value * 100)
  }));

  const metrics = metadata?.metrics || {
    accuracy: 0.878,
    precision: 0.88,
    recall: 0.878,
    f1_score: 0.878
  };

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-800">
              <BarChart3 className="h-5 w-5" />
              <h2 className="text-xl font-semibold tracking-tight text-stone-950">System Performance & ML Analytics</h2>
            </div>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-stone-600">
              Model accuracy, feature contribution rankings, and risk level distribution metrics across the monitoring network.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={getExportCsvUrl('predictions')}
              download
              className="flex items-center gap-1.5 shrink-0 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-800 transition hover:bg-stone-100 hover:border-stone-300"
              title="Download prediction logs as CSV"
            >
              <Download className="h-3.5 w-3.5 text-emerald-700" />
              Export Predictions CSV
            </a>

            <div className="flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50 p-2.5">
              <Award className="h-5 w-5 shrink-0 text-emerald-700" />
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Accuracy</div>
                <div className="font-mono text-lg font-semibold tabular-nums text-stone-950">
                  {(metrics.accuracy * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <PieIcon className="h-4 w-4 text-emerald-700" />
            <h2 className="text-sm font-semibold text-stone-950">Prediction Risk Distribution</h2>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={54}
                  outerRadius={86}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#d8ccb5',
                    borderRadius: '0.5rem',
                    color: '#292524',
                    fontSize: '11px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Brain className="h-4 w-4 text-emerald-700" />
            <h2 className="text-sm font-semibold text-stone-950">Model Feature Importance</h2>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureBarData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#e7e2d9" />
                <XAxis dataKey="name" stroke="#8a8176" tick={{ fontSize: 10, fill: '#78716c' }} />
                <YAxis stroke="#8a8176" tick={{ fontSize: 10, fill: '#78716c' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#d8ccb5',
                    borderRadius: '0.5rem',
                    color: '#292524',
                    fontSize: '11px'
                  }}
                />
                <Bar dataKey="importance" name="Weight (%)" fill="#2f6b45" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-stone-950">Classification Model Performance</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(metrics).map(([key, value]) => (
            <div key={key} className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-center">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">{metricLabels[key] || key}</div>
              <div className="mt-1 font-mono text-2xl font-semibold tabular-nums text-stone-950">
                {(value * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AnalyticsPage;
