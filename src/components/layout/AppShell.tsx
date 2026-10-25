import React from 'react';
import { NavigationTab } from '../../types/navigation';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { DesktopNav } from './DesktopNav';

export interface AppShellProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentTab,
  onSelectTab,
  children,
}) => {
  const tabTitles: Record<NavigationTab, string> = {
    dashboard: 'داشبورد کارشناسی',
    'new-inspection': 'پذیرش و مشخصات خودرو',
    checklist: 'چک‌لیست بررسی فنی و بدنه',
    report: 'پیش‌نمایش گزارش و صدور گواهی',
    archive: 'بایگانی و جستجوی کارشناسی‌ها',
    settings: 'تنظیمات و سفارشی‌سازی',
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-canvas text-surface-text selection:bg-emerald-500 selection:text-white pb-20 md:pb-8">
      {/* Sticky Glass Header */}
      <Header currentTabTitle={tabTitles[currentTab]} />

      {/* Desktop Sub-Header Navigation Bar */}
      <div className="hidden md:block w-full border-b border-slate-200/60 dark:border-emerald-950/60 bg-white/50 dark:bg-[#0c1611]/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <DesktopNav currentTab={currentTab} onSelectTab={onSelectTab} />
        </div>
      </div>

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {children}
      </main>

      {/* Mobile Fixed Bottom Navigation */}
      <BottomNav currentTab={currentTab} onSelectTab={onSelectTab} />
    </div>
  );
};
