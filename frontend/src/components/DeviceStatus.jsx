import React, { useState } from 'react';
import { BatteryCharging, Clock, Cpu, MapPin, Radio, Send, Wifi } from 'lucide-react';
import { monitoringSites } from '../data/monitoringSites';
import { formatTimestamp } from '../utils/formatters';
import apiClient from '../services/api';

const DeviceStatus = ({ devices = [], latestReading }) => {
  const [pingingId, setPingingId] = useState(null);
  const [pingMessage, setPingMessage] = useState(null);

  const defaultDevices = monitoringSites.slice(0, 4).map((site, index) => ({
    device_id: site.deviceId,
    site_id: site.id,
    location: `${site.name}, ${site.state}`,
    latitude: site.lat,
    longitude: site.lng,
    status: index < 3 ? 'Online' : 'Standby',
    battery: index === 0 ? latestReading?.battery ?? 86 : [92, 78, 95][index - 1],
    signal_quality: ['Excellent (-64 dBm)', 'Good (-72 dBm)', 'Good (-78 dBm)', 'Fair (-84 dBm)'][index],
    last_seen: index === 0 ? latestReading?.timestamp : new Date().toISOString()
  }));

  const displayList = devices.length > 0 ? devices : defaultDevices;
  const onlineCount = displayList.filter((device) => device.status === 'Online').length;

  const handleSendPing = async (device) => {
    setPingingId(device.device_id);
    setPingMessage(null);
    try {
      const res = await apiClient.post('/sensor-data', {
        device_id: device.device_id,
        site_id: device.site_id || 'NER-SITE-001',
        rainfall: Number((Math.random() * 40 + 10).toFixed(1)),
        slope: Number((Math.random() * 15 + 25).toFixed(1)),
        soil_moisture: Number((Math.random() * 30 + 40).toFixed(1)),
        ground_movement: Number((Math.random() * 1.5).toFixed(2)),
        temperature: Number((Math.random() * 8 + 18).toFixed(1)),
        battery: device.battery || 85,
        latitude: device.latitude,
        longitude: device.longitude
      });

      if (res.data?.success) {
        setPingMessage({ id: device.device_id, text: `Ping sent! Risk assessed as ${res.data.risk_level}` });
      }
    } catch (err) {
      setPingMessage({ id: device.device_id, text: `Ping failed: ${err.message}` });
    } finally {
      setPingingId(null);
    }
  };

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-stone-950">Sensor Fleet</h2>
          <p className="mt-1 text-sm text-stone-600">Edge node health, location, power, and live ping controls.</p>
        </div>
        <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-mono text-xs font-semibold text-emerald-700">
          {onlineCount} active nodes
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {displayList.map((device) => {
          const isOnline = device.status === 'Online';
          const isPinging = pingingId === device.device_id;
          return (
            <article
              key={device.device_id}
              className="rounded-lg border border-stone-200 bg-stone-50 p-4 transition-colors hover:border-stone-300 flex flex-col justify-between"
            >
              <div>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="rounded-md border border-emerald-100 bg-emerald-50 p-2 text-emerald-700">
                      <Cpu className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm font-semibold text-stone-950">{device.device_id}</p>
                      <p className="font-mono text-[11px] text-stone-500">{device.site_id}</p>
                    </div>
                  </div>
                  <span
                    className={`rounded border px-2 py-0.5 font-mono text-[10px] font-semibold ${
                      isOnline
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-amber-200 bg-amber-50 text-amber-700'
                    }`}
                  >
                    {device.status}
                  </span>
                </div>

                <div className="flex items-start gap-2 text-sm text-stone-600 mb-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                  <span>{device.location}</span>
                </div>
              </div>

              <div>
                {pingMessage?.id === device.device_id && (
                  <div className="mb-2 rounded border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-800">
                    {pingMessage.text}
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-stone-200 pt-3 text-xs">
                  <div className="flex items-center gap-3 text-stone-600">
                    <div className="flex items-center gap-1">
                      <BatteryCharging className="h-3.5 w-3.5 text-emerald-700" />
                      <strong className="font-mono text-stone-900">{device.battery}%</strong>
                    </div>
                    <div className="flex items-center gap-1">
                      <Wifi className="h-3.5 w-3.5 text-blue-700" />
                      <span className="truncate text-[11px] text-stone-700">{device.signal_quality || 'Good'}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSendPing(device)}
                    disabled={isPinging}
                    className="flex items-center gap-1 rounded border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-stone-800 shadow-sm hover:bg-stone-100 transition disabled:opacity-50"
                  >
                    <Radio className={`h-3 w-3 text-emerald-700 ${isPinging ? 'animate-pulse' : ''}`} />
                    {isPinging ? 'Pinging...' : 'Send Test Ping'}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default DeviceStatus;

