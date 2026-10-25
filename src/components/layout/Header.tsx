import React, { useState } from 'react';
import {
  Sun,
  Moon,
  ShieldCheck,
  Download,
  UserCheck,
  CheckCircle2,
  Loader2,
  AlertCircle,
  WifiOff,
  Cloud,
  RefreshCw,
  Building2,
  LogIn,
  LogOut,
  Plus,
} from 'lucide-react';
import { useTheme } from '../../lib/theme';
import { usePWAInstall } from '../../lib/pwa';
import { useInspection } from '../../features/inspection/InspectionContext';
import { useAuth } from '../../features/auth/AuthContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';

export interface HeaderProps {
  currentTabTitle?: string;
  inspectorName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentTabTitle,
  inspectorName = 'مهندس کمالی',
}) => {
  const { theme, toggleTheme } = useTheme();
  const { isInstallable, promptInstall } = usePWAInstall();
  const { saveStatus, isOnline, cloudSyncState, triggerCloudSync } = useInspection();
  const { user, isAuthenticated, activeWorkspace, workspaces, signInWithGoogle, signOutUser, switchWorkspace, createNewWorkspace } = useAuth();

  const [showWorkspaceDialog, setShowWorkspaceDialog] = useState<boolean>(false);
  const [newWsName, setNewWsName] = useState<string>('');
  const [isCreatingWs, setIsCreatingWs] = useState<boolean>(false);
  const [authErrorAlert, setAuthErrorAlert] = useState<string | null>(null);

  const handleCreateWorkspace = async () => {
    if (!newWsName.trim()) return;
    setIsCreatingWs(true);
    try {
      await createNewWorkspace(newWsName.trim());
      setNewWsName('');
      setShowWorkspaceDialog(false);
    } finally {
      setIsCreatingWs(false);
    }
  };

  const handleSignIn = async () => {
    setAuthErrorAlert(null);
    try {
      await signInWithGoogle();
    } catch {
      setAuthErrorAlert('ورود انجام نشد یا پنجره ورود بسته شد.');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/80 dark:border-emerald-950/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white shadow-sm shadow-emerald-700/20 shrink-0">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                سامانه کارشناسی خودرو
              </h1>
              {activeWorkspace ? (
                <button
                  type="button"
                  onClick={() => setShowWorkspaceDialog(true)}
                  className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold hover:border-emerald-400 transition-colors"
                >
                  <Building2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="truncate max-w-[140px]">{activeWorkspace.name}</span>
                </button>
              ) : (
                <Badge variant="success" size="sm">
                  نسخه کارشناسی
                </Badge>
              )}
            </div>
            {currentTabTitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {currentTabTitle}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls & Autosave / Sync Indicator */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Offline indicator if disconnected */}
          {!isOnline && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 font-semibold">
              <WifiOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="hidden sm:inline">آفلاین (ذخیره محلی فعال)</span>
              <span className="sm:hidden">آفلاین</span>
            </div>
          )}

          {/* Cloud Sync State Pill */}
          {isOnline && (
            <button
              type="button"
              onClick={() => triggerCloudSync()}
              title="همگام‌سازی با فضای ابری Firebase"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100/70 dark:bg-emerald-950/40 border border-slate-200/60 dark:border-emerald-900/40 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:border-emerald-500 transition-colors"
            >
              {cloudSyncState === 'syncing' || saveStatus === 'syncing' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">همگام‌سازی ابری...</span>
                </>
              ) : cloudSyncState === 'error' || saveStatus === 'error' ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-rose-600 dark:text-rose-400 hidden sm:inline">خطای اتصال ابری</span>
                  <span className="text-rose-600 dark:text-rose-400 sm:hidden">خطا</span>
                </>
              ) : cloudSyncState === 'conflict' ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-amber-600 dark:text-amber-400">تداخل نسخه‌ها</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">همگام با سرور ابری</span>
                  <span className="sm:hidden">ابری</span>
                </>
              )}
            </button>
          )}

          {/* Authentication & User Button */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowWorkspaceDialog(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/70 dark:bg-emerald-950/40 border border-slate-200/60 dark:border-emerald-900/30 text-xs hover:border-emerald-500 transition-colors"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-4 h-4 rounded-full" />
                ) : (
                  <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                )}
                <span className="text-slate-700 dark:text-slate-200 font-semibold truncate max-w-[120px]">
                  {user.displayName || inspectorName}
                </span>
              </button>

              <button
                type="button"
                onClick={signOutUser}
                title="خروج از حساب کاربری"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-emerald-950/50 transition-colors"
                aria-label="خروج از حساب کاربری"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignIn}
              leftIcon={<LogIn className="w-3.5 h-3.5" />}
              className="text-xs h-9 shrink-0"
              aria-label="ورود با حساب گوگل"
            >
              <span className="hidden sm:inline">ورود با گوگل</span>
              <span className="sm:hidden">ورود</span>
            </Button>
          )}

          {/* PWA Install Button if available */}
          {isInstallable && (
            <Button
              variant="outline"
              size="sm"
              onClick={promptInstall}
              leftIcon={<Download className="w-3.5 h-3.5" />}
              className="hidden lg:inline-flex text-xs"
            >
              نصب برنامه
            </Button>
          )}

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'تغییر به تم روشن' : 'تغییر به تم تاریک'}
            className="w-10 h-10 rounded-xl border border-slate-200 dark:border-emerald-900/50 bg-white/80 dark:bg-[#111e17] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-emerald-950/50 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 min-h-[44px] min-w-[44px]"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>
        </div>
      </div>

      {/* Workspace Management Dialog */}
      <Dialog
        isOpen={showWorkspaceDialog}
        onClose={() => setShowWorkspaceDialog(false)}
        title="مدیریت فضای کاری و نمایندگی"
        description="فضای کاری فعال، اعضا و همگام‌سازی ابری پرونده‌ها"
        maxWidth="md"
        footer={
          <Button variant="outline" size="sm" onClick={() => setShowWorkspaceDialog(false)}>
            بستن پنجره
          </Button>
        }
      >
        <div className="space-y-4 text-right">
          {/* User profile card */}
          {user && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0c1611] border border-slate-200 dark:border-emerald-900/40 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full border border-emerald-500/30" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold">
                    {user.displayName?.[0] || 'U'}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">
                    {user.displayName || 'کاربر کارشناسی'}
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-latin-num">
                    {user.email}
                  </span>
                </div>
              </div>
              <Badge variant="success" size="sm">
                احراز هویت شده
              </Badge>
            </div>
          )}

          {/* Workspaces List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
              فضاهای کاری شما ({workspaces.length})
            </h4>
            <div className="space-y-2">
              {workspaces.map(ws => {
                const isActive = activeWorkspace?.id === ws.id;
                return (
                  <div
                    key={ws.id}
                    onClick={() => {
                      switchWorkspace(ws.id);
                      setShowWorkspaceDialog(false);
                    }}
                    className={`p-3 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                      isActive
                        ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40'
                        : 'border-slate-200 dark:border-emerald-950 bg-white dark:bg-[#111e17] hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {ws.name}
                      </h5>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        کد فضای کاری: <span className="font-latin-num font-semibold">{ws.code}</span>
                      </span>
                    </div>
                    {isActive && (
                      <Badge variant="success" size="sm">
                        فضای کاری فعال
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Create New Workspace */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0c1611] border border-slate-200 dark:border-emerald-900/40 space-y-3">
            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              ایجاد فضای کاری جدید برای مرکز یا نمایندگی
            </h5>
            <div className="flex items-center gap-2">
              <Input
                placeholder="عنوان مرکز (مثلاً نمایندگی مرکزی غرب)..."
                value={newWsName}
                onChange={e => setNewWsName(e.target.value)}
                className="h-9 text-xs"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateWorkspace}
                isLoading={isCreatingWs}
                disabled={!newWsName.trim()}
                leftIcon={<Plus className="w-4 h-4" />}
                className="shrink-0 h-9"
              >
                ایجاد مرکز
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </header>
  );
};
