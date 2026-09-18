import React from 'react';
import { AlertCircle, CheckCircle2, Mountain, Radio, RefreshCw, ShieldCheck } from 'lucide-react';
import { formatTimestamp } from '../utils/formatters';

const Header = ({ isBackendOnline, lastUpdated, demoScenario, onRefresh }) => {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur md:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight text-stone-950">Terra Shield</h1>
              <span className="rounded border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-600">
                Operations Console
              </span>
            </div>
            <p className="mt-0.5 text-xs text-stone-600">
              AI-Powered Landslide Risk Monitoring & Early Warning System
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 rounded-md border border-earth-100 bg-earth-50 px-2.5 py-1.5 font-medium text-earth-700">
            <Mountain className="h-3.5 w-3.5" />
            <span>North Eastern India</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1.5 font-medium text-blue-700">
            <Radio className="h-3.5 w-3.5" />
            <span>
              Mode <strong className="font-mono uppercase">{demoScenario}</strong>
            </span>
          </div>

          <div
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-medium ${
              isBackendOnline
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {isBackendOnline ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
            <span>API {isBackendOnline ? 'Online' : 'Offline'}</span>
          </div>

          <div className="flex items-center gap-2 rounded-md border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-stone-600">
            <span className="font-mono text-[11px]">Sync {formatTimestamp(lastUpdated)}</span>
            <button
              type="button"
              onClick={onRefresh}
              title="Refresh telemetry"
              className="rounded p-0.5 text-stone-500 transition-colors hover:text-emerald-700 active:rotate-180"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
