import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { api } from '../lib/api';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isEditor: boolean;
  isLoggedIn: boolean;
  hasPermission: (permission: string) => boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { name?: string; bio?: string; avatar?: string; password?: string }) => Promise<void>;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register';
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  isLogoutModalOpen: boolean;
  openLogoutModal: () => void;
  closeLogoutModal: () => void;
  requires2FA: boolean;
  twoFactorUserId: number | null;
  verify2FA: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorUserId, setTwoFactorUserId] = useState<number | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('lesanour_token');

    if (!token) {
      setLoading(false);
      return;
    }

    api.getMe()
      .then((res) => {
        setUser(res.user);
      })
      .catch(() => {
        localStorage.removeItem('lesanour_token');
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (email: string, password: string) => {
    localStorage.removeItem('lesanour_logged_out');
    const res = await api.login({ email, password }) as any;
    
    if (res.require2fa) {
      setRequires2FA(true);
      setTwoFactorUserId(res.userId);
      return;
    }

    localStorage.setItem('lesanour_token', res.token);
    setUser(res.user);
    setIsAuthModalOpen(false);
    showToast(`مرحباً بك مجدداً يا ${res.user.name} 🤍`, 'success');
  };

  const verify2FA = async (token: string) => {
    if (!twoFactorUserId) return;
    try {
      const res = await api.admin.verify2FALogin(twoFactorUserId, token);
      localStorage.setItem('lesanour_token', res.token);
      setUser(res.user);
      setRequires2FA(false);
      setTwoFactorUserId(null);
      setIsAuthModalOpen(false);
      showToast(`تم التحقق بنجاح. مرحباً بك مجدداً يا ${res.user.name} 🤍`, 'success');
    } catch (err: any) {
      throw err;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    localStorage.removeItem('lesanour_logged_out');
    const res = await api.register({ name, email, password });
    localStorage.setItem('lesanour_token', res.token);
    setUser(res.user);
    setIsAuthModalOpen(false);
    showToast(`أهلاً بك في منصة لسه في نور يا ${res.user.name} 🌿`, 'success');
  };

  const logout = () => {
    // Attempt server-side logout for auditing, but don't wait for it to clear local state
    api.logout().catch(() => {});
    
    localStorage.removeItem('lesanour_token');
    localStorage.setItem('lesanour_logged_out', 'true');
    setUser(null);
    showToast('تم تسجيل الخروج بنجاح. دمتم بسلام ونور.', 'info');
  };

  const updateProfile = async (data: { name?: string; bio?: string; avatar?: string; password?: string }) => {
    const res = await api.updateProfile(data);
    setUser(res.user);
    showToast('تم تحديث ملفك الشخصي بنجاح', 'success');
  };

  const openAuthModal = (tab: 'login' | 'register' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setRequires2FA(false);
    setTwoFactorUserId(null);
  };

  const openLogoutModal = () => {
    setIsLogoutModalOpen(true);
  };

  const closeLogoutModal = () => {
    setIsLogoutModalOpen(false);
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const isEditor = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'EDITOR' || (user?.permissions?.includes('content.view') ?? false);
  const isLoggedIn = !!user;

  const hasPermission = (permission: string) => {
    if (isSuperAdmin) return true;
    return user?.permissions?.includes(permission) || false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        isSuperAdmin,
        isEditor,
        isLoggedIn,
        hasPermission,
        login,
        register,
        logout,
        updateProfile,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        isLogoutModalOpen,
        openLogoutModal,
        closeLogoutModal,
        requires2FA,
        twoFactorUserId,
        verify2FA
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
