/**
 * Terra Shield — Routing & Geocoding Service
 * Uses OpenRouteService (free, no API key required for basic usage)
 * and Nominatim for geocoding. Provides route fetching + risk zone checking.
 */

const ORS_BASE = 'https://api.openrouteservice.org/v2';
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

// OpenRouteService free API key (public demo key — limited to 2000 req/day)
// For production, get a free key at https://openrouteservice.org
const ORS_API_KEY = '5b3ce3597851110001cf624826c58f03b44e4a2e94e5dc8bd25dab4b';

/**
 * Geocode a search query to lat/lng using Nominatim.
 * Returns array of results: { lat, lng, display_name, name, type }
 */
export async function searchLocation(query, limit = 5) {
  if (!query || query.trim().length < 2) return [];
  try {
    const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=${limit}&countrycodes=in&addressdetails=1`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'TerraShield-LandslideMonitor/1.0' }
    });
    const data = await res.json();
    return data.map((item) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      display_name: item.display_name,
      name: item.address?.city || item.address?.town || item.address?.village ||
            item.address?.county || item.address?.state || item.display_name.split(',')[0],
      type: item.type,
      importance: item.importance
    }));
  } catch (err) {
    console.warn('[searchLocation] error:', err);
    return [];
  }
}

/**
 * Get a driving route between two points using OpenRouteService.
 * Returns { coordinates: [[lng, lat], ...], distance_m, duration_s, steps }
 */
export async function getRoute(originLat, originLng, destLat, destLng) {
  try {
    const url = `${ORS_BASE}/directions/driving-car`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': ORS_API_KEY
      },
      body: JSON.stringify({
        coordinates: [
          [originLng, originLat],
          [destLng, destLat]
        ],
        instructions: true,
        language: 'en',
        units: 'km'
      })
    });

    if (!res.ok) throw new Error(`ORS returned ${res.status}`);
    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) throw new Error('No route found');

    const coords = route.geometry.coordinates; // [lng, lat] pairs
    const summary = route.summary;
    const steps = route.segments?.[0]?.steps?.map((s) => ({
      instruction: s.instruction,
      distance_km: (s.distance / 1000).toFixed(1),
      duration_min: Math.ceil(s.duration / 60),
      type: s.type
    })) || [];

    return {
      success: true,
      // Convert to [lat, lng] for Leaflet
      coordinates: coords.map(([lng, lat]) => [lat, lng]),
      distance_km: (summary.distance / 1000).toFixed(1),
      duration_min: Math.ceil(summary.duration / 60),
      steps,
      raw_geometry: coords
    };
  } catch (err) {
    console.warn('[getRoute] ORS failed, using straight-line fallback:', err.message);
    // Fallback: straight line
    return {
      success: false,
      coordinates: [[originLat, originLng], [destLat, destLng]],
      distance_km: haversineKm(originLat, originLng, destLat, destLng).toFixed(1),
      duration_min: null,
      steps: [],
      error: err.message
    };
  }
}

/**
 * Check if any point in routeCoords falls within a risk zone's radius.
 * Returns annotated risk zones that intersect the route.
 */
export function checkRouteThroughRiskZones(routeCoords, riskZones) {
  const RISK_PRIORITY = { LOW: 1, MODERATE: 2, HIGH: 3, CRITICAL: 4 };
  const ZONE_RADIUS_KM = { LOW: 18, MODERATE: 22, HIGH: 28, CRITICAL: 35 };

  const intersected = [];
  let overallRisk = 'LOW';

  for (const zone of riskZones) {
    const radius = ZONE_RADIUS_KM[zone.risk] || 20;
    const minDist = Math.min(
      ...routeCoords.map(([lat, lng]) => haversineKm(lat, lng, zone.lat, zone.lng))
    );
    if (minDist <= radius) {
      intersected.push({ ...zone, distance_km: minDist.toFixed(1) });
      if ((RISK_PRIORITY[zone.risk] || 0) > (RISK_PRIORITY[overallRisk] || 0)) {
        overallRisk = zone.risk;
      }
    }
  }

  return { intersected, overallRisk };
}

/**
 * Haversine distance in km between two lat/lng points.
 */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}
