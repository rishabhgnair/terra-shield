import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchSensorReadings, fetchPredictions, fetchDevices, fetchDemoScenario } from '../services/api';

export const useSensorData = (pollingInterval = 5000) => {
  const [readings, setReadings] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [devices, setDevices] = useState([]);
  const [demoScenario, setDemoScenarioState] = useState('AUTO');
  const [latestReading, setLatestReading] = useState(null);
  const [latestPrediction, setLatestPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBackendOnline, setIsBackendOnline] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const isMountedRef = useRef(true);
  const isFetchingRef = useRef(false);

  const loadData = useCallback(async () => {
    // Guard against overlapping polls: if the backend is slow and a request
    // is still in flight when the next interval tick fires, skip this tick
    // rather than firing a second request that could resolve out of order
    // and stomp newer state with stale data.
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const [readingsRes, predictionsRes, devicesRes, demoRes] = await Promise.allSettled([
        fetchSensorReadings(30),
        fetchPredictions(30),
        fetchDevices(),
        fetchDemoScenario()
      ]);

      if (!isMountedRef.current) return;

      let isAnySuccess = false;

      if (readingsRes.status === 'fulfilled' && readingsRes.value?.success) {
        const data = readingsRes.value.data || [];
        setReadings(data);
        if (data.length > 0) setLatestReading(data[0]);
        isAnySuccess = true;
      }

      if (predictionsRes.status === 'fulfilled' && predictionsRes.value?.success) {
        const data = predictionsRes.value.data || [];
        setPredictions(data);
        if (data.length > 0) setLatestPrediction(data[0]);
        isAnySuccess = true;
      }

      if (devicesRes.status === 'fulfilled' && devicesRes.value?.success) {
        setDevices(devicesRes.value.data || []);
        isAnySuccess = true;
      }

      if (demoRes.status === 'fulfilled' && demoRes.value?.success) {
        setDemoScenarioState(demoRes.value.current_scenario || 'AUTO');
      }

      if (isAnySuccess) {
        setIsBackendOnline(true);
        setError(null);
        setLastUpdated(new Date());
      } else {
        setIsBackendOnline(false);
        setError('Backend API is not responding or unreachable.');
      }
    } catch (err) {
      if (isMountedRef.current) {
        setIsBackendOnline(false);
        setError(err.message || 'Error connecting to backend API.');
      }
    } finally {
      isFetchingRef.current = false;
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadData();

    const intervalId = setInterval(() => {
      loadData();
    }, pollingInterval);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [loadData, pollingInterval]);

  return {
    readings,
    predictions,
    devices,
    latestReading,
    latestPrediction,
    demoScenario,
    loading,
    error,
    isBackendOnline,
    lastUpdated,
    refreshData: loadData
  };
};
