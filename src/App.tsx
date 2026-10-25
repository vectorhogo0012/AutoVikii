/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ThemeProvider } from './lib/theme';
import { AppShell } from './components/layout/AppShell';
import { NavigationTab } from './types/navigation';
import { AuthProvider } from './features/auth/AuthContext';
import { InspectionProvider, useInspection } from './features/inspection/InspectionContext';
import { DashboardScreen } from './features/dashboard/DashboardScreen';
import { InspectionEntryScreen } from './features/inspection-entry/InspectionEntryScreen';
import { ChecklistScreen } from './features/checklist/ChecklistScreen';
import { ReportScreen } from './features/report/ReportScreen';
import { ArchiveScreen } from './features/archive/ArchiveScreen';
import { SettingsScreen } from './features/settings/SettingsScreen';
import { ConflictResolutionModal } from './features/sync/ConflictResolutionModal';

function MainApp() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (
        tabParam === 'dashboard' ||
        tabParam === 'new-inspection' ||
        tabParam === 'checklist' ||
        tabParam === 'report' ||
        tabParam === 'archive' ||
        tabParam === 'settings'
      ) {
        return tabParam;
      }
    }
    return 'dashboard';
  });

  const { activeConflict, dismissConflict } = useInspection();

  const handleSelectTab = (tab: NavigationTab) => {
    setCurrentTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <AppShell currentTab={currentTab} onSelectTab={handleSelectTab}>
        {currentTab === 'dashboard' && <DashboardScreen onNavigate={handleSelectTab} />}
        {currentTab === 'new-inspection' && <InspectionEntryScreen onNavigate={handleSelectTab} />}
        {currentTab === 'checklist' && <ChecklistScreen onNavigate={handleSelectTab} />}
        {currentTab === 'report' && <ReportScreen onNavigate={handleSelectTab} />}
        {currentTab === 'archive' && <ArchiveScreen onNavigate={handleSelectTab} />}
        {currentTab === 'settings' && <SettingsScreen />}
      </AppShell>

      {/* Cloud Conflict Resolution Modal */}
      <ConflictResolutionModal
        conflict={activeConflict}
        onClose={dismissConflict}
      />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <InspectionProvider>
          <MainApp />
        </InspectionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
