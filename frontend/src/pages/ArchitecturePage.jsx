import React from 'react';
import { Activity, ArrowRight, Brain, CloudRain, Cpu, MonitorCheck, Network, Radio, Server, ShieldAlert } from 'lucide-react';

const ArchitecturePage = () => {
  const steps = [
    {
      num: '01',
      title: 'Field Sensor Layer',
      desc: 'Rain gauge, tilt sensor, soil moisture probe, thermal sensor, and displacement readings.',
      icon: CloudRain,
      color: 'border-blue-100 bg-blue-50 text-blue-700'
    },
    {
      num: '02',
      title: 'Edge Node',
      desc: 'ESP32 acquisition, local buffering, battery health, and payload preparation.',
      icon: Cpu,
      color: 'border-emerald-100 bg-emerald-50 text-emerald-700'
    },
    {
      num: '03',
      title: 'Network Gateway',
      desc: 'Cellular or LoRaWAN transfer of validated telemetry into the Terra Shield API.',
      icon: Radio,
      color: 'border-water-100 bg-water-50 text-water-700'
    },
    {
      num: '04',
      title: 'API Validation',
      desc: 'Range checks, schema validation, persistence, and device status updates.',
      icon: Server,
      color: 'border-earth-100 bg-earth-50 text-earth-700'
    },
    {
      num: '05',
      title: 'AI Risk Model',
      desc: 'Random Forest inference across rainfall, slope, saturation, and movement features.',
      icon: Brain,
      color: 'border-stone-200 bg-stone-50 text-stone-700'
    },
    {
      num: '06',
      title: 'Safety Rules',
      desc: 'Deterministic override layer for physically dangerous boundary conditions.',
      icon: ShieldAlert,
      color: 'border-amber-200 bg-amber-50 text-amber-700'
    },
    {
      num: '07',
      title: 'Monitoring Console',
      desc: 'Live dashboard, Google Maps visualization, alerts, analytics, and station diagnostics.',
      icon: MonitorCheck,
      color: 'border-emerald-100 bg-emerald-50 text-emerald-700'
    }
  ];

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-emerald-800">
          <Network className="h-5 w-5" />
          <h1 className="text-xl font-semibold tracking-tight text-stone-950">Processing Architecture</h1>
        </div>
        <p className="mt-1 text-sm text-stone-600">
          Terra Shield connects field telemetry, AI inference, spatial visualization, and warning operations in one pipeline.
        </p>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-700" />
          <h2 className="text-sm font-semibold text-stone-950">Location to Warning Flow</h2>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <article
                key={step.num}
                className="relative flex min-h-[154px] flex-col justify-between rounded-lg border border-stone-200 bg-stone-50 p-4 transition-colors hover:border-stone-300"
              >
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-mono text-[11px] font-semibold text-stone-500">{step.num}</span>
                    <div className={`rounded-md border p-2 ${step.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-stone-950">{step.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-stone-600">{step.desc}</p>
                </div>

                {index < steps.length - 1 && (
                  <div className="absolute -right-2.5 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-stone-200 bg-white p-1 text-stone-400 xl:block">
                    <ArrowRight className="h-3 w-3" />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default ArchitecturePage;
