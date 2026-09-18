import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const checkHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

export const fetchSensorReadings = async (limit = 20, deviceId = null) => {
  const params = { limit };
  if (deviceId) params.device_id = deviceId;
  const response = await apiClient.get('/sensor-data', { params });
  return response.data;
};

export const fetchPredictions = async (limit = 20, deviceId = null) => {
  const params = { limit };
  if (deviceId) params.device_id = deviceId;
  const response = await apiClient.get('/predictions', { params });
  return response.data;
};

export const fetchDevices = async () => {
  const response = await apiClient.get('/devices');
  return response.data;
};

export const predictRisk = async (payload) => {
  const response = await apiClient.post('/predict', payload);
  return response.data;
};

export const setDemoScenario = async (scenario) => {
  const response = await apiClient.post('/demo/scenario', { scenario });
  return response.data;
};

export const fetchDemoScenario = async () => {
  const response = await apiClient.get('/demo/scenario');
  return response.data;
};

export const fetchMetadata = async () => {
  const response = await apiClient.get('/metadata');
  return response.data;
};

export const fetchLiveWeather = async (lat, lng) => {
  const response = await apiClient.get('/weather', { params: { lat, lng } });
  return response.data;
};

export const fetchWeatherForecast = async (lat, lng) => {
  const response = await apiClient.get('/weather/forecast', { params: { lat, lng } });
  return response.data;
};

export const reverseGeocode = async (lat, lng) => {
  const response = await apiClient.get('/geocoding/reverse', { params: { lat, lng } });
  return response.data;
};

export const getExportCsvUrl = (type = 'readings') => {
  return `${API_BASE_URL}/export/csv?type=${type}`;
};

// Government Alerts
export const fetchAlerts = async (limit = 50, unacknowledgedOnly = false) => {
  const response = await apiClient.get('/alerts', {
    params: { limit, unacknowledged: unacknowledgedOnly }
  });
  return response.data;
};

export const dispatchAlert = async (siteId, siteName, riskLevel, state, latitude, longitude, message) => {
  const response = await apiClient.post('/alerts', {
    site_id: siteId,
    site_name: siteName,
    risk_level: riskLevel,
    state,
    latitude,
    longitude,
    message
  });
  return response.data;
};

export const acknowledgeAlert = async (alertId) => {
  const response = await apiClient.post(`/alerts/${alertId}/acknowledge`);
  return response.data;
};

// Incident History
export const fetchIncidentHistory = async (lat = null, lng = null, radiusKm = 150, limit = 20, state = null) => {
  const params = { radius: radiusKm, limit };
  if (lat !== null) params.lat = lat;
  if (lng !== null) params.lng = lng;
  if (state) params.state = state;
  const response = await apiClient.get('/incident-history', { params });
  return response.data;
};

// AI Risk Analysis
export const fetchAiAnalysis = async (payload) => {
  const response = await apiClient.post('/ai-analysis', payload);
  return response.data;
};

// Route Risk Assessment
export const assessRouteRisk = async (coordinates) => {
  const response = await apiClient.post('/route-risk', { coordinates });
  return response.data;
};

export default apiClient;
