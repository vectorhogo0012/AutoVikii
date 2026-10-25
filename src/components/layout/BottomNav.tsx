import React from 'react';
import { LayoutDashboard, FilePlus2, ClipboardCheck, FileText, FolderArchive, Settings } from 'lucide-react';
import { NavigationTab } from '../../types/navigation';
import { cn } from '../../lib/utils';

export interface BottomNavProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const navItems = [
    { id: 'dashboard' as NavigationTab, label: 'داشبورد', icon: LayoutDashboard },
    { id: 'new-inspection' as NavigationTab, label: 'پذیرش', icon: FilePlus2 },
    { id: 'checklist' as NavigationTab, label: 'چک‌لیست', icon: ClipboardCheck },
    { id: 'report' as NavigationTab, label: 'گزارش', icon: FileText },
    { id: 'archive' as NavigationTab, label: 'بایگانی', icon: FolderArchive },
    { id: 'settings' as NavigationTab, label: 'تنظیمات', icon: Settings },
  ];

  return (
    <nav
      aria-label="ناوبری اصلی"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-slate-200/80 dark:border-emerald-950/80 px-1 py-1 shadow-lg"
    >
      <div className="flex items-center justify-around">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all duration-150 min-h-[46px] min-w-[50px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
                isActive
                  ? 'text-emerald-700 dark:text-emerald-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              <div
                className={cn(
                  'p-1 rounded-lg transition-colors',
                  isActive
                    ? 'bg-emerald-100/80 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                    : 'text-current'
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
