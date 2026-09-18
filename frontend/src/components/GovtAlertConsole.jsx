import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertOctagon, Bell, BellRing, Check, ChevronRight, Clock,
  MapPin, Radio, Shield, Siren, Users, X, Zap
} from 'lucide-react';
import { fetchAlerts, acknowledgeAlert, dispatchAlert } from '../services/api';
import { getRiskColor } from '../utils/formatters';

const TEAM_ICONS = {
  NDRF: '🪖',
  Medical: '🏥',
  Police: '🚔',
  Revenue_Officer: '📋'
};

const TEAM_LABELS = {
  NDRF: 'NDRF Team',
  Medical: 'Medical Unit',
  Police: 'Police Force',
  Revenue_Officer: 'Revenue Officer'
};

const formatRelativeTime = (isoString) => {
  if (!isoString) return 'Unknown time';
  try {
    const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(isoString).toLocaleDateString();
  } catch {
    return isoString;
  }
};

const GovtAlertConsole = ({ sites = [], compact = false }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dispatchingId, setDispatchingId] = useState(null);
  const [filter, setFilter] = useState('active'); // 'active' | 'all'
  const pollRef = useRef(null);

  const loadAlerts = useCallback(async () => {
    try {
      const res = await fetchAlerts(50, filter === 'active');
      if (res.success) setAlerts(res.data || []);
    } catch {
      // Backend offline — show empty state gracefully
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadAlerts();
    pollRef.current = setInterval(loadAlerts, 15000);
    return () => clearInterval(pollRef.current);
  }, [loadAlerts]);

  const handleAcknowledge = async (alertId) => {
    setDispatchingId(alertId);
    try {
      await acknowledgeAlert(alertId);
      setAlerts((prev) => prev.map((a) => a.id === alertId ? { ...a, acknowledged: 1 } : a));
    } catch (err) {
      console.error('Acknowledge failed:', err);
    } finally {
      setDispatchingId(null);
    }
  };

  const handleManualDispatch = async (site) => {
    setDispatchingId(site.id);
    try {
      await dispatchAlert(site.id, site.name, site.risk, site.state, site.lat, site.lng);
      await loadAlerts();
    } catch (err) {
      console.error('Dispatch failed:', err);
    } finally {
      setDispatchingId(null);
    }
  };

  const activeCount = alerts.filter((a) => !a.acknowledged).length;
  const criticalSites = sites.filter((s) => ['HIGH', 'CRITICAL'].includes(s.risk));
  const displayAlerts = filter === 'active' ? alerts.filter((a) => !a.acknowledged) : alerts;

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-stone-200 bg-gradient-to-r from-red-50 to-orange-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`rounded-lg p-2 ${activeCount > 0 ? 'bg-red-100' : 'bg-stone-100'}`}>
            {activeCount > 0
              ? <BellRing className="h-4 w-4 text-red-700 animate-pulse" />
              : <Bell className="h-4 w-4 text-stone-500" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-900">Government Alert Console</p>
            <p className="text-[11px] text-stone-500">NDRF / Medical / Police dispatch</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-[11px] font-bold text-white animate-pulse">
              {activeCount}
            </span>
          )}
          <div className="flex rounded-md border border-stone-200 overflow-hidden text-[11px]">
            <button onClick={() => setFilter('active')} className={`px-2.5 py-1 font-medium transition ${filter === 'active' ? 'bg-stone-800 text-white' : 'bg-white text-stone-600 hover:bg-stone-50'}`}>Active</button>
            <button onClick={() => setFilter('all')} className={`px-2.5 py-1 font-medium transition ${filter === 'all' ? 'bg-stone-800 text-white' : 'bg-white text-stone-600 hover:bg-stone-50'}`}>All</button>
          </div>
        </div>
      </div>

      {/* Manual Dispatch for HIGH/CRITICAL sites */}
      {criticalSites.length > 0 && !compact && (
        <div className="border-b border-stone-100 bg-orange-50 px-4 py-2.5">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-orange-700">
            Sites requiring immediate response
          </p>
          <div className="flex flex-wrap gap-2">
            {criticalSites.map((site) => {
              const colors = getRiskColor(site.risk);
              return (
                <button
                  key={site.id}
                  type="button"
                  disabled={dispatchingId === site.id}
                  onClick={() => handleManualDispatch(site)}
                  className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-semibold transition ${
                    site.risk === 'CRITICAL'
                      ? 'border-red-300 bg-red-100 text-red-800 hover:bg-red-200'
                      : 'border-orange-300 bg-orange-100 text-orange-800 hover:bg-orange-200'
                  }`}
                >
                  <Siren className="h-3 w-3" />
                  Dispatch to {site.name}
                  <span className={`rounded px-1 py-0.5 text-[9px] font-bold ${colors.pillBg}`}>{site.risk}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Alert list */}
      <div className={`overflow-y-auto ${compact ? 'max-h-64' : 'max-h-96'}`}>
        {loading ? (
          <div className="flex items-center justify-center py-8 text-xs text-stone-500">
            <Radio className="mr-2 h-4 w-4 animate-pulse text-emerald-600" />
            Connecting to alert server...
          </div>
        ) : displayAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Shield className="mb-2 h-8 w-8 text-emerald-300" />
            <p className="text-sm font-medium text-stone-600">No {filter === 'active' ? 'active ' : ''}alerts</p>
            <p className="text-xs text-stone-400">All teams on standby</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {displayAlerts.map((alert) => {
              const colors = getRiskColor(alert.risk_level);
              const isAcked = Boolean(alert.acknowledged);
              return (
                <div
                  key={alert.id}
                  className={`px-4 py-3 transition-colors ${isAcked ? 'bg-stone-50 opacity-70' : alert.risk_level === 'CRITICAL' ? 'bg-red-50' : 'bg-white'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 shrink-0 rounded-md p-1.5 ${isAcked ? 'bg-stone-100' : colors.bg}`}>
                      <span className="text-base">{TEAM_ICONS[alert.team_type] || '🚨'}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-stone-900">
                          {TEAM_LABELS[alert.team_type] || alert.team_type}
                        </span>
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${colors.pillBg}`}>
                          {alert.risk_level}
                        </span>
                        {isAcked && (
                          <span className="flex items-center gap-0.5 text-[9px] text-emerald-700 font-semibold">
                            <Check className="h-3 w-3" /> Acknowledged
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-stone-600">
                        <MapPin className="h-3 w-3 shrink-0 text-stone-400" />
                        <span className="truncate">{alert.site_name}, {alert.state}</span>
                      </div>
                      {alert.message && (
                        <p className="mt-1 text-[10px] text-stone-600 leading-relaxed line-clamp-2">{alert.message}</p>
                      )}
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-stone-400">
                        <Clock className="h-3 w-3" />
                        <span>Dispatched {formatRelativeTime(alert.dispatched_at)}</span>
                        <span className="ml-auto font-mono">#{alert.id}</span>
                      </div>
                    </div>
                    {!isAcked && (
                      <button
                        type="button"
                        disabled={dispatchingId === alert.id}
                        onClick={() => handleAcknowledge(alert.id)}
                        className="shrink-0 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-stone-100 bg-stone-50 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] text-stone-500">
          <Zap className="h-3 w-3 text-emerald-600" />
          <span>Auto-refreshes every 15 seconds</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-stone-500">
          <Users className="h-3 w-3" />
          <span>{alerts.length} total dispatches</span>
        </div>
      </div>
    </div>
  );
};

export default GovtAlertConsole;
