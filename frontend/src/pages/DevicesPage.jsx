import React from 'react';
import DeviceStatus from '../components/DeviceStatus';

const DevicesPage = ({ devices = [], latestReading }) => {
  return (
    <div className="space-y-6">
      <DeviceStatus devices={devices} latestReading={latestReading} />
    </div>
  );
};

export default DevicesPage;
