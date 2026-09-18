import React, { useState } from 'react';
import { AlertOctagon, AlertTriangle, Loader2, Play, ShieldCheck, Zap } from 'lucide-react';
import { setDemoScenario } from '../services/api';

const scenarios = [
  {
    id: 'NORMAL',
    label: 'Normal',
    riskExpected: 'Low risk',
    className: 'hover:border-emerald-300 hover:bg-emerald-50',
    activeClassName: 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200',
    icon: ShieldCheck
  },
  {
    id: 'WARNING',
    label: 'Warning',
    riskExpected: 'Moderate risk',
    className: 'hover:border-amber-300 hover:bg-amber-50',
    activeClassName: 'border-amber-500 bg-amber-50 text-amber-800 ring-1 ring-amber-200',
    icon: AlertTriangle
  },
  {
    id: 'CRITICAL',
    label: 'Critical',
    riskExpected: 'High or critical',
    className: 'hover:border-red-300 hover:bg-red-50',
    activeClassName: 'border-red-500 bg-red-50 text-red-800 ring-1 ring-red-200',
    icon: AlertOctagon
  },
  {
    id: 'AUTO',
    label: 'Auto Cycle',
    riskExpected: 'Dynamic',
    className: 'hover:border-blue-300 hover:bg-blue-50',
    activeClassName: 'border-blue-500 bg-blue-50 text-blue-800 ring-1 ring-blue-200',
    icon: Play
  },
  {
    id: 'FAULT',
    label: 'Fault Test',
    riskExpected: 'Validation reject',
    className: 'hover:border-stone-300 hover:bg-stone-50',
    activeClassName: 'border-stone-500 bg-stone-100 text-stone-800 ring-1 ring-stone-200',
    icon: Zap
  }
];

const DemoControls = ({ currentScenario = 'AUTO', onScenarioChange }) => {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  const handleTrigger = async (mode) => {
    setUpdating(true);
    setError(null);
    try {
      await setDemoScenario(mode);
      if (onScenarioChange) onScenarioChange(mode);
    } catch (err) {
      setError('Unable to update telemetry mode. Confirm the backend API is online.');
      console.error('Failed to trigger demo scenario:', err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-emerald-700" />
          <h2 className="text-sm font-semibold text-stone-950">Telemetry Scenario Controls</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-stone-600">
          {updating && <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-700" />}
          <span>Active mode</span>
          <span className="rounded border border-stone-200 bg-stone-50 px-2 py-0.5 font-mono font-semibold uppercase text-stone-800">
            {currentScenario}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {scenarios.map((scenario) => {
          const Icon = scenario.icon;
          const isActive = currentScenario?.toUpperCase() === scenario.id;
          return (
            <button
              key={scenario.id}
              type="button"
              disabled={updating}
              onClick={() => handleTrigger(scenario.id)}
              className={`flex items-center gap-2.5 rounded-md border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                isActive
                  ? scenario.activeClassName
                  : `border-stone-200 bg-stone-50 text-stone-700 ${scenario.className}`
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold leading-none">{scenario.label}</div>
                <div className="mt-1 truncate font-mono text-[10px] leading-none text-stone-500">{scenario.riskExpected}</div>
              </div>
            </button>
          );
        })}
      </div>

      {error && <p className="mt-3 text-xs text-red-700">{error}</p>}
    </section>
  );
};

export default DemoControls;
