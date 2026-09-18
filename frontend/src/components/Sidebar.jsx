import React from 'react';
import { BarChart3, BookOpen, Cpu, LayoutDashboard, MapPin, Network } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Risk Analytics', icon: BarChart3 },
    { id: 'devices', label: 'Sensor Fleet', icon: Cpu },
    { id: 'map', label: 'Risk Map', icon: MapPin },
    { id: 'architecture', label: 'Architecture', icon: Network },
    { id: 'methodology', label: 'Methodology', icon: BookOpen }
  ];

  return (
    <aside className="w-full shrink-0 border-b border-stone-200 bg-[#fbfaf6] p-3 md:w-60 md:border-b-0 md:border-r">
      <nav className="flex gap-1.5 overflow-x-auto pb-1 md:flex-col md:overflow-x-visible md:pb-0">
        <div className="hidden px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500 md:block">
          Monitoring
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-950'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-emerald-50' : 'text-stone-500'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-8 hidden rounded-lg border border-stone-200 bg-white p-3.5 md:block">
        <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-stone-700">
          <span>Coverage</span>
          <span className="font-mono text-emerald-700">NER India</span>
        </div>
        <p className="text-[11px] leading-relaxed text-stone-500">
          Monitoring rainfall, slope gradient, soil saturation, and ground displacement from field sensor nodes.
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
