import React, { useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { formatTimestamp } from '../utils/formatters';

const tabs = [
  { id: 'all', label: 'All' },
  { id: 'rainfall', label: 'Rainfall' },
  { id: 'soil_moisture', label: 'Soil' },
  { id: 'ground_movement', label: 'Movement' }
];

const SensorChart = ({ readings = [] }) => {
  const [selectedParam, setSelectedParam] = useState('all');

  const chartData = [...readings].reverse().map((reading) => ({
    time: formatTimestamp(reading.timestamp),
    rainfall: reading.rainfall,
    soil_moisture: reading.soil_moisture,
    ground_movement: reading.ground_movement,
    slope: reading.slope,
    temperature: reading.temperature
  }));

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-stone-950">Environmental Telemetry Trend</h2>
          <p className="mt-0.5 text-xs text-stone-500">Continuous field readings from active monitoring stations</p>
        </div>

        <div className="flex items-center gap-1 rounded-md border border-stone-200 bg-stone-50 p-1 text-xs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedParam(tab.id)}
              className={`rounded px-2.5 py-1 font-medium transition-colors ${
                selectedParam === tab.id ? 'bg-white text-emerald-800 shadow-sm' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 w-full">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-md border border-dashed border-stone-200 bg-stone-50 text-xs text-stone-500">
            Awaiting live telemetry stream
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#e7e2d9" />
              <XAxis dataKey="time" stroke="#8a8176" tick={{ fontSize: 10, fill: '#78716c' }} />
              <YAxis stroke="#8a8176" tick={{ fontSize: 10, fill: '#78716c' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#d8ccb5',
                  borderRadius: '0.5rem',
                  color: '#292524',
                  fontSize: '11px',
                  boxShadow: '0 12px 24px rgba(41, 37, 36, 0.08)'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />

              {(selectedParam === 'all' || selectedParam === 'rainfall') && (
                <Line
                  type="monotone"
                  dataKey="rainfall"
                  name="Rainfall (mm)"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                />
              )}
              {(selectedParam === 'all' || selectedParam === 'soil_moisture') && (
                <Line
                  type="monotone"
                  dataKey="soil_moisture"
                  name="Soil Moisture (%)"
                  stroke="#2f855a"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
              )}
              {(selectedParam === 'all' || selectedParam === 'ground_movement') && (
                <Line
                  type="monotone"
                  dataKey="ground_movement"
                  name="Displacement (mm)"
                  stroke="#dd6b20"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
};

export default SensorChart;
