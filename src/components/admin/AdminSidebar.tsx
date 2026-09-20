import React from 'react';
import { 
  BarChart3, 
  FileText, 
  Video, 
  Quote, 
  Compass, 
  Headphones, 
  MessageSquareHeart, 
  MessageCircle, 
  FolderTree, 
  ImageIcon, 
  Mail, 
  Users, 
  Settings, 
  ShieldCheck, 
  History,
  ExternalLink,
  LogOut,
  ChevronLeft,
  LayoutDashboard,
  Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'motion/react';

export type AdminTab =
  | 'overview'
  | 'articles'
  | 'videos'
  | 'messages'
  | 'journeys'
  | 'podcasts'
  | 'submissions'
  | 'comments'
  | 'categories'
  | 'media'
  | 'contact'
  | 'newsletter'
  | 'users'
  | 'roles'
  | 'audit_logs'
  | 'settings';

interface SidebarItem {
  id: AdminTab;
  label: string;
  icon: any;
  permission?: string;
  adminOnly?: boolean;
}

const SIDEBAR_SECTIONS: { title: string; items: SidebarItem[] }[] = [
  {
    title: 'الرئيسية',
    items: [
      { id: 'overview', label: 'لوحة المؤشرات', icon: LayoutDashboard },
    ]
  },
  {
    title: 'إدارة المحتوى',
    items: [
      { id: 'articles', label: 'المقالات والموضوعات', icon: FileText, permission: 'content.view' },
      { id: 'videos', label: 'مكتبة المرئيات', icon: Video, permission: 'content.view' },
      { id: 'messages', label: 'رسائل النور', icon: Quote, permission: 'content.view' },
      { id: 'journeys', label: 'رحلات التعافي', icon: Compass, permission: 'content.view' },
      { id: 'podcasts', label: 'البودكاست الصوتي', icon: Headphones, permission: 'content.view' },
      { id: 'categories', label: 'التصنيفات والوسوم', icon: FolderTree, permission: 'content.view' },
      { id: 'media', label: 'مكتبة الوسائط', icon: ImageIcon, permission: 'content.view' },
    ]
  },
  {
    title: 'التفاعل والجمهور',
    items: [
      { id: 'submissions', label: 'فضفضات احكي لنا', icon: MessageSquareHeart, permission: 'content.view' },
      { id: 'comments', label: 'إدارة التعليقات', icon: MessageCircle, permission: 'content.view' },
      { id: 'contact', label: 'رسائل التواصل', icon: Mail, permission: 'content.view' },
      { id: 'newsletter', label: 'النشرة البريدية', icon: Bell, permission: 'content.view' },
    ]
  },
  {
    title: 'الإدارة والأمان',
    items: [
      { id: 'users', label: 'إدارة الأعضاء', icon: Users, permission: 'users.view' },
      { id: 'roles', label: 'الأدوار والصلاحيات', icon: ShieldCheck, permission: 'admins.view' },
      { id: 'audit_logs', label: 'سجل العمليات', icon: History, permission: 'audit_logs.view' },
      { id: 'settings', label: 'إعدادات المنصة', icon: Settings, permission: 'settings.view' },
    ]
  }
];

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onNavigate: (path: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export function AdminSidebar({ activeTab, onTabChange, onNavigate, isCollapsed, setIsCollapsed }: AdminSidebarProps) {
  const { user, logout, hasPermission } = useAuth();

  return (
    <aside 
      className={`fixed top-0 right-0 h-screen bg-[#1C1917] text-stone-300 transition-all duration-300 z-50 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
      dir="rtl"
    >
      {/* Sidebar Header */}
      <div className="p-6 flex items-center justify-between border-b border-white/5">
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-[#36533D] flex items-center justify-center text-amber-300 font-bold shadow-lg">
              ن
            </div>
            <span className="font-heading font-bold text-white text-lg tracking-tight">لوحة الإدارة</span>
          </motion.div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-white/10 text-stone-400 transition-colors"
        >
          <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Sidebar Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">
        {SIDEBAR_SECTIONS.map((section, sIdx) => {
          const visibleItems = section.items.filter(item => 
            !item.permission || hasPermission(item.permission)
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={sIdx} className="mb-8">
              {!isCollapsed && (
                <h3 className="px-4 text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-3">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => onTabChange(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group relative ${
                        isActive 
                          ? 'bg-[#36533D] text-white shadow-md' 
                          : 'hover:bg-white/5 text-stone-400 hover:text-stone-200'
                      }`}
                      title={isCollapsed ? item.label : ''}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-amber-300' : 'text-stone-500 group-hover:text-stone-300'}`} />
                      {!isCollapsed && (
                        <span className="text-sm font-bold truncate">{item.label}</span>
                      )}
                      {isActive && !isCollapsed && (
                        <motion.div 
                          layoutId="activeTab"
                          className="absolute left-2 w-1.5 h-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.6)]"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-white/5 bg-black/20">
        {!isCollapsed && (
          <div className="mb-4 px-2">
            <div className="flex items-center gap-3">
              <img 
                src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`} 
                alt={user?.name}
                className="w-10 h-10 rounded-xl border border-white/10"
              />
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-amber-400 font-medium truncate uppercase tracking-wider">
                  {user?.role.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <button
            onClick={() => onNavigate('/')}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-white/5 transition-all"
            title={isCollapsed ? 'زيارة الموقع' : ''}
          >
            <ExternalLink className="w-5 h-5" />
            {!isCollapsed && <span className="text-sm font-bold">زيارة الموقع</span>}
          </button>
          
          <button
            onClick={() => {
              logout();
              onNavigate('/');
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
            title={isCollapsed ? 'تسجيل الخروج' : ''}
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span className="text-sm font-bold">تسجيل الخروج</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
