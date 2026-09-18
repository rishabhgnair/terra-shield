import React, { useEffect, useMemo, useRef } from 'react';
import { AlertCircle, Loader2, Search } from 'lucide-react';
import { northEastIndiaCenter } from '../data/monitoringSites';
import { getRiskColor, normalizeRiskLevel } from '../utils/formatters';
import { useGoogleMaps } from '../hooks/useGoogleMaps';

const mapStyles = [
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.medical', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'landscape.natural', stylers: [{ color: '#eef5ed' }] },
  { featureType: 'water', stylers: [{ color: '#cfe4ef' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] }
];

const riskRadius = {
  LOW: 12000,
  MODERATE: 18000,
  HIGH: 26000,
  CRITICAL: 34000
};

const riskOpacity = {
  LOW: 0.06,
  MODERATE: 0.1,
  HIGH: 0.14,
  CRITICAL: 0.18
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const formatCoord = (value) => Number(value || 0).toFixed(5);

const createStationContent = (site) => {
  const colors = getRiskColor(site.risk);
  return `
    <div style="font-family: Inter, system-ui, sans-serif; min-width: 220px; color: #1f2937;">
      <div style="display: flex; justify-content: space-between; gap: 12px; align-items: start; margin-bottom: 8px;">
        <div>
          <div style="font-weight: 700; font-size: 13px;">${escapeHtml(site.name)}</div>
          <div style="font-size: 11px; color: #667085;">${escapeHtml(site.state)} - ${escapeHtml(site.id)}</div>
        </div>
        <span style="font-size: 10px; text-transform: uppercase; letter-spacing: .04em; color: ${colors.hex}; border: 1px solid ${colors.hex}33; background: ${colors.hex}14; border-radius: 4px; padding: 3px 6px; font-weight: 700;">
          ${escapeHtml(colors.label)}
        </span>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px;">
        <span>Rainfall: <strong>${escapeHtml(site.rainfall)} mm</strong></span>
        <span>Soil: <strong>${escapeHtml(site.soilMoisture)}%</strong></span>
        <span>Slope: <strong>${escapeHtml(site.slope)} deg</strong></span>
        <span>Movement: <strong>${escapeHtml(site.groundMovement)} mm</strong></span>
      </div>
      <div style="border-top: 1px solid #e5e7eb; margin-top: 8px; padding-top: 7px; font-size: 11px; color: #475467;">
        Warning status: <strong>${escapeHtml(site.warningStatus)}</strong>
      </div>
    </div>
  `;
};

const GoogleRiskMap = ({ sites, selectedSite, selectedLocation, onSiteSelect, onLocationSelect }) => {
  const mapContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const mapRef = useRef(null);
  const infoWindowRef = useRef(null);
  const markersRef = useRef([]);
  const circlesRef = useRef([]);
  const selectedMarkerRef = useRef(null);

  const { maps, loading, error } = useGoogleMaps();

  const defaultCenter = useMemo(() => {
    const firstSite = sites?.[0];
    return firstSite ? { lat: firstSite.lat, lng: firstSite.lng } : northEastIndiaCenter;
  }, [sites]);

  useEffect(() => {
    if (!maps || !mapContainerRef.current || mapRef.current) return;

    mapRef.current = new maps.Map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 7,
      minZoom: 5,
      mapTypeId: maps.MapTypeId.TERRAIN,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      gestureHandling: 'greedy',
      styles: mapStyles
    });

    infoWindowRef.current = new maps.InfoWindow();

    const clickListener = mapRef.current.addListener('click', (event) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      onLocationSelect?.({
        name: 'Selected terrain point',
        source: 'Map selection',
        lat,
        lng
      });
    });

    return () => {
      clickListener.remove();
    };
  }, [defaultCenter, maps, onLocationSelect]);

  useEffect(() => {
    if (!maps || !mapRef.current || !searchInputRef.current || !maps.places) return undefined;

    const searchBox = new maps.places.SearchBox(searchInputRef.current);
    const boundsListener = mapRef.current.addListener('bounds_changed', () => {
      searchBox.setBounds(mapRef.current.getBounds());
    });

    const placesListener = searchBox.addListener('places_changed', () => {
      const places = searchBox.getPlaces();
      const place = places?.[0];
      const location = place?.geometry?.location;

      if (!location) return;

      const lat = location.lat();
      const lng = location.lng();
      mapRef.current.panTo({ lat, lng });
      mapRef.current.setZoom(12);

      onLocationSelect?.({
        name: place.name || 'Search result',
        source: 'Search result',
        address: place.formatted_address,
        lat,
        lng
      });
    });

    return () => {
      boundsListener.remove();
      placesListener.remove();
    };
  }, [maps, onLocationSelect]);

  useEffect(() => {
    if (!maps || !mapRef.current) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    circlesRef.current.forEach((circle) => circle.setMap(null));
    markersRef.current = [];
    circlesRef.current = [];

    const bounds = new maps.LatLngBounds();

    sites.forEach((site) => {
      const riskLevel = normalizeRiskLevel(site.risk);
      const colors = getRiskColor(riskLevel);
      const isSelected = selectedSite?.id === site.id;
      const position = { lat: Number(site.lat), lng: Number(site.lng) };

      bounds.extend(position);

      const marker = new maps.Marker({
        map: mapRef.current,
        position,
        title: `${site.name} - ${colors.label} risk`,
        optimized: true,
        icon: {
          path: maps.SymbolPath.CIRCLE,
          fillColor: colors.hex,
          fillOpacity: 0.95,
          strokeColor: '#ffffff',
          strokeOpacity: 1,
          strokeWeight: isSelected ? 3 : 2,
          scale: isSelected ? 9 : 7
        }
      });

      marker.addListener('click', () => {
        onSiteSelect?.(site);
        onLocationSelect?.({
          name: site.name,
          source: 'Monitoring station',
          lat: site.lat,
          lng: site.lng
        });
        infoWindowRef.current.setContent(createStationContent(site));
        infoWindowRef.current.open({ map: mapRef.current, anchor: marker });
      });

      const circle = new maps.Circle({
        map: mapRef.current,
        center: position,
        radius: riskRadius[riskLevel],
        strokeColor: colors.hex,
        strokeOpacity: 0.38,
        strokeWeight: 1,
        fillColor: colors.hex,
        fillOpacity: riskOpacity[riskLevel]
      });

      markersRef.current.push(marker);
      circlesRef.current.push(circle);
    });

    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, 60);
    }
  }, [maps, onLocationSelect, onSiteSelect, selectedSite?.id, sites]);

  useEffect(() => {
    if (!maps || !mapRef.current) return;

    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.setMap(null);
      selectedMarkerRef.current = null;
    }

    if (!selectedLocation) return;

    const position = {
      lat: Number(selectedLocation.lat),
      lng: Number(selectedLocation.lng)
    };

    selectedMarkerRef.current = new maps.Marker({
      map: mapRef.current,
      position,
      title: selectedLocation.name || 'Selected location',
      zIndex: 2000,
      icon: {
        path: maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        fillColor: '#2563eb',
        fillOpacity: 0.95,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 6
      }
    });

    mapRef.current.panTo(position);
  }, [maps, selectedLocation]);

  if (loading || error) {
    return (
      <div className="flex h-[420px] min-h-[420px] items-center justify-center rounded-lg border border-dashed border-stone-300 bg-stone-50 text-center">
        <div className="max-w-sm px-6">
          {loading ? (
            <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-emerald-700" />
          ) : (
            <AlertCircle className="mx-auto mb-3 h-6 w-6 text-amber-700" />
          )}
          <p className="text-sm font-semibold text-stone-800">
            {loading ? 'Loading Google Maps' : 'Google Maps unavailable'}
          </p>
          {error && <p className="mt-1 text-xs leading-relaxed text-stone-600">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[420px] min-h-[420px] overflow-hidden rounded-lg border border-stone-200 bg-stone-100 md:h-[560px]">
      <div ref={mapContainerRef} className="h-full w-full" aria-label="Terra Shield risk monitoring map" />
      <div className="absolute left-3 right-3 top-3 max-w-md">
        <div className="flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 shadow-sm">
          <Search className="h-4 w-4 shrink-0 text-stone-500" />
          <input
            ref={searchInputRef}
            type="search"
            className="w-full bg-transparent text-sm text-stone-800 outline-none placeholder:text-stone-400"
            placeholder="Search district, road corridor, or coordinates"
            aria-label="Search monitoring location"
          />
        </div>
      </div>
      <div className="absolute bottom-3 left-3 rounded-md border border-stone-200 bg-white/95 px-3 py-2 text-xs text-stone-700 shadow-sm">
        {selectedLocation ? (
          <span>
            {selectedLocation.source}: {formatCoord(selectedLocation.lat)}, {formatCoord(selectedLocation.lng)}
          </span>
        ) : (
          <span>Map center: {formatCoord(defaultCenter.lat)}, {formatCoord(defaultCenter.lng)}</span>
        )}
      </div>
    </div>
  );
};

export default GoogleRiskMap;
