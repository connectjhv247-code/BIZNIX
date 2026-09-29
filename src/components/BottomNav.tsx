import React from 'react';
import { 
  Home, 
  Palette, 
  Megaphone, 
  Bot, 
  UserCircle 
} from 'lucide-react';
import { useApp, MainNavTab } from '../context/AppContext';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const navItems: { id: MainNavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'create', label: 'Create', icon: Palette },
    { id: 'advertise', label: 'Advertise', icon: Megaphone },
    { id: 'assistant', label: 'Assistant', icon: Bot },
    { id: 'profile', label: 'Profile', icon: UserCircle },
  ];

  return (
    <nav 
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#081220]/95 backdrop-blur-xl border-t border-amber-500/20 shadow-[0_-8px_30px_rgba(0,0,0,0.7)] py-2 px-4 safe-area-pb"
    >
      <div className="max-w-md mx-auto flex items-center justify-between">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id}`}
              onClick={() => {
                setActiveTab(item.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-200 cursor-pointer ${
                isActive 
                  ? 'text-amber-400 font-extrabold scale-105' 
                  : 'text-sky-300/60 hover:text-sky-200'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${
                isActive 
                  ? 'bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/60 shadow-lg shadow-amber-500/20' 
                  : ''
              }`}>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
              </div>
              <span className="text-[10px] mt-1 uppercase tracking-wider font-bold">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
