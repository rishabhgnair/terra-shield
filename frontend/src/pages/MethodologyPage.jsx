import React from 'react';
import { BookOpen, CheckCircle, HelpCircle, Info } from 'lucide-react';

const MethodologyPage = () => {
  const qaPairs = [
    {
      q: 'What problem does Terra Shield address?',
      a: 'The platform monitors steep, rainfall-prone terrain where landslides can disrupt roads, settlements, and emergency response. It combines live sensor readings, AI risk classification, and map-based warning visibility.'
    },
    {
      q: 'Why combine AI with safety rules?',
      a: 'The Random Forest model captures multi-variable patterns across rainfall, slope, soil saturation, and displacement. Safety rules provide deterministic escalation when a physical threshold is too dangerous to wait for probabilistic scoring.'
    },
    {
      q: 'How are sensor failures handled?',
      a: 'The backend validation layer rejects missing, malformed, or out-of-range telemetry before it reaches the model or database. The UI then communicates stale or unavailable live data clearly.'
    },
    {
      q: 'How does this move toward field deployment?',
      a: 'Physical ESP32 or LoRaWAN nodes can post to the same API schema used by the simulator. Production rollout would add field calibration, disaster authority workflows, historical inventory data, and alert delivery channels.'
    }
  ];

  const pillars = [
    {
      title: '1. IoT Telemetry',
      body: 'Continuous ingestion of precipitation, slope inclination, soil moisture, and ground displacement readings.',
      className: 'text-blue-700'
    },
    {
      title: '2. AI Risk Analysis',
      body: 'Probabilistic classification with transparent feature weights and deterministic safety escalation.',
      className: 'text-emerald-700'
    },
    {
      title: '3. Early Warning',
      body: 'Risk levels, station status, map markers, and alert copy aligned for response teams.',
      className: 'text-amber-700'
    }
  ];

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-emerald-800">
          <BookOpen className="h-5 w-5" />
          <h1 className="text-xl font-semibold tracking-tight text-stone-950">Methodology</h1>
        </div>
        <p className="mt-1 text-sm text-stone-600">
          Technical basis for Terra Shield - AI-powered landslide risk monitoring and early warning.
        </p>
      </section>

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <h3 className="text-sm font-semibold">Deployment Readiness Note</h3>
            <p className="mt-1 text-sm leading-relaxed text-stone-700">
              Terra Shield demonstrates the monitoring workflow. Operational deployment still requires calibrated field sensors,
              local geotechnical sampling, landslide inventory validation, and approval from disaster-management authorities.
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {pillars.map((pillar) => (
          <article key={pillar.title} className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
            <div className={`mb-2 flex items-center gap-2 text-sm font-semibold ${pillar.className}`}>
              <CheckCircle className="h-4 w-4" />
              <span>{pillar.title}</span>
            </div>
            <p className="text-sm leading-relaxed text-stone-600">{pillar.body}</p>
          </article>
        ))}
      </div>

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-950">
          <HelpCircle className="h-4 w-4 text-emerald-700" />
          Operational Questions
        </h2>

        <div className="space-y-2.5">
          {qaPairs.map((item) => (
            <article key={item.q} className="rounded-md border border-stone-200 bg-stone-50 p-3.5">
              <h3 className="text-sm font-semibold text-stone-950">{item.q}</h3>
              <p className="mt-1 text-sm leading-relaxed text-stone-600">{item.a}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default MethodologyPage;
