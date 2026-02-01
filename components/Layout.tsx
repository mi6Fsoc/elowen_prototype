
import React from 'react';
import { AppView } from '../types';
import { 
  HomeIcon, 
  CalendarIcon, 
  ChartBarIcon, 
  ChatBubbleLeftRightIcon, 
  UserCircleIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: React.ReactNode;
  activeView: AppView;
  onViewChange: (view: AppView) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeView, onViewChange }) => {
  const navItems = [
    { id: 'home', icon: HomeIcon, label: 'Home' },
    { id: 'routine', icon: CalendarIcon, label: 'Routine' },
    { id: 'progress', icon: ChartBarIcon, label: 'Progress' },
    { id: 'chat', icon: ChatBubbleLeftRightIcon, label: 'Coach' },
    { id: 'library', icon: BookOpenIcon, label: 'Learn' },
    { id: 'profile', icon: UserCircleIcon, label: 'Profile' },
  ];

  if (activeView === 'onboarding') return <div className="min-h-screen bg-cream dark:bg-[#1E1E1E]">{children}</div>;

  return (
    <div className="min-h-screen bg-cream dark:bg-[#1E1E1E] pb-32 flex flex-col items-center transition-colors duration-300">
      <header className="w-full max-w-lg px-6 pt-12 pb-6 flex justify-between items-center bg-cream/80 dark:bg-[#1E1E1E]/80 backdrop-blur-md sticky top-0 z-40">
        <h1 className="text-3xl font-serif text-charcoal dark:text-white tracking-widest uppercase">ELOWEN</h1>
        <button 
          aria-label="User Profile"
          className="w-11 h-11 rounded-full bg-blush flex items-center justify-center text-sm font-serif italic text-charcoal shadow-sm hover:scale-105 transition-transform"
        >
          M
        </button>
      </header>
      
      <main className="w-full max-w-lg px-6 animate-in fade-in duration-500">
        {children}
      </main>

      <nav className="fixed bottom-6 w-[94%] max-w-lg bg-white/95 dark:bg-[#252525]/95 backdrop-blur-xl border border-sage/10 dark:border-white/5 px-2 py-2 flex justify-around items-center z-40 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2.5rem] left-1/2 -translate-x-1/2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as AppView)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center transition-all duration-300 min-w-[54px] min-h-[54px] justify-center rounded-full ${
                isActive 
                  ? 'text-white bg-charcoal dark:bg-sage dark:text-charcoal shadow-lg scale-105' 
                  : 'text-gray-400 dark:text-gray-500 hover:text-sage'
              }`}
            >
              <Icon className="w-6 h-6" />
            </button>
          );
        })}
      </nav>
    </div>
  );
};
