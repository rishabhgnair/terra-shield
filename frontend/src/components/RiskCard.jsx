import React from 'react';
import { Cpu, ShieldAlert, TrendingUp } from 'lucide-react';
import { getRiskColor, normalizeRiskLevel } from '../utils/formatters';

const RiskCard = ({ riskLevel = 'LOW', probability = 0, onlineCount = 4, totalCount = 4 }) => {
  const level = normalizeRiskLevel(riskLevel, { risk_probability: probability });
  const colors = getRiskColor(level);
  const percent = Math.round(probability * 100);

  const cards = [
    {
      label: 'Current Risk',
      value: colors.label,
      subtext: 'AI + safety rules',
      icon: ShieldAlert,
      className: `${colors.bg} ${colors.border} ${colors.text}`
    },
    {
      label: 'Risk Probability',
      value: `${percent}%`,
      subtext: 'Model confidence',
      icon: TrendingUp,
      className: 'bg-blue-50 border-blue-100 text-blue-700'
    },
    {
      label: 'Sensor Fleet',
      value: `${onlineCount}/${totalCount}`,
      subtext: 'Online nodes',
      icon: Cpu,
      className: 'bg-emerald-50 border-emerald-100 text-emerald-700'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className={`flex items-center justify-between rounded-lg border p-4 shadow-sm ${card.className}`}>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">{card.label}</p>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-stone-950">{card.value}</p>
              <p className="mt-0.5 text-xs text-stone-500">{card.subtext}</p>
            </div>
            <Icon className="h-5 w-5" />
          </div>
        );
      })}
    </div>
  );
};

export default RiskCard;
