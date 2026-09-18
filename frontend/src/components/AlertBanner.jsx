import React from 'react';
import { AlertOctagon, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { normalizeRiskLevel } from '../utils/formatters';

const alertConfig = {
  CRITICAL: {
    icon: AlertOctagon,
    title: 'Critical landslide warning active',
    body: 'Trigger conditions indicate immediate slope instability risk. Escalate field verification and emergency readiness.',
    className: 'border-red-300 bg-red-50 text-red-900',
    iconClass: 'bg-red-100 text-red-700'
  },
  HIGH: {
    icon: ShieldAlert,
    title: 'High landslide risk detected',
    body: 'Environmental conditions are elevated. Increase monitoring cadence and prepare field response actions.',
    className: 'border-orange-300 bg-orange-50 text-orange-900',
    iconClass: 'bg-orange-100 text-orange-700'
  },
  MODERATE: {
    icon: AlertTriangle,
    title: 'Moderate risk conditions',
    body: 'Rainfall, soil moisture, or displacement indicators are trending upward. Continue close monitoring.',
    className: 'border-amber-300 bg-amber-50 text-amber-900',
    iconClass: 'bg-amber-100 text-amber-700'
  },
  LOW: {
    icon: CheckCircle2,
    title: 'Conditions indicate low estimated risk',
    body: 'Current precipitation, slope gradient, and soil saturation remain within baseline operating bounds.',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    iconClass: 'bg-emerald-100 text-emerald-700'
  }
};

const AlertBanner = ({ riskLevel, message, safetyOverride, safetyReason }) => {
  const level = normalizeRiskLevel(riskLevel, { safety_override: safetyOverride });
  const config = alertConfig[level] || alertConfig.LOW;
  const Icon = config.icon;

  return (
    <div className={`rounded-lg border-l-4 border-y border-r p-4 shadow-sm ${config.className}`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 rounded-md p-2 ${config.iconClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide">{config.title}</h3>
            {safetyOverride && (
              <span className="rounded border border-red-200 bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700">
                Safety Override
              </span>
            )}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-stone-700">{message || config.body}</p>
          {safetyReason && (
            <p className="mt-1 font-mono text-[11px] text-red-700">Rule trigger: {safetyReason}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertBanner;
