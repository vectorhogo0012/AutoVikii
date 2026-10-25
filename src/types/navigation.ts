export type NavigationTab = 
  | 'dashboard' 
  | 'new-inspection' 
  | 'checklist' 
  | 'report'
  | 'archive'
  | 'settings';

export interface NavItemConfig {
  id: NavigationTab;
  label: string;
  shortLabel: string;
  iconName: string;
  badge?: string | number;
}
