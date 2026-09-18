import { useEffect, useState } from 'react';

let googleMapsPromise = null;

const createGoogleMapsScript = (apiKey) => {
  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const params = new URLSearchParams({
      key: apiKey,
      libraries: 'places',
      v: 'weekly'
    });

    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => reject(new Error('Google Maps failed to load. Check the API key, billing, and network access.'));

    document.head.appendChild(script);
  });

  return googleMapsPromise;
};

export const useGoogleMaps = () => {
  const [mapsState, setMapsState] = useState({
    maps: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setMapsState({
        maps: null,
        loading: false,
        error: 'Google Maps API key is missing. Add VITE_GOOGLE_MAPS_API_KEY to your frontend environment.'
      });
      return;
    }

    let isActive = true;
    setMapsState((current) => ({ ...current, loading: true, error: null }));

    createGoogleMapsScript(apiKey)
      .then((maps) => {
        if (isActive) {
          setMapsState({ maps, loading: false, error: null });
        }
      })
      .catch((error) => {
        if (isActive) {
          setMapsState({ maps: null, loading: false, error: error.message });
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  return mapsState;
};
