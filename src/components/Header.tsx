import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu,
  X,
  Search,
  Bookmark,
  User as UserIcon,
  Shield,
  LogOut,
  ChevronDown,
  Sparkles,
  Heart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { getFavoritesCount, onFavoritesChanged } from '../lib/favorites';

export function Header({
  currentPath,
  onNavigate,
  onOpenMoodModal,
  onOpenQuoteModal
}: {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenMoodModal?: () => void;
  onOpenQuoteModal?: () => void;
}) {
  const { user, isLoggedIn, isEditor, isAdmin, openAuthModal, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(0);

  const updateBookmarkCount = useCallback(() => {
    const localCount = getFavoritesCount();
    if (isLoggedIn) {
      api.getBookmarks()
        .then((res) => {
          const srvCount = res.bookmarks?.length || 0;
          setBookmarkCount(Math.max(localCount, srvCount));
        })
        .catch(() => setBookmarkCount(localCount));
    } else {
      setBookmarkCount(localCount);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    updateBookmarkCount();
    const unsub = onFavoritesChanged(() => {
      updateBookmarkCount();
    });
    return unsub;
  }, [updateBookmarkCount, currentPath]);

  const navLinks = [
    { title: 'الرئيسية', path: '/' },
    { title: 'الموضوعات', path: '/articles' },
    { title: 'الفيديوهات', path: '/videos' },
    { title: 'رسائل لسه في نور', path: '/messages' },
    { title: 'رحلة التعافي', path: '/journeys' },
    { title: 'البودكاست', path: '/podcast' },
    { title: 'رفيق النور (AI)', path: '/chat' },
    { title: 'احكي لنا', path: '/tell-us' },
    { title: 'من نحن', path: '/about' }
  ];

  const handleNav = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#E7E2D8] transition-all" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => handleNav('/')}
              className="flex items-center gap-3 text-right group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#36533D] text-white flex items-center justify-center shadow-md shadow-[#36533D]/20 group-hover:scale-105 transition-all">
                <Sparkles className="w-5 h-5 text-amber-200" />
              </div>
              <div>
                <span className="font-heading font-bold text-xl md:text-2xl text-stone-900 tracking-tight block leading-none">
                  لسه في نور
                </span>
                <span className="text-[11px] text-stone-500 font-medium hidden sm:block mt-1">
                  مساحة للتعافي والسكينة
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path || (link.path !== '/' && currentPath.startsWith(link.path));
              return (
                <button
                  key={link.path}
                  onClick={() => handleNav(link.path)}
                  className={`px-3 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'text-[#36533D] bg-[#36533D]/8 font-extrabold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/40'
                  }`}
                >
                  {link.title}
                </button>
              );
            })}
          </nav>

          {/* Action Icons & User Control */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Gemini Chatbot Direct Trigger */}
            <button
              onClick={() => handleNav('/chat')}
              id="header-chat-button"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                currentPath === '/chat'
                  ? 'bg-[#36533D] text-white'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300/70'
              }`}
              title="رفيق النور الذكي (Gemini AI)"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">رفيق النور</span>
            </button>

            {/* Mood Selector Trigger */}
            {onOpenMoodModal && (
              <button
                onClick={onOpenMoodModal}
                id="header-mood-button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#36533D]/10 hover:bg-[#36533D]/15 text-[#36533D] border border-[#36533D]/20 transition-all cursor-pointer shadow-2xs"
                title="اختر حالتك المزاجية قبل القراءة"
              >
                <span className="text-sm">🌿</span>
                <span className="hidden sm:inline">حالتك المزاجية</span>
              </button>
            )}

            {/* Inspiring Random Quote Trigger */}
            {onOpenQuoteModal && (
              <button
                onClick={onOpenQuoteModal}
                id="header-quote-button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/70 transition-all cursor-pointer shadow-2xs"
                title="قبس من النور - اقتباس ملهم لقلبك"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">قبس نور</span>
              </button>
            )}

            {/* Global Search button */}
            <button
              onClick={() => handleNav('/search')}
              className="p-2.5 text-stone-600 hover:text-stone-900 hover:bg-stone-200/40 rounded-xl transition-colors cursor-pointer"
              title="البحث الشامل"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Bookmarks link (always available for local & saved favorites) */}
            <button
              onClick={() => handleNav('/bookmarks')}
              id="header-bookmarks-btn"
              className="relative p-2.5 text-stone-600 hover:text-stone-900 hover:bg-stone-200/40 rounded-xl transition-colors cursor-pointer"
              title="المفضلة والمحفوظات"
            >
              <Bookmark className={`w-5 h-5 ${bookmarkCount > 0 ? 'text-[#36533D]' : ''}`} />
              {bookmarkCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#36533D] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {bookmarkCount}
                </span>
              )}
            </button>

            {/* Admin shortcut button (only for authenticated admins and editors) */}
            {isLoggedIn && (isAdmin || isEditor) && (
              <button
                onClick={() => handleNav('/admin')}
                id="header-admin-quick-btn"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                  currentPath === '/admin'
                    ? 'bg-[#36533D] text-white shadow-sm font-extrabold'
                    : 'bg-emerald-900/10 hover:bg-emerald-900/20 text-[#36533D] border border-[#36533D]/25'
                }`}
                title="لوحة التحكم والإدارة"
              >
                <Shield className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">لوحة الإدارة</span>
                {isAdmin && (
                  <span className="hidden md:inline-block px-1.5 py-0.2 rounded bg-amber-400 text-stone-950 text-[10px] font-black">
                    المدير
                  </span>
                )}
              </button>
            )}

            {/* Auth Dropdown or Login Button */}
            {isLoggedIn && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 hover:bg-stone-200/40 rounded-xl transition-colors cursor-pointer"
                >
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border border-[#E7E2D8]"
                  />
                  <ChevronDown className="w-4 h-4 text-stone-400 hidden sm:block" />
                </button>

                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute left-0 mt-2 w-64 bg-white border border-[#E7E2D8] rounded-2xl shadow-xl py-2 z-50 text-right"
                    >
                      <div className="px-4 py-2.5 border-b border-stone-100">
                        <p className="font-bold text-sm text-stone-900 truncate">{user.name}</p>
                        <p className="text-xs text-stone-500 truncate">{user.email}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          user.role === 'ADMIN'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 font-black'
                            : user.role === 'EDITOR'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-100 text-stone-600'
                        }`}>
                          {user.role === 'ADMIN' ? '🛡️ المدير العام (كافة الصلاحيات)' : user.role === 'EDITOR' ? 'محرر محتوى' : 'عضو متابع'}
                        </span>
                      </div>

                      {(isAdmin || isEditor) && (
                        <button
                          onClick={() => handleNav('/admin')}
                          className="w-full px-4 py-2.5 text-xs font-bold text-[#36533D] hover:bg-[#36533D]/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <Shield className="w-4 h-4 text-amber-500" />
                          <span>لوحة التحكم والإدارة العامة</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleNav('/bookmarks')}
                        className="w-full px-4 py-2.5 text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Bookmark className="w-4 h-4 text-stone-400" />
                        <span>الموضوعات المحفوظة</span>
                      </button>

                      <button
                        onClick={() => handleNav('/contact')}
                        className="w-full px-4 py-2.5 text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Heart className="w-4 h-4 text-stone-400" />
                        <span>تواصل مع الفريق</span>
                      </button>

                      <div className="border-t border-stone-100 mt-1 pt-1">
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            logout();
                          }}
                          className="w-full px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>تسجيل الخروج</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="px-4 py-2 bg-[#36533D] hover:bg-[#2A4230] text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow cursor-pointer flex items-center gap-1.5"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>دخول / انضمام</span>
              </button>
            )}

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 text-stone-700 hover:bg-stone-200/40 rounded-xl lg:hidden cursor-pointer"
              aria-label="القائمة الرئيسية"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile RTL Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[#FCFAF7] border-b border-[#E7E2D8] px-4 pt-3 pb-6 overflow-hidden"
          >
            <div className="space-y-1">
              {onOpenMoodModal && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenMoodModal();
                  }}
                  className="w-full text-right px-4 py-3 rounded-xl text-sm font-bold bg-amber-500/10 text-amber-900 border border-amber-500/20 flex items-center justify-between mb-2 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span>🌿</span>
                    <span>اختر حالتك المزاجية قبل القراءة</span>
                  </span>
                  <span className="text-xs bg-amber-500/20 px-2 py-0.5 rounded-md font-extrabold">جديد</span>
                </button>
              )}

              {onOpenQuoteModal && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenQuoteModal();
                  }}
                  id="mobile-quote-button"
                  className="w-full text-right px-4 py-3 rounded-xl text-sm font-bold bg-amber-100/70 text-amber-950 border border-amber-300/80 flex items-center justify-between mb-2 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>قبس من النور (اقتباس ملهم)</span>
                  </span>
                  <span className="text-[10px] bg-amber-300/60 text-amber-950 px-2 py-0.5 rounded-md font-black">
                    رسالة اليوم
                  </span>
                </button>
              )}

              {navLinks.map((link) => {
                const isActive = currentPath === link.path;
                return (
                  <button
                    key={link.path}
                    onClick={() => handleNav(link.path)}
                    className={`w-full text-right px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-between transition-colors ${
                      isActive
                        ? 'bg-[#36533D] text-white'
                        : 'text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <span>{link.title}</span>
                    {isActive && <span className="w-2 h-2 rounded-full bg-amber-300"></span>}
                  </button>
                );
              })}

              {(isAdmin || isEditor) && (
                <button
                  onClick={() => handleNav('/admin')}
                  className="w-full text-right px-4 py-3 rounded-xl text-sm font-bold bg-[#36533D]/10 text-[#36533D] flex items-center justify-between mt-3 border border-[#36533D]/20"
                >
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-600" />
                    <span>لوحة التحكم والإدارة</span>
                  </span>
                  <span className="text-xs bg-[#36533D] text-white font-bold px-2 py-0.5 rounded-md">
                    {isAdmin ? 'المدير العام' : 'محرر'}
                  </span>
                </button>
              )}

              <button
                onClick={() => handleNav('/bookmarks')}
                className="w-full text-right px-4 py-3 rounded-xl text-sm font-bold text-stone-700 hover:bg-stone-100 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-[#36533D]" />
                  <span>المفضلة والمحفوظات</span>
                </span>
                {bookmarkCount > 0 && (
                  <span className="text-xs bg-[#36533D]/10 text-[#36533D] font-extrabold px-2 py-0.5 rounded-full">
                    {bookmarkCount} مقالات
                  </span>
                )}
              </button>

              <button
                onClick={() => handleNav('/search')}
                className="w-full text-right px-4 py-3 rounded-xl text-sm font-bold text-stone-600 hover:bg-stone-100 flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>البحث في المنصة</span>
              </button>

              {isLoggedIn && (
                <div className="border-t border-stone-200 mt-4 pt-4">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                      onNavigate('/');
                    }}
                    className="w-full text-right px-4 py-3 rounded-xl text-sm font-bold text-rose-600 bg-rose-50 border border-rose-100 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
