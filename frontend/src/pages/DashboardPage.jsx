import React from 'react';
import { AlertCircle, Download, Loader2 } from 'lucide-react';
import AlertBanner from '../components/AlertBanner';
import DemoControls from '../components/DemoControls';
import RiskIndicator from '../components/RiskIndicator';
import CustomRiskSimulator from '../components/CustomRiskSimulator';
import SensorCard from '../components/SensorCard';
import SensorChart from '../components/SensorChart';
import PredictionTable from '../components/PredictionTable';
import RiskExplainability from '../components/RiskExplainability';
import { normalizeRiskLevel } from '../utils/formatters';
import { getExportCsvUrl } from '../services/api';

const DashboardPage = ({
  latestReading,
  latestPrediction,
  readings,
  predictions,
  devices,
  demoScenario,
  loading,
  error
}) => {
  const currentRisk = normalizeRiskLevel(latestPrediction?.risk_level || 'LOW', latestPrediction);
  const probability = latestPrediction?.probability || latestPrediction?.risk_probability || 0.05;
  const safetyOverride = Boolean(latestPrediction?.safety_override);
  const safetyReason = latestPrediction?.safety_reason;

  const activeSensorCount = devices.filter((d) => d.status === 'Online').length || 4;
  const totalSensorCount = devices.length || 4;

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Live Operations Overview</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-stone-950">
              Terra Shield risk intelligence dashboard
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-stone-600">
              Sensor telemetry, AI classification, warning state, and historical inference data for field monitoring teams.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={getExportCsvUrl('readings')}
              download
              className="flex items-center gap-1.5 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-800 transition hover:bg-stone-100 hover:border-stone-300"
              title="Download raw sensor logs as CSV"
            >
              <Download className="h-3.5 w-3.5 text-emerald-700" />
              Export CSV Logs
            </a>

            {loading && (
              <div className="flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Syncing
              </div>
            )}
            {!loading && error && (
              <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                <AlertCircle className="h-3.5 w-3.5" />
                Offline
              </div>
            )}
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      )}

      <AlertBanner
        riskLevel={currentRisk}
        message={latestPrediction?.message}
        safetyOverride={safetyOverride}
        safetyReason={safetyReason}
      />

      <DemoControls currentScenario={demoScenario} />

      <RiskIndicator
        riskLevel={currentRisk}
        probability={probability}
        onlineCount={activeSensorCount}
        totalCount={totalSensorCount}
      />

      <CustomRiskSimulator />

      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
          Edge Telemetry Values
        </div>
        <SensorCard reading={latestReading} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RiskExplainability latestPrediction={latestPrediction} reading={latestReading} />
        <SensorChart readings={readings} />
      </div>

      <PredictionTable predictions={predictions} />
    </div>
  );
};

export default DashboardPage;
