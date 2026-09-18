import React from 'react';
import { HelpCircle, Layers } from 'lucide-react';

const factorTone = (status) => {
  if (status === 'CRITICAL') return 'text-red-700 border-red-200 bg-red-50';
  if (status === 'ELEVATED') return 'text-amber-700 border-amber-200 bg-amber-50';
  return 'text-emerald-700 border-emerald-200 bg-emerald-50';
};

const RiskExplainability = ({ reading }) => {
  const rainfall = reading?.rainfall ?? 0;
  const slope = reading?.slope ?? 0;
  const soilMoisture = reading?.soil_moisture ?? 0;
  const groundMovement = reading?.ground_movement ?? 0;

  const factors = [
    {
      name: 'Rainfall Intensity',
      value: `${rainfall} mm`,
      status: rainfall > 80 ? 'CRITICAL' : rainfall > 35 ? 'ELEVATED' : 'NORMAL',
      barColor: 'bg-blue-600',
      weightPercent: 40
    },
    {
      name: 'Slope Gradient',
      value: `${slope} deg`,
      status: slope > 40 ? 'CRITICAL' : slope > 25 ? 'ELEVATED' : 'NORMAL',
      barColor: 'bg-earth-600',
      weightPercent: 25
    },
    {
      name: 'Soil Saturation',
      value: `${soilMoisture}%`,
      status: soilMoisture > 75 ? 'CRITICAL' : soilMoisture > 45 ? 'ELEVATED' : 'NORMAL',
      barColor: 'bg-emerald-600',
      weightPercent: 20
    },
    {
      name: 'Ground Displacement',
      value: `${groundMovement} mm`,
      status: groundMovement > 5.0 ? 'CRITICAL' : groundMovement > 1.5 ? 'ELEVATED' : 'NORMAL',
      barColor: 'bg-orange-600',
      weightPercent: 15
    }
  ];

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-emerald-700" />
          <h2 className="text-sm font-semibold text-stone-950">AI Risk Factor Contribution</h2>
        </div>
        <span className="rounded border border-stone-200 bg-stone-50 px-2 py-0.5 font-mono text-[10px] text-stone-500">
          RF weights
        </span>
      </div>

      <div className="space-y-3">
        {factors.map((factor) => (
          <div key={factor.name} className="rounded-md border border-stone-200 bg-stone-50 p-3">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-stone-900">{factor.name}</p>
                <p className="mt-0.5 font-mono text-[11px] text-stone-500">Value: {factor.value}</p>
              </div>
              <span className={`rounded border px-2 py-0.5 font-mono text-[10px] font-semibold ${factorTone(factor.status)}`}>
                {factor.status}
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-stone-200">
              <div className={`h-full rounded-full ${factor.barColor}`} style={{ width: `${factor.weightPercent}%` }} />
            </div>
            <div className="mt-1 flex justify-between font-mono text-[10px] text-stone-500">
              <span>Importance weight</span>
              <span>{factor.weightPercent}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-2 border-t border-stone-200 pt-3 text-xs leading-relaxed text-stone-500">
        <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
        <span>
          Feature weights describe model influence for the current classifier. Safety rules can still escalate risk when field thresholds are exceeded.
        </span>
      </div>
    </section>
  );
};

export default RiskExplainability;
