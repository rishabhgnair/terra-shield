export const formatTimestamp = (isoString) => {
  if (!isoString) return 'N/A';
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  } catch (e) {
    return isoString;
  }
};

export const formatFullDate = (isoString) => {
  if (!isoString) return 'N/A';
  try {
    const date = new Date(isoString);
    return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  } catch (e) {
    return isoString;
  }
};

export const normalizeRiskLevel = (riskLevel, prediction = null) => {
  const level = riskLevel?.toUpperCase?.() || 'LOW';
  const probability = prediction?.probability ?? prediction?.risk_probability ?? 0;

  if (level === 'CRITICAL') return 'CRITICAL';
  if (level === 'HIGH' && (prediction?.safety_override || probability >= 0.85)) return 'CRITICAL';
  if (['LOW', 'MODERATE', 'HIGH'].includes(level)) return level;
  return 'LOW';
};

export const riskLevels = [
  { id: 'LOW', label: 'Low', range: '< 35%', hex: '#2f855a' },
  { id: 'MODERATE', label: 'Moderate', range: '35-70%', hex: '#d69e2e' },
  { id: 'HIGH', label: 'High', range: '70-85%', hex: '#dd6b20' },
  { id: 'CRITICAL', label: 'Critical', range: '85%+', hex: '#c53030' }
];

export const getRiskColor = (riskLevel, prediction = null) => {
  switch (normalizeRiskLevel(riskLevel, prediction)) {
    case 'CRITICAL':
      return {
        label: 'Critical',
        hex: '#c53030',
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        badge: 'bg-red-700 text-white font-semibold',
        pillBg: 'bg-red-50 text-red-700 border border-red-200',
        dot: 'bg-red-600',
        ring: 'ring-red-200'
      };
    case 'HIGH':
      return {
        label: 'High',
        hex: '#dd6b20',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-700',
        badge: 'bg-orange-600 text-white font-semibold',
        pillBg: 'bg-orange-50 text-orange-700 border border-orange-200',
        dot: 'bg-orange-500',
        ring: 'ring-orange-200'
      };
    case 'MODERATE':
      return {
        label: 'Moderate',
        hex: '#d69e2e',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        badge: 'bg-amber-500 text-slate-950 font-semibold',
        pillBg: 'bg-amber-50 text-amber-700 border border-amber-200',
        dot: 'bg-amber-500',
        ring: 'ring-amber-200'
      };
    case 'LOW':
    default:
      return {
        label: 'Low',
        hex: '#2f855a',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        badge: 'bg-emerald-600 text-white font-semibold',
        pillBg: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        dot: 'bg-emerald-500',
        ring: 'ring-emerald-200'
      };
  }
};
