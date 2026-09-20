import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { api } from '../lib/api';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginAsFatmaAdmin: () => Promise<void>;
  logout: () => void;
  updateProfile: (data: { name?: string; bio?: string; avatar?: string; password?: string }) => Promise<void>;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register';
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const { showToast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('lesanour_token');
    const hasExplicitlyLoggedOut = localStorage.getItem('lesanour_logged_out') === 'true';

    if (!token && !hasExplicitlyLoggedOut) {
      // Auto-activate Fatma Mohamed's Admin session on first load
      api.quickAdminLogin('fatmamohamed36699@gmail.com')
        .then((res) => {
          localStorage.setItem('lesanour_token', res.token);
          setUser(res.user);
          showToast('أهلاً بكِ يا أستاذة فاطمة، تم تفعيل كامل صلاحيات الإدارة والتحكم 🛡️✨', 'success');
        })
        .catch(() => {
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
      return;
    }

    if (!token) {
      setLoading(false);
      return;
    }

    api.getMe()
      .then((res) => {
        setUser(res.user);
      })
      .catch(() => {
        // If expired, try quick admin login if not explicitly logged out
        if (!hasExplicitlyLoggedOut) {
          api.quickAdminLogin('fatmamohamed36699@gmail.com')
            .then((res) => {
              localStorage.setItem('lesanour_token', res.token);
              setUser(res.user);
            })
            .catch(() => {
              localStorage.removeItem('lesanour_token');
              setUser(null);
            })
            .finally(() => {
              setLoading(false);
            });
        } else {
          localStorage.removeItem('lesanour_token');
          setUser(null);
          setLoading(false);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const loginAsFatmaAdmin = async () => {
    localStorage.removeItem('lesanour_logged_out');
    const res = await api.quickAdminLogin('fatmamohamed36699@gmail.com');
    localStorage.setItem('lesanour_token', res.token);
    setUser(res.user);
    setIsAuthModalOpen(false);
    showToast('أهلاً بكِ يا فاطمة، تم تفعيل كامل صلاحيات المدير العام 🛡️✨', 'success');
  };

  const login = async (email: string, password: string) => {
    localStorage.removeItem('lesanour_logged_out');
    const res = await api.login({ email, password });
    localStorage.setItem('lesanour_token', res.token);
    setUser(res.user);
    setIsAuthModalOpen(false);
    showToast(`مرحباً بك مجدداً يا ${res.user.name} 🤍`, 'success');
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
  };

  const isAdmin = user?.role === 'ADMIN';
  const isEditor = user?.role === 'ADMIN' || user?.role === 'EDITOR';
  const isLoggedIn = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        isEditor,
        isLoggedIn,
        login,
        register,
        loginAsFatmaAdmin,
        logout,
        updateProfile,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal
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
