import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeDashboard } from './components/HomeDashboard';
import { LogoCreator } from './components/LogoCreator';
import { AIAssistant } from './components/AIAssistant';
import { AdStudio } from './components/AdStudio';
import { GrowthTools } from './components/GrowthTools';
import { MyProjects } from './components/MyProjects';
import { UserProfileView } from './components/UserProfile';
import { ProUpgradeModal } from './components/ProUpgradeModal';
import { ToastContainer } from './components/Toast';
import { WelcomeScreen } from './components/WelcomeScreen';

const AppContent: React.FC = () => {
  const { isAuthenticated, activeTab, createSubTab, profileSubTab } = useApp();

  // If user is NOT authenticated: show Welcome screen only.
  // Main app navigation (Header, BottomNav) is not shown.
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#060D19] text-slate-100 flex flex-col font-sans transition-colors duration-200 selection:bg-amber-500 selection:text-slate-950">
        <WelcomeScreen />
        <ToastContainer />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeDashboard />;
      
      case 'create':
        if (createSubTab === 'logo') return <LogoCreator />;
        if (createSubTab === 'flyer') return <AdStudio />;
        return <GrowthTools />;

      case 'advertise':
        return <AdStudio />;

      case 'assistant':
        return <AIAssistant />;

      case 'profile':
        if (profileSubTab === 'projects') return <MyProjects />;
        if (profileSubTab === 'logos') return <MyProjects />;
        if (profileSubTab === 'ads') return <MyProjects />;
        return <UserProfileView />;

      default:
        return <HomeDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#060D19] text-slate-100 flex flex-col font-sans transition-colors duration-200 selection:bg-amber-500 selection:text-slate-950">
      <Header />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28">
        {renderContent()}
      </main>

      <BottomNav />
      <ProUpgradeModal />
      <ToastContainer />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
