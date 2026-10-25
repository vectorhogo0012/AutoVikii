import React from 'react';
import { LayoutDashboard, FilePlus2, ClipboardCheck, FileText, FolderArchive, Settings } from 'lucide-react';
import { NavigationTab } from '../../types/navigation';
import { cn } from '../../lib/utils';

export interface DesktopNavProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

export const DesktopNav: React.FC<DesktopNavProps> = ({ currentTab, onSelectTab }) => {
  const navItems = [
    { id: 'dashboard' as NavigationTab, label: 'داشبورد کارشناسی', icon: LayoutDashboard },
    { id: 'new-inspection' as NavigationTab, label: 'پذیرش خودرو', icon: FilePlus2 },
    { id: 'checklist' as NavigationTab, label: 'چک‌لیست بازرسی', icon: ClipboardCheck },
    { id: 'report' as NavigationTab, label: 'گزارش و گواهی', icon: FileText },
    { id: 'archive' as NavigationTab, label: 'بایگانی پرونده‌ها', icon: FolderArchive },
    { id: 'settings' as NavigationTab, label: 'تنظیمات سامانه', icon: Settings },
  ];

  return (
    <nav aria-label="منوی دسکتاپ" className="hidden md:flex items-center gap-1.5 py-2">
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectTab(item.id)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl text-xs lg:text-sm font-medium transition-all duration-150 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
              isActive
                ? 'bg-emerald-600 text-white dark:bg-emerald-500/20 dark:text-emerald-300 dark:border dark:border-emerald-500/40 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-emerald-950/40 hover:text-slate-900 dark:hover:text-slate-100'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
