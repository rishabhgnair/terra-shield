import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, ArrowRight, CloudSun, Gauge, Layers3, MapPin, RadioTower, ShieldAlert } from 'lucide-react';
import GoogleRiskMap from './GoogleRiskMap';
import FreeRiskMap from './FreeRiskMap';
import { monitoringSites } from '../data/monitoringSites';
import { formatTimestamp, getRiskColor, normalizeRiskLevel, riskLevels } from '../utils/formatters';
import { fetchLiveWeather } from '../services/api';

const warningCopy = {
  LOW: 'Routine monitoring',
  MODERATE: 'Watch advisory',
  HIGH: 'Field verification requested',
  CRITICAL: 'Warning escalation active'
};

const metricRows = [
  { key: 'rainfall', label: 'Rainfall', unit: 'mm' },
  { key: 'soilMoisture', label: 'Soil moisture', unit: '%' },
  { key: 'slope', label: 'Slope angle', unit: 'deg' },
  { key: 'groundMovement', label: 'Displacement', unit: 'mm' }
];

const findByStation = (items, site) =>
  items?.find((item) => item.site_id === site.id || item.siteId === site.id || item.device_id === site.deviceId);

const buildSiteTelemetry = ({ site, readings, predictions, devices, latestReading, latestPrediction }) => {
  const reading = findByStation(readings, site) || (site.id === latestReading?.site_id ? latestReading : null);
  const prediction = findByStation(predictions, site) || (reading?.device_id === latestPrediction?.device_id ? latestPrediction : null);
  const device = findByStation(devices, site);
  const isPrimaryLiveSite =
    site.id === (latestReading?.site_id || 'NER-SITE-001') || site.deviceId === (latestReading?.device_id || 'ESP32-001');
  const livePrediction = isPrimaryLiveSite ? latestPrediction || prediction : prediction;
  const risk = normalizeRiskLevel(livePrediction?.risk_level || site.risk, livePrediction);

  return {
    ...site,
    deviceId: reading?.device_id || device?.device_id || site.deviceId,
    location: reading?.location || device?.location || `${site.name}, ${site.state}`,
    lat: Number(reading?.latitude ?? device?.latitude ?? site.lat),
    lng: Number(reading?.longitude ?? device?.longitude ?? site.lng),
    risk,
    rainfall: reading?.rainfall ?? livePrediction?.rainfall ?? site.rainfall,
    slope: reading?.slope ?? livePrediction?.slope ?? site.slope,
    soilMoisture: reading?.soil_moisture ?? livePrediction?.soil_moisture ?? site.soilMoisture,
    groundMovement: reading?.ground_movement ?? livePrediction?.ground_movement ?? site.groundMovement,
    battery: reading?.battery ?? device?.battery,
    status: device?.status || 'Online',
    lastSeen: reading?.timestamp || device?.last_seen,
    probability: livePrediction?.probability ?? livePrediction?.risk_probability,
    warningStatus: livePrediction?.message || warningCopy[risk] || site.warningStatus,
    safetyOverride: Boolean(livePrediction?.safety_override)
  };
};

const MapPanel = ({ latestPrediction, latestReading, predictions = [], readings = [], devices = [] }) => {
  const [selectedSiteId, setSelectedSiteId] = useState('NER-SITE-001');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapProvider, setMapProvider] = useState('osm'); // 'osm' (Free API) or 'google'
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const hasGoogleKey = Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);

  const sites = useMemo(
    () =>
      monitoringSites.map((site) =>
        buildSiteTelemetry({
          site,
          readings,
          predictions,
          devices,
          latestReading,
          latestPrediction
        })
      ),
    [devices, latestPrediction, latestReading, predictions, readings]
  );

  const activeSite = sites.find((site) => site.id === selectedSiteId) || sites[0];
  const activeColors = getRiskColor(activeSite?.risk, activeSite);

  // Fetch live weather when active site or location changes
  useEffect(() => {
    const lat = selectedLocation?.lat || activeSite?.lat;
    const lng = selectedLocation?.lng || activeSite?.lng;
    if (!lat || !lng) return;

    let isMounted = true;
    setWeatherLoading(true);
    fetchLiveWeather(lat, lng)
      .then((data) => {
        if (isMounted && data.success) {
          setWeatherData(data);
        }
      })
      .catch((err) => console.warn('Weather fetch error:', err))
      .finally(() => {
        if (isMounted) setWeatherLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeSite?.lat, activeSite?.lng, selectedLocation?.lat, selectedLocation?.lng]);

  const recentAlerts = useMemo(
    () =>
      sites
        .filter((site) => ['MODERATE', 'HIGH', 'CRITICAL'].includes(site.risk))
        .sort((a, b) => riskLevels.findIndex((level) => level.id === b.risk) - riskLevels.findIndex((level) => level.id === a.risk))
        .slice(0, 4),
    [sites]
  );

  const handleSiteSelect = useCallback((site) => {
    setSelectedSiteId(site.id);
    setSelectedLocation({
      name: site.name,
      source: 'Monitoring station',
      lat: site.lat,
      lng: site.lng
    });
  }, []);

  const handleLocationSelect = useCallback((location) => {
    setSelectedLocation(location);
  }, []);

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm md:p-5">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-emerald-800">
            <MapPin className="h-5 w-5" />
            <h2 className="text-base font-semibold tracking-tight text-stone-950">Terra Shield Regional Monitoring Map</h2>
          </div>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-stone-600">
            Monitored slopes, live environmental indicators, AI risk classification, and outdoor weather telemetry across North Eastern India.
          </p>
        </div>

        {/* Map Provider Selector & Legend */}
        <div className="flex flex-col gap-2.5 lg:items-end">
          <div className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 p-1 text-xs">
            <span className="px-2 text-[11px] font-semibold text-stone-500">Map API:</span>
            <button
              type="button"
              onClick={() => setMapProvider('osm')}
              className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                mapProvider === 'osm' ? 'bg-emerald-700 text-white shadow-sm' : 'text-stone-700 hover:bg-stone-200'
              }`}
            >
              OpenStreetMap (Free API)
            </button>
            <button
              type="button"
              onClick={() => setMapProvider('google')}
              className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                mapProvider === 'google' ? 'bg-emerald-700 text-white shadow-sm' : 'text-stone-700 hover:bg-stone-200'
              }`}
              title={hasGoogleKey ? 'Google Maps API active' : 'Requires Google Maps API Key'}
            >
              Google Maps {hasGoogleKey ? '' : '(Key required)'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 lg:w-[420px]">
            {riskLevels.map((level) => (
              <div key={level.id} className="rounded-md border border-stone-200 bg-stone-50 px-2.5 py-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: level.hex }} />
                  <span className="font-semibold text-stone-800">{level.label}</span>
                </div>
                <div className="mt-0.5 font-mono text-[10px] text-stone-500">{level.range}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-2 text-xs text-stone-600 md:grid-cols-5">
        {[
          ['Location', MapPin],
          ['Environmental Data', Gauge],
          ['AI Risk Analysis', Activity],
          ['Map Visualization', Layers3],
          ['Warning', ShieldAlert]
        ].map(([label, Icon], index, list) => (
          <div key={label} className="flex items-center gap-2 rounded-md border border-stone-200 bg-stone-50 px-3 py-2">
            <Icon className="h-4 w-4 shrink-0 text-emerald-700" />
            <span className="font-medium">{label}</span>
            {index < list.length - 1 && <ArrowRight className="ml-auto hidden h-3.5 w-3.5 text-stone-400 md:block" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
        {mapProvider === 'google' && hasGoogleKey ? (
          <GoogleRiskMap
            sites={sites}
            selectedSite={activeSite}
            selectedLocation={selectedLocation}
            onSiteSelect={handleSiteSelect}
            onLocationSelect={handleLocationSelect}
          />
        ) : (
          <FreeRiskMap
            sites={sites}
            selectedSite={activeSite}
            selectedLocation={selectedLocation}
            onSiteSelect={handleSiteSelect}
            onLocationSelect={handleLocationSelect}
          />
        )}

        <aside className="space-y-4">
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Selected Monitoring Location</p>
                <h3 className="mt-1 text-lg font-semibold text-stone-950">{activeSite.name}</h3>
                <p className="text-sm text-stone-600">{activeSite.region}, {activeSite.state}</p>
              </div>
              <span className={`rounded px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${activeColors.pillBg}`}>
                {activeColors.label}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md border border-stone-200 bg-white px-3 py-2">
                <p className="text-stone-500">Latitude</p>
                <p className="font-mono font-semibold text-stone-900">{activeSite.lat.toFixed(5)}</p>
              </div>
              <div className="rounded-md border border-stone-200 bg-white px-3 py-2">
                <p className="text-stone-500">Longitude</p>
                <p className="font-mono font-semibold text-stone-900">{activeSite.lng.toFixed(5)}</p>
              </div>
            </div>

            {selectedLocation && (
              <div className="mt-3 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                <p className="font-semibold">{selectedLocation.name}</p>
                <p className="font-mono">
                  {Number(selectedLocation.lat).toFixed(5)}, {Number(selectedLocation.lng).toFixed(5)}
                </p>
              </div>
            )}
          </div>

          {/* Live Free Weather & Elevation Card */}
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-stone-700">
                <CloudSun className="h-4 w-4 text-emerald-700" />
                <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Live Weather & Elevation</p>
              </div>
              <span className="rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-800">
                Free Open API
              </span>
            </div>

            {weatherLoading ? (
              <div className="py-3 text-center text-xs text-stone-500">Loading live weather telemetry...</div>
            ) : weatherData ? (
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-bold text-stone-900">{weatherData.temperature}°C</span>
                  <span className="text-xs font-medium text-stone-600">{weatherData.weather_text}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-stone-600">
                  <div className="rounded border border-stone-200 bg-stone-50 px-2 py-1">
                    <span className="text-[10px] text-stone-400">Elevation</span>
                    <p className="font-mono font-semibold text-stone-800">{weatherData.elevation || 1400} m</p>
                  </div>
                  <div className="rounded border border-stone-200 bg-stone-50 px-2 py-1">
                    <span className="text-[10px] text-stone-400">Windspeed</span>
                    <p className="font-mono font-semibold text-stone-800">{weatherData.windspeed || 5.0} km/h</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-2 text-xs text-stone-500">Weather data unavailable</div>
            )}
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Environmental Data</p>
              <span className="font-mono text-[11px] text-stone-500">Sync {formatTimestamp(activeSite.lastSeen)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {metricRows.map((metric) => (
                <div key={metric.key} className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2">
                  <p className="text-[11px] text-stone-500">{metric.label}</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-stone-900">
                    {activeSite[metric.key]} <span className="text-[10px] text-stone-500">{metric.unit}</span>
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-600">
              <div className="flex items-center justify-between gap-2">
                <span>Warning status</span>
                {activeSite.safetyOverride && <span className="font-semibold text-red-700">Safety override</span>}
              </div>
              <p className="mt-1 font-medium leading-relaxed text-stone-800">{activeSite.warningStatus}</p>
            </div>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Monitoring Stations</p>
              <span className="flex items-center gap-1 font-mono text-[11px] text-emerald-700">
                <RadioTower className="h-3.5 w-3.5" />
                {sites.filter((site) => site.status === 'Online').length}/{sites.length}
              </span>
            </div>
            <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
              {sites.map((site) => {
                const colors = getRiskColor(site.risk);
                const isSelected = activeSite.id === site.id;
                return (
                  <button
                    key={site.id}
                    type="button"
                    onClick={() => handleSiteSelect(site)}
                    className={`w-full rounded-md border px-3 py-2 text-left transition-colors ${
                      isSelected ? 'border-emerald-300 bg-emerald-50' : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-stone-900">{site.name}</p>
                        <p className="text-[11px] text-stone-500">{site.id} - {site.state}</p>
                      </div>
                      <span className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
                    </div>
                    <div className="mt-1 flex items-center justify-between font-mono text-[11px] text-stone-500">
                      <span>{site.rainfall} mm</span>
                      <span className={colors.text}>{colors.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-700" />
              <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Recent Alerts</p>
            </div>
            {recentAlerts.length === 0 ? (
              <p className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-600">
                No active advisories across the monitored network.
              </p>
            ) : (
              <div className="space-y-2">
                {recentAlerts.map((site) => {
                  const colors = getRiskColor(site.risk);
                  return (
                    <div key={site.id} className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-stone-900">{site.name}</span>
                        <span className={colors.text}>{colors.label}</span>
                      </div>
                      <p className="mt-1 text-stone-600">{site.warningStatus}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
};

export default MapPanel;
