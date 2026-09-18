import React from 'react';
import { BatteryCharging, CloudRain, Compass, Droplets, Move, Thermometer } from 'lucide-react';

const statusTone = {
  NORMAL: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ELEVATED: 'bg-amber-50 text-amber-700 border-amber-200',
  CRITICAL: 'bg-red-50 text-red-700 border-red-200',
  GOOD: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'LOW POWER': 'bg-red-50 text-red-700 border-red-200'
};

const SensorCard = ({ reading }) => {
  const rainfall = reading?.rainfall ?? 0;
  const slope = reading?.slope ?? 0;
  const soilMoisture = reading?.soil_moisture ?? 0;
  const groundMovement = reading?.ground_movement ?? 0;
  const temperature = reading?.temperature ?? 25;
  const battery = reading?.battery ?? 100;

  const metrics = [
    {
      title: 'Rainfall',
      value: rainfall,
      unit: 'mm',
      subtitle: '24h precipitation',
      icon: CloudRain,
      status: rainfall > 80 ? 'CRITICAL' : rainfall > 35 ? 'ELEVATED' : 'NORMAL',
      iconClass: 'bg-blue-50 text-blue-700 border-blue-100'
    },
    {
      title: 'Slope Angle',
      value: slope,
      unit: 'deg',
      subtitle: 'Terrain gradient',
      icon: Compass,
      status: slope > 40 ? 'CRITICAL' : slope > 25 ? 'ELEVATED' : 'NORMAL',
      iconClass: 'bg-earth-50 text-earth-700 border-earth-100'
    },
    {
      title: 'Soil Moisture',
      value: soilMoisture,
      unit: '%',
      subtitle: 'Volumetric water',
      icon: Droplets,
      status: soilMoisture > 75 ? 'CRITICAL' : soilMoisture > 45 ? 'ELEVATED' : 'NORMAL',
      iconClass: 'bg-water-50 text-water-700 border-water-100'
    },
    {
      title: 'Displacement',
      value: groundMovement,
      unit: 'mm',
      subtitle: 'Shear movement',
      icon: Move,
      status: groundMovement > 5.0 ? 'CRITICAL' : groundMovement > 1.5 ? 'ELEVATED' : 'NORMAL',
      iconClass: 'bg-orange-50 text-orange-700 border-orange-100'
    },
    {
      title: 'Temperature',
      value: temperature,
      unit: 'deg C',
      subtitle: 'Ambient thermal',
      icon: Thermometer,
      status: 'NORMAL',
      iconClass: 'bg-stone-50 text-stone-700 border-stone-200'
    },
    {
      title: 'Battery',
      value: battery,
      unit: '%',
      subtitle: 'Edge node power',
      icon: BatteryCharging,
      status: battery < 20 ? 'LOW POWER' : 'GOOD',
      iconClass: 'bg-emerald-50 text-emerald-700 border-emerald-100'
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <div
            key={metric.title}
            className="flex min-h-[126px] flex-col justify-between rounded-lg border border-stone-200 bg-white p-3.5 shadow-sm transition-colors hover:border-stone-300"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">{metric.title}</p>
                <p className="mt-0.5 text-[11px] text-stone-500">{metric.subtitle}</p>
              </div>
              <div className={`rounded-md border p-1.5 ${metric.iconClass}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-3">
              <span className="font-mono text-2xl font-semibold tabular-nums text-stone-950">{metric.value}</span>
              <span className="ml-1 font-mono text-xs text-stone-500">{metric.unit}</span>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2">
              <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${statusTone[metric.status]}`}>
                {metric.status}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SensorCard;
