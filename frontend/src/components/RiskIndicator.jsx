import React from 'react';
import { Cpu, ShieldAlert, TrendingUp } from 'lucide-react';
import { getRiskColor, normalizeRiskLevel, riskLevels } from '../utils/formatters';

const activeStyles = {
  LOW: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  MODERATE: 'bg-amber-50 text-amber-800 border-amber-300',
  HIGH: 'bg-orange-50 text-orange-800 border-orange-300',
  CRITICAL: 'bg-red-50 text-red-800 border-red-300'
};

const RiskIndicator = ({ riskLevel = 'LOW', probability = 0, onlineCount = 4, totalCount = 4 }) => {
  const level = normalizeRiskLevel(riskLevel, { risk_probability: probability });
  const percentage = Math.round(probability * 100);
  const colors = getRiskColor(level);

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="grid grid-cols-1 gap-4 border-b border-stone-200 pb-4 md:grid-cols-3">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg border p-3 ${colors.pillBg}`}>
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Current Risk Level</div>
            <div className="mt-0.5 flex items-center gap-2">
              <span className={`text-2xl font-semibold tracking-tight ${colors.text}`}>{colors.label}</span>
              <span className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 md:border-l md:border-stone-200 md:pl-5">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-blue-700">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Risk Probability</div>
            <div className="mt-0.5 font-mono text-2xl font-semibold tabular-nums text-stone-950">{percentage}%</div>
          </div>
        </div>

        <div className="flex items-center gap-3 md:border-l md:border-stone-200 md:pl-5">
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-emerald-700">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Sensor Fleet</div>
            <div className="mt-0.5 text-sm font-semibold text-stone-800">
              <span className="font-mono text-emerald-700">{onlineCount}</span> / {totalCount} Online
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between gap-3 text-[11px] text-stone-500">
          <span className="font-medium">AI classification thresholds</span>
          <span className="font-mono">Random Forest + safety rules</span>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {riskLevels.map((risk) => {
            const isActive = level === risk.id;
            return (
              <div
                key={risk.id}
                className={`rounded-md border px-3 py-2 text-center transition-colors ${
                  isActive ? `${activeStyles[risk.id]} font-semibold` : 'border-stone-200 bg-stone-50 text-stone-500'
                }`}
              >
                <div className="text-xs uppercase tracking-wide">{risk.label}</div>
                <div className="mt-0.5 font-mono text-[10px]">{risk.range}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default RiskIndicator;
