import React from 'react';
import MapPanel from '../components/MapPanel';
import GovtAlertConsole from '../components/GovtAlertConsole';
import IncidentHistoryPanel from '../components/IncidentHistoryPanel';

const MapPage = ({ latestPrediction, latestReading, predictions = [], readings = [], devices = [] }) => {
  const currentLat = latestReading?.latitude ?? 25.5788;
  const currentLng = latestReading?.longitude ?? 91.8933;
  const locationName = latestReading?.location || 'NE India Monitored Zone';

  return (
    <div className="space-y-6">
      <MapPanel
        latestPrediction={latestPrediction}
        latestReading={latestReading}
        predictions={predictions}
        readings={readings}
        devices={devices}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GovtAlertConsole />
        <IncidentHistoryPanel
          lat={currentLat}
          lng={currentLng}
          siteName={locationName}
        />
      </div>
    </div>
  );
};

export default MapPage;

