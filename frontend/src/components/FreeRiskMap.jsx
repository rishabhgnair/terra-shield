import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  MapContainer, TileLayer, CircleMarker, Circle, Popup, Polyline,
  useMap, useMapEvents, Marker
} from 'react-leaflet';
import L from 'leaflet';
import {
  Search, ShieldAlert, Layers, Navigation, X, AlertTriangle,
  Clock, Users, Droplets, ChevronDown, Loader2, MapPin, Route
} from 'lucide-react';
import { northEastIndiaCenter } from '../data/monitoringSites';
import { getRiskColor, normalizeRiskLevel } from '../utils/formatters';
import { reverseGeocode } from '../services/api';
import { searchLocation, getRoute, checkRouteThroughRiskZones } from '../services/routing';

// ─── Constants ───────────────────────────────────────────────────────────────
const riskRadius = { LOW: 12000, MODERATE: 18000, HIGH: 26000, CRITICAL: 34000 };
const riskOpacity = { LOW: 0.08, MODERATE: 0.13, HIGH: 0.18, CRITICAL: 0.25 };
const SEVERITY_COLORS = { CRITICAL: '#c53030', HIGH: '#dd6b20', MODERATE: '#d69e2e', LOW: '#2f855a' };

const formatCoord = (val) => Number(val || 0).toFixed(5);

// ─── Map Controller ───────────────────────────────────────────────────────────
function MapController({ selectedSite, selectedLocation }) {
  const map = useMap();
  useEffect(() => {
    if (selectedLocation?.lat && selectedLocation?.lng) {
      map.flyTo([selectedLocation.lat, selectedLocation.lng], 11, { duration: 1.2 });
    } else if (selectedSite?.lat && selectedSite?.lng) {
      map.flyTo([selectedSite.lat, selectedSite.lng], 10, { duration: 1.2 });
    }
  }, [selectedSite, selectedLocation, map]);
  return null;
}

// ─── Click Handler ────────────────────────────────────────────────────────────
function MapClickHandler({ onLocationSelect, routePickMode, onRoutePick }) {
  useMapEvents({
    async click(e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      if (routePickMode) {
        onRoutePick?.({ lat, lng, name: `${formatCoord(lat)}, ${formatCoord(lng)}` });
        return;
      }

      onLocationSelect?.({ name: 'Resolving...', source: 'Map click', lat, lng });
      try {
        const geoRes = await reverseGeocode(lat, lng);
        if (geoRes.success) {
          onLocationSelect?.({
            name: `${geoRes.name}, ${geoRes.state}`,
            source: 'Map click (geocoded)',
            display_name: geoRes.display_name,
            lat, lng
          });
        }
      } catch {
        onLocationSelect?.({ name: `Point (${formatCoord(lat)}, ${formatCoord(lng)})`, source: 'Map click', lat, lng });
      }
    }
  });
  return null;
}

// ─── Custom Incident Icon ─────────────────────────────────────────────────────
const makeIncidentIcon = (severity) => L.divIcon({
  className: '',
  html: `<div style="
    width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
    background:${SEVERITY_COLORS[severity] || '#666'};
    border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 22]
});

// ─── Live User Location Icon ──────────────────────────────────────────────────
const liveLocationIcon = L.divIcon({
  className: '',
  html: `<div style="position:relative;width:20px;height:20px">
    <div style="
      position:absolute;inset:0;border-radius:50%;background:rgba(37,99,235,0.25);
      animation:pulse 2s infinite;
    "></div>
    <div style="
      position:absolute;inset:4px;border-radius:50%;background:#2563eb;
      border:2px solid white;box-shadow:0 0 6px rgba(37,99,235,0.6);
    "></div>
    <style>@keyframes pulse{0%,100%{transform:scale(1);opacity:0.6}50%{transform:scale(1.8);opacity:0}}</style>
  </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

// ─── Main Component ───────────────────────────────────────────────────────────
const FreeRiskMap = ({
  sites = [],
  selectedSite,
  selectedLocation,
  onSiteSelect,
  onLocationSelect,
  incidents = [],
  userPosition = null
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [tileProvider, setTileProvider] = useState('openstreetmap');
  const [showLayers, setShowLayers] = useState({ riskZones: true, incidents: true, route: true });

  // Routing state
  const [routeOrigin, setRouteOrigin] = useState(null);
  const [routeDest, setRouteDest] = useState(null);
  const [routePickMode, setRoutePickMode] = useState(null); // 'origin' | 'dest' | null
  const [routeData, setRouteData] = useState(null);
  const [routeRisk, setRouteRisk] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [showRoutePanel, setShowRoutePanel] = useState(false);
  const [originSearch, setOriginSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');
  const [originResults, setOriginResults] = useState([]);
  const [destResults, setDestResults] = useState([]);

  const searchDebounceRef = useRef(null);

  const defaultCenter = useMemo(() => {
    const first = sites[0];
    return first ? [first.lat, first.lng] : [northEastIndiaCenter.lat, northEastIndiaCenter.lng];
  }, [sites]);

  const tileUrls = {
    openstreetmap: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    topo: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Style: &copy; OpenTopoMap'
    },
    esri: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri'
    }
  };

  // ── Debounced global search ──────────────────────────────────────────────
  const handleSearchChange = (q) => {
    setSearchQuery(q);
    clearTimeout(searchDebounceRef.current);
    if (q.trim().length < 2) { setSearchResults([]); setShowSearchResults(false); return; }
    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      const results = await searchLocation(q, 5);
      setSearchResults(results);
      setShowSearchResults(true);
      setSearchLoading(false);
    }, 400);
  };

  const handleSearchSelect = (result) => {
    setSearchQuery(result.display_name || result.name);
    setShowSearchResults(false);
    onLocationSelect?.({ name: result.name, source: 'Search', lat: result.lat, lng: result.lng });
  };

  // ── Origin/Dest search ───────────────────────────────────────────────────
  const handleOriginSearch = async (q) => {
    setOriginSearch(q);
    if (q.length < 2) { setOriginResults([]); return; }
    const results = await searchLocation(q, 4);
    setOriginResults(results);
  };

  const handleDestSearch = async (q) => {
    setDestSearch(q);
    if (q.length < 2) { setDestResults([]); return; }
    const results = await searchLocation(q, 4);
    setDestResults(results);
  };

  // ── Get Directions ───────────────────────────────────────────────────────
  const handleGetDirections = useCallback(async () => {
    if (!routeOrigin || !routeDest) return;
    setRouteLoading(true);
    setRouteData(null);
    setRouteRisk(null);
    try {
      const route = await getRoute(routeOrigin.lat, routeOrigin.lng, routeDest.lat, routeDest.lng);
      setRouteData(route);

      // Check route against risk zones
      const { intersected, overallRisk } = checkRouteThroughRiskZones(route.coordinates, sites);
      setRouteRisk({ intersected, overallRisk });
    } catch (err) {
      console.error('Direction fetch failed:', err);
    } finally {
      setRouteLoading(false);
    }
  }, [routeOrigin, routeDest, sites]);

  const handleRoutePick = useCallback((point) => {
    if (routePickMode === 'origin') {
      setRouteOrigin(point);
      setOriginSearch(point.name);
      setOriginResults([]);
    } else if (routePickMode === 'dest') {
      setRouteDest(point);
      setDestSearch(point.name);
      setDestResults([]);
    }
    setRoutePickMode(null);
  }, [routePickMode]);

  const clearRoute = () => {
    setRouteData(null);
    setRouteRisk(null);
    setRouteOrigin(null);
    setRouteDest(null);
    setOriginSearch('');
    setDestSearch('');
  };

  // ── Route line color based on risk ──────────────────────────────────────
  const routeColor = routeRisk
    ? SEVERITY_COLORS[routeRisk.overallRisk] || '#2563eb'
    : '#2563eb';

  return (
    <div className="relative h-[520px] min-h-[420px] overflow-hidden rounded-xl border border-stone-200 bg-stone-100 md:h-[640px]">
      {/* ── Top search bar ─────────────────────────────────────────────────── */}
      <div className="absolute left-3 right-3 top-3 z-[1000] flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {/* Location search */}
          <div className="relative flex-1">
            <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white/97 px-3 py-2 shadow-md backdrop-blur-sm">
              <Search className="h-4 w-4 shrink-0 text-stone-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                className="w-full bg-transparent text-sm text-stone-800 outline-none placeholder:text-stone-400"
                placeholder="Search any location in India..."
              />
              {searchLoading && <Loader2 className="h-4 w-4 animate-spin text-stone-400" />}
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setSearchResults([]); setShowSearchResults(false); }}>
                  <X className="h-4 w-4 text-stone-400 hover:text-stone-700" />
                </button>
              )}
            </div>

            {/* Search dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full mt-1 w-full rounded-lg border border-stone-200 bg-white shadow-xl z-10 overflow-hidden">
                {searchResults.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSearchSelect(r)}
                    className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-stone-50 border-b border-stone-100 last:border-0"
                  >
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" />
                    <div>
                      <p className="font-medium text-stone-900 text-xs">{r.name}</p>
                      <p className="text-[10px] text-stone-500 line-clamp-1">{r.display_name}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Directions toggle button */}
          <button
            type="button"
            onClick={() => setShowRoutePanel((p) => !p)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium shadow-md transition ${
              showRoutePanel
                ? 'border-emerald-400 bg-emerald-700 text-white'
                : 'border-stone-200 bg-white/97 text-stone-700 hover:bg-emerald-50'
            }`}
          >
            <Route className="h-4 w-4" />
            <span className="hidden sm:inline">Directions</span>
          </button>

          {/* Tile switcher */}
          <div className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white/97 px-2 py-1.5 shadow-md text-[11px]">
            <Layers className="h-3.5 w-3.5 text-emerald-700" />
            {Object.keys(tileUrls).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setTileProvider(key)}
                className={`rounded px-1.5 py-0.5 font-medium transition ${tileProvider === key ? 'bg-emerald-700 text-white' : 'text-stone-600 hover:bg-stone-100'}`}
              >
                {key === 'openstreetmap' ? 'OSM' : key === 'topo' ? 'Topo' : 'Satellite'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Directions Panel ─────────────────────────────────────────────── */}
        {showRoutePanel && (
          <div className="rounded-lg border border-stone-200 bg-white shadow-xl">
            <div className="border-b border-stone-100 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation className="h-4 w-4 text-emerald-700" />
                <span className="text-sm font-semibold text-stone-900">Get Directions</span>
                {routePickMode && (
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 animate-pulse">
                    Click map to set {routePickMode}
                  </span>
                )}
              </div>
              {routeData && (
                <button onClick={clearRoute} className="text-xs text-red-600 hover:underline">Clear route</button>
              )}
            </div>

            <div className="p-3 space-y-2">
              {/* Origin input */}
              <div className="relative">
                <div className="flex items-center gap-2 rounded-md border border-stone-200 bg-stone-50 px-3 py-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-500 shrink-0" />
                  <input
                    value={originSearch}
                    onChange={(e) => handleOriginSearch(e.target.value)}
                    placeholder="Starting point..."
                    className="w-full bg-transparent text-xs text-stone-800 outline-none placeholder:text-stone-400"
                  />
                  <button
                    type="button"
                    onClick={() => setRoutePickMode('origin')}
                    title="Pick from map"
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition ${routePickMode === 'origin' ? 'bg-blue-600 text-white' : 'bg-stone-200 text-stone-600 hover:bg-stone-300'}`}
                  >
                    📍 Map
                  </button>
                </div>
                {originResults.length > 0 && (
                  <div className="absolute top-full mt-1 w-full rounded-md border border-stone-200 bg-white shadow-lg z-20 overflow-hidden">
                    {originResults.map((r, i) => (
                      <button key={i} type="button" onClick={() => { setRouteOrigin(r); setOriginSearch(r.name); setOriginResults([]); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-stone-50 border-b border-stone-100 last:border-0">
                        <MapPin className="h-3 w-3 text-stone-400" />
                        <span className="truncate">{r.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Destination input */}
              <div className="relative">
                <div className="flex items-center gap-2 rounded-md border border-stone-200 bg-stone-50 px-3 py-2">
                  <div className="h-3 w-3 rounded-full bg-red-500 shrink-0" />
                  <input
                    value={destSearch}
                    onChange={(e) => handleDestSearch(e.target.value)}
                    placeholder="Destination..."
                    className="w-full bg-transparent text-xs text-stone-800 outline-none placeholder:text-stone-400"
                  />
                  <button
                    type="button"
                    onClick={() => setRoutePickMode('dest')}
                    title="Pick from map"
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition ${routePickMode === 'dest' ? 'bg-blue-600 text-white' : 'bg-stone-200 text-stone-600 hover:bg-stone-300'}`}
                  >
                    📍 Map
                  </button>
                </div>
                {destResults.length > 0 && (
                  <div className="absolute top-full mt-1 w-full rounded-md border border-stone-200 bg-white shadow-lg z-20 overflow-hidden">
                    {destResults.map((r, i) => (
                      <button key={i} type="button" onClick={() => { setRouteDest(r); setDestSearch(r.name); setDestResults([]); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-stone-50 border-b border-stone-100 last:border-0">
                        <MapPin className="h-3 w-3 text-stone-400" />
                        <span className="truncate">{r.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={!routeOrigin || !routeDest || routeLoading}
                onClick={handleGetDirections}
                className="w-full rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 hover:bg-emerald-800 transition flex items-center justify-center gap-2"
              >
                {routeLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Navigation className="h-3.5 w-3.5" />}
                {routeLoading ? 'Calculating route...' : 'Get Directions'}
              </button>

              {/* Route result summary */}
              {routeData && (
                <div className={`rounded-md border px-3 py-2 text-xs ${
                  routeRisk?.overallRisk === 'CRITICAL' ? 'border-red-200 bg-red-50 text-red-900' :
                  routeRisk?.overallRisk === 'HIGH' ? 'border-orange-200 bg-orange-50 text-orange-900' :
                  routeRisk?.overallRisk === 'MODERATE' ? 'border-amber-200 bg-amber-50 text-amber-900' :
                  'border-emerald-200 bg-emerald-50 text-emerald-900'
                }`}>
                  <div className="font-semibold flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Route Risk: {routeRisk?.overallRisk || 'LOW'}
                    {routeData.distance_km && <span className="ml-auto font-normal">{routeData.distance_km} km</span>}
                    {routeData.duration_min && <span>· {routeData.duration_min} min</span>}
                  </div>
                  {routeRisk?.intersected?.length > 0 && (
                    <div className="mt-1.5 space-y-0.5">
                      {routeRisk.intersected.map((z, i) => (
                        <p key={i} className="font-mono text-[10px]">⚠ {z.name} — {z.risk} zone ({z.distance_km} km from route)</p>
                      ))}
                    </div>
                  )}
                  {routeData.steps?.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer font-medium text-[10px] text-stone-600 hover:text-stone-900">
                        Turn-by-turn directions ({routeData.steps.length} steps)
                      </summary>
                      <div className="mt-1.5 max-h-40 overflow-y-auto space-y-1">
                        {routeData.steps.map((step, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-[10px] text-stone-700">
                            <span className="shrink-0 font-mono text-stone-400">{i + 1}.</span>
                            <span>{step.instruction}</span>
                            <span className="ml-auto shrink-0 text-stone-400">{step.distance_km}km</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Map ─────────────────────────────────────────────────────────────── */}
      <MapContainer
        center={defaultCenter}
        zoom={7}
        minZoom={5}
        scrollWheelZoom={true}
        className="h-full w-full"
        style={{ background: '#eef5ed' }}
      >
        <TileLayer url={tileUrls[tileProvider].url} attribution={tileUrls[tileProvider].attribution} />
        <MapController selectedSite={selectedSite} selectedLocation={selectedLocation} />
        <MapClickHandler onLocationSelect={onLocationSelect} routePickMode={routePickMode} onRoutePick={handleRoutePick} />

        {/* Risk zone circles */}
        {showLayers.riskZones && sites.map((site) => {
          const riskLevel = normalizeRiskLevel(site.risk);
          const colors = getRiskColor(riskLevel);
          const isSelected = selectedSite?.id === site.id;
          const pos = [Number(site.lat), Number(site.lng)];

          return (
            <React.Fragment key={site.id}>
              <Circle
                center={pos}
                radius={riskRadius[riskLevel] || 12000}
                pathOptions={{
                  color: colors.hex,
                  fillColor: colors.hex,
                  fillOpacity: riskOpacity[riskLevel] || 0.1,
                  weight: isSelected ? 2 : 1
                }}
              />
              <CircleMarker
                center={pos}
                radius={isSelected ? 10 : 7}
                pathOptions={{
                  color: isSelected ? '#000000' : '#ffffff',
                  fillColor: colors.hex,
                  fillOpacity: 1,
                  weight: isSelected ? 3 : 2
                }}
                eventHandlers={{
                  click: () => {
                    onSiteSelect?.(site);
                    onLocationSelect?.({ name: site.name, source: 'Monitoring station', lat: site.lat, lng: site.lng });
                  }
                }}
              >
                <Popup>
                  <div className="p-1 text-xs text-stone-900 min-w-[220px]">
                    <div className="flex items-center justify-between gap-2 border-b border-stone-200 pb-1.5 mb-2">
                      <div>
                        <p className="font-bold text-sm text-stone-950">{site.name}</p>
                        <p className="text-[10px] text-stone-500">{site.state} · {site.id}</p>
                      </div>
                      <span className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white" style={{ backgroundColor: colors.hex }}>
                        {colors.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[11px] mb-2">
                      <span>Rainfall: <strong>{site.rainfall} mm</strong></span>
                      <span>Soil: <strong>{site.soilMoisture}%</strong></span>
                      <span>Slope: <strong>{site.slope}°</strong></span>
                      <span>Displacement: <strong>{site.groundMovement} mm</strong></span>
                    </div>
                    <div className="rounded bg-stone-100 p-1.5 text-[10px] text-stone-700">
                      <strong>Status:</strong> {site.warningStatus}
                    </div>
                    {site.probability && (
                      <div className="mt-1 rounded bg-stone-100 p-1.5 text-[10px]">
                        AI Probability: <strong>{Math.round(site.probability * 100)}%</strong>
                      </div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            </React.Fragment>
          );
        })}

        {/* Incident history markers */}
        {showLayers.incidents && incidents.map((inc) => (
          <Marker
            key={inc.id}
            position={[inc.latitude, inc.longitude]}
            icon={makeIncidentIcon(inc.severity)}
          >
            <Popup>
              <div className="p-1 text-xs min-w-[220px]">
                <div className="flex items-center gap-2 mb-1.5 border-b border-stone-100 pb-1.5">
                  <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: SEVERITY_COLORS[inc.severity] }} />
                  <div>
                    <p className="font-bold text-stone-900">{inc.location_name}</p>
                    <p className="text-[10px] text-stone-500">{inc.state}</p>
                  </div>
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-stone-400" />
                    <span>{inc.event_date}</span>
                    <span className="ml-auto font-semibold" style={{ color: SEVERITY_COLORS[inc.severity] }}>{inc.severity}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Droplets className="h-3 w-3 text-blue-500" />
                    <span>Rainfall: <strong>{inc.rainfall_mm} mm</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3 w-3 text-red-500" />
                    <span>Casualties: <strong>{inc.casualties}</strong> · Injured: <strong>{inc.injured}</strong></span>
                  </div>
                  <p className="text-[10px] text-stone-600 mt-1 italic">{inc.notes}</p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Route polyline */}
        {showLayers.route && routeData?.coordinates && (
          <Polyline
            positions={routeData.coordinates}
            pathOptions={{ color: routeColor, weight: 5, opacity: 0.85, dashArray: routeData.success ? null : '8 6' }}
          />
        )}

        {/* Route origin/dest markers */}
        {routeOrigin && (
          <CircleMarker center={[routeOrigin.lat, routeOrigin.lng]} radius={8} pathOptions={{ color: '#fff', fillColor: '#10b981', fillOpacity: 1, weight: 2 }}>
            <Popup><p className="text-xs font-semibold text-emerald-800">Start: {routeOrigin.name}</p></Popup>
          </CircleMarker>
        )}
        {routeDest && (
          <CircleMarker center={[routeDest.lat, routeDest.lng]} radius={8} pathOptions={{ color: '#fff', fillColor: '#ef4444', fillOpacity: 1, weight: 2 }}>
            <Popup><p className="text-xs font-semibold text-red-800">End: {routeDest.name}</p></Popup>
          </CircleMarker>
        )}

        {/* Selected location marker */}
        {selectedLocation && (
          <CircleMarker
            center={[Number(selectedLocation.lat), Number(selectedLocation.lng)]}
            radius={9}
            pathOptions={{ color: '#ffffff', fillColor: '#2563eb', fillOpacity: 1, weight: 2 }}
          >
            <Popup>
              <div className="p-1 text-xs font-sans">
                <p className="font-semibold text-blue-900">{selectedLocation.name || 'Selected Location'}</p>
                <p className="font-mono text-[10px] text-stone-600">
                  {formatCoord(selectedLocation.lat)}, {formatCoord(selectedLocation.lng)}
                </p>
              </div>
            </Popup>
          </CircleMarker>
        )}

        {/* User live location */}
        {userPosition && (
          <Marker position={[userPosition.lat, userPosition.lng]} icon={liveLocationIcon}>
            <Popup>
              <div className="text-xs">
                <p className="font-semibold text-blue-800">Your Location</p>
                <p className="font-mono text-[10px] text-stone-600">
                  {formatCoord(userPosition.lat)}, {formatCoord(userPosition.lng)}
                </p>
                {userPosition.accuracy && (
                  <p className="text-[10px] text-stone-500">Accuracy: ±{Math.round(userPosition.accuracy)}m</p>
                )}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* ── Layer toggles bottom-left ─────────────────────────────────────── */}
      <div className="absolute bottom-3 left-3 z-[1000] flex flex-col gap-1.5">
        <div className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-white/97 px-3 py-1.5 shadow-md text-xs">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-emerald-900">OpenStreetMap + ORS</span>
          <span className="text-[10px] text-stone-500">| Free APIs</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white/97 px-2 py-1 shadow-md">
          {[
            { key: 'riskZones', label: '🔴 Risk Zones' },
            { key: 'incidents', label: '🔺 History' },
            { key: 'route', label: '🔵 Route' }
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setShowLayers((l) => ({ ...l, [key]: !l[key] }))}
              className={`rounded px-2 py-0.5 text-[10px] font-medium transition ${showLayers[key] ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-500'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Coords bottom-right ───────────────────────────────────────────── */}
      {selectedLocation && (
        <div className="absolute bottom-3 right-3 z-[1000] rounded-lg border border-stone-200 bg-white/97 px-3 py-1.5 text-xs text-stone-700 shadow-md font-mono">
          {formatCoord(selectedLocation.lat)}, {formatCoord(selectedLocation.lng)}
        </div>
      )}

      {/* Route pick mode overlay hint */}
      {routePickMode && (
        <div className="absolute inset-x-0 bottom-14 z-[1000] flex justify-center">
          <div className="rounded-lg border border-blue-300 bg-blue-600 px-4 py-2 text-sm text-white shadow-lg animate-bounce">
            Click anywhere on the map to set {routePickMode === 'origin' ? 'starting point' : 'destination'}
          </div>
        </div>
      )}
    </div>
  );
};

export default FreeRiskMap;
