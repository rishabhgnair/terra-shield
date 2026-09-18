import React, { useEffect, useState, useCallback } from 'react';
import {
  AlertTriangle, Clock, CloudRain, TrendingUp, Users, ChevronRight,
  MapPin, BarChart3, Brain, Skull, RefreshCw, Filter
} from 'lucide-react';
import { fetchIncidentHistory } from '../services/api';

const SEVERITY_CONFIG = {
  CRITICAL: { color: '#c53030', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', badge: 'bg-red-100 text-red-800 border-red-200' },
  HIGH:     { color: '#dd6b20', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', badge: 'bg-orange-100 text-orange-800 border-orange-200' },
  MODERATE: { color: '#d69e2e', bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-800',  badge: 'bg-amber-100 text-amber-800 border-amber-200' },
  LOW:      { color: '#2f855a', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
};

const IncidentHistoryPanel = ({ lat = null, lng = null, siteName = null, compact = false }) => {
  const [incidents, setIncidents] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [expanded, setExpanded] = useState(null);

  const loadIncidents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchIncidentHistory(lat, lng, 150, 20);
      if (res.success) {
        setIncidents(res.data || []);
        setAiAnalysis(res.ai_analysis || null);
      } else {
        setError('Failed to load incident history');
      }
    } catch (e) {
      setError('Backend unavailable — incident data offline');
    } finally {
      setLoading(false);
    }
  }, [lat, lng]);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  const filtered = filterSeverity === 'ALL'
    ? incidents
    : incidents.filter((i) => i.severity === filterSeverity);

  const verdictColor =
    aiAnalysis?.risk_verdict?.includes('HIGH') ? 'text-red-700' :
    aiAnalysis?.risk_verdict?.includes('MODERATE') ? 'text-amber-700' :
    'text-emerald-700';

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-stone-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-amber-100 p-2">
            <BarChart3 className="h-4 w-4 text-amber-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-900">Incident History</p>
            <p className="text-[11px] text-stone-500">
              {siteName ? `Near ${siteName}` : 'NE India — 2021–2024'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadIncidents} className="rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="rounded-md border border-stone-200 bg-white px-2 py-1 text-[11px] text-stone-700 outline-none"
          >
            <option value="ALL">All Severity</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MODERATE">Moderate</option>
          </select>
        </div>
      </div>

      {/* AI Analysis Card */}
      {aiAnalysis && !compact && (
        <div className="border-b border-stone-200 bg-slate-900 px-4 py-3">
          <div className="flex items-start gap-2.5">
            <div className="rounded-lg bg-emerald-900 p-1.5 shrink-0">
              <Brain className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-400">AI Risk Assessment</p>
                <span className={`text-xs font-bold ${verdictColor}`}>{aiAnalysis.risk_verdict}</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">{aiAnalysis.narrative}</p>
              <div className="mt-2 flex items-center gap-4 text-[10px] text-slate-400">
                <span>📊 {aiAnalysis.total_incidents} events</span>
                <span>🔴 {aiAnalysis.critical_count} critical</span>
                <span>💀 {aiAnalysis.total_casualties} casualties</span>
                <span>🌧 avg {aiAnalysis.avg_rainfall_mm}mm</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats row */}
      {incidents.length > 0 && (
        <div className="grid grid-cols-4 divide-x divide-stone-100 border-b border-stone-100 bg-stone-50">
          {[
            { label: 'Total Events', value: incidents.length, icon: AlertTriangle, color: 'text-amber-600' },
            { label: 'Critical', value: incidents.filter(i => i.severity === 'CRITICAL').length, icon: Skull, color: 'text-red-600' },
            { label: 'Casualties', value: incidents.reduce((s, i) => s + (i.casualties || 0), 0), icon: Users, color: 'text-red-700' },
            { label: 'Max Rainfall', value: `${Math.max(...incidents.map(i => i.rainfall_mm || 0), 0)}mm`, icon: CloudRain, color: 'text-blue-600' }
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="px-3 py-2 text-center">
              <Icon className={`mx-auto mb-0.5 h-3.5 w-3.5 ${color}`} />
              <p className="text-sm font-bold text-stone-900">{value}</p>
              <p className="text-[10px] text-stone-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Incident list */}
      <div className={`overflow-y-auto divide-y divide-stone-100 ${compact ? 'max-h-56' : 'max-h-80'}`}>
        {loading ? (
          <div className="flex items-center justify-center py-8 text-xs text-stone-500">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin text-amber-500" />
            Loading historical incidents...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-6 text-xs text-stone-500 px-4 text-center">
            <div>
              <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-amber-400" />
              <p>{error}</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-6 text-xs text-stone-500 px-4 text-center">
            No incidents found for selected filter
          </div>
        ) : (
          filtered.map((inc) => {
            const cfg = SEVERITY_CONFIG[inc.severity] || SEVERITY_CONFIG.LOW;
            const isExpanded = expanded === inc.id;
            return (
              <div key={inc.id} className={`${cfg.bg} cursor-pointer transition-colors hover:brightness-95`}
                onClick={() => setExpanded(isExpanded ? null : inc.id)}>
                <div className="flex items-start gap-3 px-4 py-3">
                  {/* Severity dot */}
                  <div className="mt-0.5 shrink-0 flex flex-col items-center gap-1">
                    <div className="h-3 w-3 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: cfg.color }} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-stone-900 truncate">{inc.location_name}</p>
                      <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase ${cfg.badge}`}>
                        {inc.severity}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-stone-500">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span>{inc.state}</span>
                      <span className="mx-1">·</span>
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>{inc.event_date}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[11px]">
                      <span className="flex items-center gap-1 text-blue-700">
                        <CloudRain className="h-3 w-3" />{inc.rainfall_mm}mm
                      </span>
                      {inc.casualties > 0 && (
                        <span className="flex items-center gap-1 text-red-700">
                          <Users className="h-3 w-3" />{inc.casualties} casualties
                        </span>
                      )}
                      <span className="text-stone-500">{inc.landslide_type}</span>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="mt-2 rounded-md border border-stone-200 bg-white p-2 text-[11px] text-stone-700 space-y-1">
                        <p><strong>Cause:</strong> {inc.trigger_cause}</p>
                        <p><strong>Displaced:</strong> {inc.displaced} people</p>
                        <p><strong>Injured:</strong> {inc.injured}</p>
                        <p className="text-stone-500 italic">{inc.notes}</p>
                      </div>
                    )}
                  </div>

                  <ChevronRight className={`h-4 w-4 shrink-0 text-stone-400 mt-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-stone-100 bg-stone-50 px-4 py-2 text-[10px] text-stone-400 flex items-center justify-between">
        <span>Data: NDMA / GSI / State Disaster Reports 2021–2024</span>
        {aiAnalysis && (
          <span className="font-semibold text-emerald-700">
            Recurrence: {aiAnalysis.recurrence_per_year}/yr
          </span>
        )}
      </div>
    </div>
  );
};

export default IncidentHistoryPanel;
