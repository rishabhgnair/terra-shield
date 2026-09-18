/**
 * Terra Shield — Geolocation Hook
 * Watches user's live GPS position and detects proximity to HIGH/CRITICAL risk zones.
 * Triggers browser notifications when user enters a danger zone.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { haversineKm } from '../services/routing';

const ALERT_RADIUS_KM = {
  CRITICAL: 15,
  HIGH: 10,
  MODERATE: 5
};

export function useGeolocation(riskZones = [], enabled = false) {
  const [position, setPosition] = useState(null);      // { lat, lng, accuracy }
  const [error, setError] = useState(null);
  const [nearbyRisks, setNearbyRisks] = useState([]);   // zones within alert radius
  const [permissionState, setPermissionState] = useState('prompt'); // 'prompt'|'granted'|'denied'
  const watchIdRef = useRef(null);
  const alreadyNotifiedRef = useRef(new Set());
  const notificationPermRef = useRef(false);

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') {
      notificationPermRef.current = true;
      return true;
    }
    const result = await Notification.requestPermission();
    notificationPermRef.current = result === 'granted';
    return notificationPermRef.current;
  }, []);

  const triggerBrowserNotification = useCallback((zone) => {
    if (!notificationPermRef.current) return;
    const key = `${zone.id || zone.name}`;
    if (alreadyNotifiedRef.current.has(key)) return;
    alreadyNotifiedRef.current.add(key);

    try {
      new Notification('⚠️ Terra Shield — Landslide Risk Alert', {
        body: `You are near ${zone.name} (${zone.state || 'NE India'}) — ${zone.risk} RISK zone. Exercise extreme caution!`,
        icon: '/vite.svg',
        tag: key,
        requireInteraction: zone.risk === 'CRITICAL'
      });
    } catch (e) {
      console.warn('Notification failed:', e);
    }
  }, []);

  const checkProximity = useCallback((lat, lng) => {
    const nearby = [];
    for (const zone of riskZones) {
      if (!['HIGH', 'CRITICAL', 'MODERATE'].includes(zone.risk)) continue;
      const dist = haversineKm(lat, lng, zone.lat, zone.lng);
      const threshold = ALERT_RADIUS_KM[zone.risk] || 5;
      if (dist <= threshold) {
        nearby.push({ ...zone, distance_km: dist.toFixed(1) });
        if (['HIGH', 'CRITICAL'].includes(zone.risk)) {
          triggerBrowserNotification(zone);
        }
      }
    }
    setNearbyRisks(nearby);
    return nearby;
  }, [riskZones, triggerBrowserNotification]);

  const startWatching = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    await requestNotificationPermission();

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        setPosition({ lat, lng, accuracy });
        setPermissionState('granted');
        checkProximity(lat, lng);
        setError(null);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setPermissionState('denied');
        setError(err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 }
    );
  }, [checkProximity, requestNotificationPermission]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setPosition(null);
    setNearbyRisks([]);
    alreadyNotifiedRef.current.clear();
  }, []);

  useEffect(() => {
    if (enabled) {
      startWatching();
    } else {
      stopWatching();
    }
    return () => stopWatching();
  }, [enabled]);

  // Re-check proximity when zones change while watching
  useEffect(() => {
    if (position && enabled) {
      checkProximity(position.lat, position.lng);
    }
  }, [riskZones, position, enabled, checkProximity]);

  return {
    position,
    error,
    nearbyRisks,
    permissionState,
    isWatching: watchIdRef.current !== null,
    startWatching,
    stopWatching
  };
}
