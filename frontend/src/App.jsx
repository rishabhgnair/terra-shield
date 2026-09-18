import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { useSensorData } from './hooks/useSensorData';

import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import DevicesPage from './pages/DevicesPage';
import MapPage from './pages/MapPage';
import ArchitecturePage from './pages/ArchitecturePage';
import MethodologyPage from './pages/MethodologyPage';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const {
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
    refreshData
  } = useSensorData(5000);

  const renderContent = () => {
    switch (activeTab) {
      case 'analytics':
        return <AnalyticsPage predictions={predictions} readings={readings} />;
      case 'devices':
        return <DevicesPage devices={devices} latestReading={latestReading} />;
      case 'map':
        return (
          <MapPage
            latestPrediction={latestPrediction}
            latestReading={latestReading}
            predictions={predictions}
            readings={readings}
            devices={devices}
          />
        );
      case 'architecture':
        return <ArchitecturePage />;
      case 'methodology':
        return <MethodologyPage />;
      case 'dashboard':
      default:
        return (
          <DashboardPage
            latestReading={latestReading}
            latestPrediction={latestPrediction}
            readings={readings}
            predictions={predictions}
            devices={devices}
            demoScenario={demoScenario}
            loading={loading}
            error={error}
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f7f2] text-stone-900 font-sans">
      
      {/* Top Header Bar */}
      <Header
        isBackendOnline={isBackendOnline}
        lastUpdated={lastUpdated}
        demoScenario={demoScenario}
        onRefresh={refreshData}
      />

      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Navigation Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {renderContent()}
        </main>

      </div>

    </div>
  );
}

export default App;
