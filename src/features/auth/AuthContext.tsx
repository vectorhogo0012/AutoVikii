import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '../../lib/firebase/firebase';
import { Workspace } from '../../types/workspace';
import { workspaceService } from '../../lib/firebase/workspaceService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  activeWorkspace: Workspace | null;
  workspaces: Workspace[];
  authLoading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  createNewWorkspace: (name: string) => Promise<Workspace>;
  refreshWorkspaces: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACTIVE_WORKSPACE_KEY = 'karshenas_active_workspace_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const loadUserWorkspaces = useCallback(async (currentUser: User) => {
    try {
      let list = await workspaceService.getUserWorkspaces(currentUser.uid);

      // If user has no workspace yet, auto-provision their first dealership workspace
      if (list.length === 0) {
        const defaultName = currentUser.displayName
          ? `مرکز کارشناسی ${currentUser.displayName}`
          : 'مرکز کارشناسی خودرو پایتخت';

        const created = await workspaceService.createWorkspace(
          defaultName,
          currentUser.uid,
          currentUser.email || 'user@example.com',
          currentUser.displayName || 'کارشناس رسمی'
        );
        list = [created];
      }

      setWorkspaces(list);

      // Restore previously selected workspace or choose first
      let chosen: Workspace | null = null;
      try {
        const savedWsId = localStorage.getItem(ACTIVE_WORKSPACE_KEY);
        if (savedWsId) {
          chosen = list.find(w => w.id === savedWsId) || null;
        }
      } catch {
        // Ignore
      }

      if (!chosen && list.length > 0) {
        chosen = list[0];
      }

      setActiveWorkspace(chosen);
      if (chosen) {
        try {
          localStorage.setItem(ACTIVE_WORKSPACE_KEY, chosen.id);
        } catch {
          // Ignore
        }
      }
    } catch (err) {
      console.warn('Failed to load user workspaces:', err);
    }
  }, []);

  useEffect(() => {
    if (!auth || typeof auth.onAuthStateChanged !== 'function') {
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      setUser(currentUser);
      if (currentUser) {
        await loadUserWorkspaces(currentUser);
      } else {
        setActiveWorkspace(null);
        setWorkspaces([]);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [loadUserWorkspaces]);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      console.warn('Google sign in error:', err);
      const message = err instanceof Error ? err.message : 'خطا در احراز هویت با گوگل';
      setAuthError(message.includes('popup-closed-by-user') ? 'پنجره ورود توسط کاربر بسته شد.' : 'ورود با حساب گوگل با خطا مواجه شد.');
      throw err;
    }
  }, []);

  const signOutUser = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
      setActiveWorkspace(null);
      try {
        localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
      } catch {
        // Ignore
      }
    } catch (err) {
      console.warn('Sign out error:', err);
    }
  }, []);

  const switchWorkspace = useCallback(async (workspaceId: string) => {
    const found = workspaces.find(w => w.id === workspaceId);
    if (found) {
      setActiveWorkspace(found);
      try {
        localStorage.setItem(ACTIVE_WORKSPACE_KEY, found.id);
      } catch {
        // Ignore
      }
    }
  }, [workspaces]);

  const createNewWorkspace = useCallback(async (name: string): Promise<Workspace> => {
    if (!user) throw new Error('کاربر وارد نشده است.');
    const created = await workspaceService.createWorkspace(
      name,
      user.uid,
      user.email || '',
      user.displayName || 'کارشناس'
    );
    setWorkspaces(prev => [...prev, created]);
    setActiveWorkspace(created);
    try {
      localStorage.setItem(ACTIVE_WORKSPACE_KEY, created.id);
    } catch {
      // Ignore
    }
    return created;
  }, [user]);

  const refreshWorkspaces = useCallback(async () => {
    if (user) {
      await loadUserWorkspaces(user);
    }
  }, [user, loadUserWorkspaces]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        activeWorkspace,
        workspaces,
        authLoading,
        authError,
        signInWithGoogle,
        signOutUser,
        switchWorkspace,
        createNewWorkspace,
        refreshWorkspaces,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
