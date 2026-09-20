import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  FileText,
  Video as VideoIcon,
  Quote,
  Compass,
  Headphones,
  MessageSquareHeart,
  MessageCircle,
  FolderTree,
  Image as ImageIcon,
  Users,
  Mail,
  Settings,
  Plus,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  BarChart3,
  LogOut,
  ExternalLink,
  Save,
  Search,
  Check,
  AlertTriangle,
  Filter,
  Star,
  Sparkles,
  UserPlus,
  UserCheck,
  ShieldAlert,
  Key,
  Tag,
  RefreshCw,
  X,
  Lock,
  ArrowRight,
  ArrowLeft,
  Globe,
  Play,
  Pause,
  Clock,
  Layers,
  ListOrdered,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  Article,
  Video,
  Message,
  Journey,
  Podcast,
  Submission,
  Category,
  MediaItem,
  ContactMessage,
  User,
  SiteSettings
} from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ContentEditor } from '../components/ContentEditor';
import { LoadingState, Modal } from '../components/Common';
import { AdminArticlesTab } from '../components/admin/AdminArticlesTab';
import { AdminSubmissionsTab } from '../components/admin/AdminSubmissionsTab';
import { AdminCommentsTab } from '../components/admin/AdminCommentsTab';
import { AdminUsersTab } from '../components/admin/AdminUsersTab';
import { AdminJourneysTab } from '../components/admin/AdminJourneysTab';
import { AdminPodcastsTab } from '../components/admin/AdminPodcastsTab';
import { AdminVideosTab } from '../components/admin/AdminVideosTab';
import { AdminMessagesTab } from '../components/admin/AdminMessagesTab';

type AdminTab =
  | 'overview'
  | 'site_preview'
  | 'articles'
  | 'videos'
  | 'messages'
  | 'journeys'
  | 'podcasts'
  | 'submissions'
  | 'comments'
  | 'categories'
  | 'media'
  | 'users'
  | 'contact'
  | 'settings';

const PRESET_ARTICLE_IMAGES = [
  { label: 'سكينة وطبيعة دافئة', url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80' },
  { label: 'تأمل وسلام نفسي', url: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1200&q=80' },
  { label: 'شروق وأمل جديد', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80' },
  { label: 'روابط إنسانية ودعم', url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80' },
  { label: 'تعافي وهدوء داخلي', url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1200&q=80' },
  { label: 'كتابة ووعي ذاتي', url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80' }
];

const SUGGESTED_ARTICLE_TAGS = [
  'الوعي النفسي',
  'التعافي',
  'السلام الداخلي',
  'الحدود الشخصية',
  'العلاقات الصحية',
  'الثقة بالنفس',
  'تجاوز الصدمات',
  'تربية الأبناء',
  'إدارة القلق',
  'اليقين والأمل'
];

export function AdminDashboard({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { user, isAdmin, isEditor, logout, login, openAuthModal, loginAsFatmaAdmin } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(false);

  // Overview stats
  const [stats, setStats] = useState<Record<string, number>>({});
  const [recentArticles, setRecentArticles] = useState<any[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);

  // Entities state
  const [articles, setArticles] = useState<Article[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  // Users / Members Management
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 'ADMIN' | 'EDITOR' | 'USER'>('ALL');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserData, setEditUserData] = useState<{
    name: string;
    email: string;
    role: 'ADMIN' | 'EDITOR' | 'USER';
    bio: string;
    password?: string;
  }>({
    name: '',
    email: '',
    role: 'USER',
    bio: '',
    password: ''
  });
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Partial<Category>>({
    name: '',
    slug: '',
    description: '',
    display_order: 1
  });

  const [isAddingMedia, setIsAddingMedia] = useState(false);
  const [newMedia, setNewMedia] = useState({
    file_name: '',
    file_url: '',
    mime_type: 'image/jpeg',
    category: 'articles',
    alt_text: ''
  });

  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'EDITOR'
  });

  // User Stats
  const userStats = useMemo(() => {
    const total = usersList.length;
    const admins = usersList.filter(u => u.role === 'ADMIN').length;
    const editors = usersList.filter(u => u.role === 'EDITOR').length;
    const regular = usersList.filter(u => u.role === 'USER').length;
    return { total, admins, editors, regular };
  }, [usersList]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return usersList.filter((u: User) => {
      if (userRoleFilter !== 'ALL' && u.role !== userRoleFilter) {
        return false;
      }
      if (userSearchQuery.trim()) {
        const q = userSearchQuery.toLowerCase();
        const matchName = u.name?.toLowerCase().includes(q);
        const matchEmail = u.email?.toLowerCase().includes(q);
        if (!matchName && !matchEmail) return false;
      }
      return true;
    });
  }, [usersList, userRoleFilter, userSearchQuery]);

  // Load active tab data
  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab]);

  const loadTabData = async (tab: AdminTab) => {
    setLoading(true);
    try {
      if (tab === 'overview') {
        const res = await api.admin.getStats();
        setStats(res.stats || {});
        setRecentArticles(res.recentArticles || []);
        setRecentSubmissions(res.recentSubmissions || []);
      } else if (tab === 'articles') {
        const [artRes, catRes] = await Promise.all([
          api.admin.getArticles(),
          api.getCategories()
        ]);
        setArticles(artRes.articles || []);
        setCategories(catRes.categories || []);
      } else if (tab === 'videos') {
        const [vidRes, catRes] = await Promise.all([
          api.admin.getVideos(),
          api.getCategories()
        ]);
        setVideos(vidRes.videos || []);
        setCategories(catRes.categories || []);
      } else if (tab === 'messages') {
        const [msgRes, catRes] = await Promise.all([
          api.admin.getMessages(),
          api.getCategories()
        ]);
        setMessages(msgRes.messages || []);
        setCategories(catRes.categories || []);
      } else if (tab === 'journeys') {
        const [jrnRes, catRes] = await Promise.all([
          api.admin.getJourneys(),
          api.getCategories()
        ]);
        setJourneys(jrnRes.journeys || []);
        setCategories(catRes.categories || []);
      } else if (tab === 'podcasts') {
        const [podRes, catRes] = await Promise.all([
          api.admin.getPodcasts(),
          api.getCategories()
        ]);
        setPodcasts(podRes.podcasts || []);
        setCategories(catRes.categories || []);
      } else if (tab === 'submissions') {
        const subRes = await api.admin.getSubmissions();
        setSubmissions(subRes.submissions || []);
      } else if (tab === 'comments') {
        const comRes = await api.admin.getComments();
        setComments(comRes.comments || []);
      } else if (tab === 'categories') {
        const catRes = await api.getCategories();
        setCategories(catRes.categories || []);
      } else if (tab === 'media') {
        const medRes = await api.admin.getMedia();
        setMedia(medRes.media || []);
      } else if (tab === 'users') {
        if (isAdmin) {
          const usrRes = await api.admin.getUsers();
          setUsersList(usrRes.users || []);
        }
      } else if (tab === 'contact') {
        const cntRes = await api.admin.getContactMessages();
        setContactMessages(cntRes.messages || []);
      } else if (tab === 'settings') {
        const setRes = await api.getSettings();
        setSiteSettings(setRes.settings);
      }
    } catch (err: any) {
      showToast(err.message || 'فشل تحميل بيانات القسم', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Submission moderation
  const handleUpdateSubmissionStatus = async (id: number, status: 'approved' | 'rejected' | 'published') => {
    try {
      await api.admin.updateSubmission(id, { status });
      showToast(`تم تغيير حالة الفضفضة إلى: ${status}`, 'success');
      loadTabData('submissions');
    } catch (err: any) {
      showToast(err.message || 'فشل التحديث', 'error');
    }
  };

  const handleDeleteSubmission = async (id: number) => {
    if (!confirm('حذف هذه المشاركة نهائياً؟')) return;
    try {
      await api.admin.deleteSubmission(id);
      showToast('تم حذف المشاركة', 'info');
      loadTabData('submissions');
    } catch (err: any) {
      showToast(err.message || 'فشل الحذف', 'error');
    }
  };

  // Comment moderation
  const handleCommentStatus = async (id: number, status: string) => {
    try {
      await api.admin.updateComment(id, status);
      showToast('تم تحديث حالة التعليق', 'success');
      loadTabData('comments');
    } catch (err: any) {
      showToast(err.message || 'فشل التحديث', 'error');
    }
  };

  // Category handlers
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentCategory.id) {
        await api.admin.updateCategory(currentCategory.id, currentCategory);
        showToast('تم تحديث التصنيف', 'success');
      } else {
        await api.admin.createCategory(currentCategory);
        showToast('تم إضافة التصنيف الجديد', 'success');
      }
      setIsEditingCategory(false);
      loadTabData('categories');
    } catch (err: any) {
      showToast(err.message || 'فشل حفظ التصنيف', 'error');
    }
  };

  // Media handlers
  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.admin.addMedia({
        ...newMedia,
        file_size: 1024 * 500
      });
      showToast('تمت إضافة الملف لمكتبة الوسائط', 'success');
      setIsAddingMedia(false);
      setNewMedia({ file_name: '', file_url: '', mime_type: 'image/jpeg', category: 'articles', alt_text: '' });
      loadTabData('media');
    } catch (err: any) {
      showToast(err.message || 'فشل الإضافة', 'error');
    }
  };

  // Users handlers
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
      return;
    }
    try {
      await api.admin.createUser(newUser);
      showToast(`تم إنشاء حساب "${newUser.name}" بنجاح ✨`, 'success');
      setIsAddingUser(false);
      setNewUser({ name: '', email: '', password: '', role: 'EDITOR' });
      loadTabData('users');
    } catch (err: any) {
      showToast(err.message || 'فشل إنشاء المستخدم', 'error');
    }
  };

  const handleQuickChangeRole = async (targetUser: User, newRole: 'ADMIN' | 'EDITOR' | 'USER') => {
    if (targetUser.id === user?.id && newRole !== 'ADMIN') {
      if (!confirm('تنبيه: أنت على وشك خفض صلاحية حسابك الحالي من مدير عام! هل ترغب بالاستمرار؟')) {
        return;
      }
    }
    try {
      await api.admin.updateUser(targetUser.id, { role: newRole });
      setUsersList((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
      );
      const roleLabel = newRole === 'ADMIN' ? 'مدير عام (Admin)' : newRole === 'EDITOR' ? 'محرر محتوى (Editor)' : 'عضو زائر (User)';
      showToast(`تم تعديل صلاحية "${targetUser.name}" إلى: ${roleLabel}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'فشل تغيير الصلاحية', 'error');
    }
  };

  const handleOpenEditUser = (u: User) => {
    setEditingUser(u);
    setEditUserData({
      name: u.name,
      email: u.email,
      role: u.role,
      bio: u.bio || '',
      password: ''
    });
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsUpdatingUser(true);
    try {
      const payload: any = {
        name: editUserData.name.trim(),
        email: editUserData.email.trim().toLowerCase(),
        role: editUserData.role,
        bio: editUserData.bio.trim()
      };
      if (editUserData.password?.trim()) {
        payload.password = editUserData.password.trim();
      }

      await api.admin.updateUser(editingUser.id, payload);
      setUsersList((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                name: payload.name,
                email: payload.email,
                role: payload.role,
                bio: payload.bio
              }
            : u
        )
      );
      showToast(`تم تحديث بيانات العضو "${editUserData.name}" بنجاح 🌿`, 'success');
      setEditingUser(null);
    } catch (err: any) {
      showToast(err.message || 'فشل تحديث بيانات العضو', 'error');
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    if (userToDelete.id === user?.id) {
      showToast('لا يمكنك حذف حسابك الحالي الذي تستخدمه لتسجيل الدخول!', 'error');
      setUserToDelete(null);
      return;
    }
    setIsDeletingUser(true);
    try {
      await api.admin.deleteUser(userToDelete.id);
      setUsersList((prev) => prev.filter((u) => u.id !== userToDelete.id));
      showToast(`تم حذف حساب العضو "${userToDelete.name}" نهائياً`, 'info');
      setUserToDelete(null);
    } catch (err: any) {
      showToast(err.message || 'فشل حذف المستخدم', 'error');
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Site Settings save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteSettings) return;
    try {
      await api.admin.updateSettings(siteSettings);
      showToast('تم حفظ إعدادات الموقع بنجاح 🌿', 'success');
    } catch (err: any) {
      showToast(err.message || 'فشل حفظ الإعدادات', 'error');
    }
  };

  if (!isEditor) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full p-8 bg-white border border-[#E7E2D8] rounded-3xl shadow-xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-5 shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="font-heading font-bold text-2xl text-stone-900 mb-2">لوحة التحكم وإدارة المنصة</h2>
          <p className="text-sm text-stone-600 leading-relaxed mb-6">
            هذه المنطقة مخصصة لإدارة المحتوى، نشر وتعديل الموضوعات، والتحكم في صلاحيات الأعضاء.
          </p>

          <div className="space-y-3">
            <button
              onClick={async () => {
                try {
                  await loginAsFatmaAdmin();
                } catch (err: any) {
                  showToast('تعذر الدخول بصلاحيات الإدارة', 'error');
                }
              }}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#36533D] to-[#2A4230] hover:from-[#2A4230] hover:to-[#1C1917] text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-300" />
                <span>دخول فوري كـ فاطمة محمد (المدير العام)</span>
              </div>
              <span className="bg-amber-400 text-stone-950 px-2 py-0.5 rounded text-[10px] font-black">
                كافة الصلاحيات
              </span>
            </button>

            <button
              onClick={async () => {
                try {
                  await login('editor@lesanour.com', 'editor123456');
                  showToast('مرحباً بك، تم تفعيل صلاحيات محرر المحتوى 🌿', 'success');
                } catch (err: any) {
                  showToast('تعذر تسجيل الدخول التجريبي', 'error');
                }
              }}
              className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5 text-stone-600" />
              <span>دخول كـ محرر محتوى (Editor)</span>
            </button>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
              <button
                onClick={() => openAuthModal('login')}
                className="text-[#36533D] hover:underline font-bold"
              >
                تسجيل الدخول بحساب مسجل
              </button>
              <button
                onClick={() => onNavigate('/')}
                className="text-stone-500 hover:text-stone-800 transition-colors"
              >
                العودة للرئيسية
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const navItems: Array<{ id: AdminTab; label: string; icon: any; adminOnly?: boolean }> = [
    { id: 'overview', label: 'لوحة المؤشرات', icon: BarChart3 },
    { id: 'site_preview', label: 'معاينة الموقع والتعديلات الحية', icon: Eye },
    { id: 'articles', label: 'الموضوعات والمقالات', icon: FileText },
    { id: 'videos', label: 'مكتبة الفيديوهات', icon: VideoIcon },
    { id: 'messages', label: 'رسائل لسه في نور', icon: Quote },
    { id: 'journeys', label: 'رحلات التعافي', icon: Compass },
    { id: 'podcasts', label: 'حلقات البودكاست', icon: Headphones },
    { id: 'submissions', label: 'فضفضات "احكي لنا"', icon: MessageSquareHeart },
    { id: 'comments', label: 'إدارة التعليقات', icon: MessageCircle },
    { id: 'categories', label: 'التصنيفات والوسوم', icon: FolderTree },
    { id: 'media', label: 'مكتبة الوسائط', icon: ImageIcon },
    { id: 'contact', label: 'رسائل التواصل', icon: Mail },
    { id: 'users', label: 'إدارة المستخدمين', icon: Users, adminOnly: true },
    { id: 'settings', label: 'إعدادات المنصة', icon: Settings, adminOnly: true }
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-800 text-right pb-20" dir="rtl">
      {/* Prominent Quick Return & Live Website Preview Banner */}
      <div className="bg-gradient-to-r from-[#36533D] via-[#2A4230] to-stone-900 text-white px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-2.5 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-white">لوحة الإدارة والتحكم</span>
          <span className="text-emerald-100/80 hidden md:inline">
            | لرؤية كافة التعديلات والتحديثات الحية وتصفح الموقع كما يراه الزوار:
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/')}
            id="admin-top-return-to-site"
            className="px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            title="الانتقال الفوري إلى الموقع ومعاينة التعديلات"
          >
            <Eye className="w-4 h-4 text-stone-950" />
            <span>العودة للموقع ومشاهدة التعديلات الحية</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Top Admin Navbar */}
      <div className="bg-[#1C1917] text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#36533D] text-white flex items-center justify-center font-bold text-xs shadow-inner">
            <Shield className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-sm sm:text-base leading-none">
              لوحة التحكم والإدارة العامة | لسه في نور
            </h1>
            <p className="text-[10px] text-amber-300 mt-1 font-bold">
              أهلاً بكِ يا {user?.name} (المدير العام - كافة الصلاحيات مفعلة 🛡️✨)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/')}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>زيارة الموقع</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              logout();
              onNavigate('/');
            }}
            className="p-2 text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
            title="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-3 bg-white border border-[#E7E2D8] rounded-2xl p-3 space-y-1 shadow-sm sticky top-24">
            {navItems.map((item) => {
              if (item.adminOnly && !isAdmin) return null;
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full text-right px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-3 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#36533D] text-white shadow-sm'
                      : 'text-stone-700 hover:bg-[#FAF7F2]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-200' : 'text-stone-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Main Workspace Area */}
          <div className="lg:col-span-9 bg-white border border-[#E7E2D8] rounded-3xl p-6 sm:p-8 shadow-sm min-h-[600px]">
            {loading ? (
              <LoadingState message="جارٍ تحميل بيانات القسم الإداري..." />
            ) : (
              <>
                {/* 1. OVERVIEW TAB */}
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="font-heading font-black text-xl text-stone-900 mb-1">
                        نظرة عامة على نشاط المنصة
                      </h2>
                      <p className="text-xs text-stone-500">إحصائيات مباشرة من قاعدة البيانات الحقيقية</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-4 bg-[#FAF7F2] border border-[#E7E2D8] rounded-2xl">
                        <span className="text-[11px] font-bold text-stone-500 block mb-1">إجمالي المقالات</span>
                        <span className="font-heading font-black text-2xl text-[#36533D]">{stats.articles || 0}</span>
                      </div>
                      <div className="p-4 bg-[#FAF7F2] border border-[#E7E2D8] rounded-2xl">
                        <span className="text-[11px] font-bold text-stone-500 block mb-1">الفيديوهات</span>
                        <span className="font-heading font-black text-2xl text-stone-900">{stats.videos || 0}</span>
                      </div>
                      <div className="p-4 bg-[#FAF7F2] border border-[#E7E2D8] rounded-2xl">
                        <span className="text-[11px] font-bold text-stone-500 block mb-1">رسائل النور</span>
                        <span className="font-heading font-black text-2xl text-stone-900">{stats.messages || 0}</span>
                      </div>
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                        <span className="text-[11px] font-bold text-emerald-800 block mb-1">فضفضات جديدة</span>
                        <span className="font-heading font-black text-2xl text-emerald-900">{stats.pendingSubmissions || 0}</span>
                      </div>
                      <div className="p-4 bg-[#FAF7F2] border border-[#E7E2D8] rounded-2xl">
                        <span className="text-[11px] font-bold text-stone-500 block mb-1">إجمالي المشاهدات</span>
                        <span className="font-heading font-black text-2xl text-stone-900">{stats.totalViews || 0}</span>
                      </div>
                      <div className="p-4 bg-[#FAF7F2] border border-[#E7E2D8] rounded-2xl">
                        <span className="text-[11px] font-bold text-stone-500 block mb-1">المشتركون بالنشرة</span>
                        <span className="font-heading font-black text-2xl text-stone-900">{stats.subscribers || 0}</span>
                      </div>
                      <div className="p-4 bg-[#FAF7F2] border border-[#E7E2D8] rounded-2xl">
                        <span className="text-[11px] font-bold text-stone-500 block mb-1">التعليقات</span>
                        <span className="font-heading font-black text-2xl text-stone-900">{stats.comments || 0}</span>
                      </div>
                      <div className="p-4 bg-[#FAF7F2] border border-[#E7E2D8] rounded-2xl">
                        <span className="text-[11px] font-bold text-stone-500 block mb-1">المستخدمون المسجلون</span>
                        <span className="font-heading font-black text-2xl text-stone-900">{stats.users || 0}</span>
                      </div>
                    </div>

                    {/* Quick actions */}
                    <div className="p-5 bg-stone-50 border border-stone-200 rounded-2xl">
                      <h3 className="font-bold text-xs text-stone-800 mb-3">إجراءات سريعة:</h3>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setActiveTab('articles')}
                          className="px-3.5 py-2 bg-[#36533D] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>كتابة موضوع جديد</span>
                        </button>
                        <button
                          onClick={() => setActiveTab('submissions')}
                          className="px-3.5 py-2 bg-white border border-[#E7E2D8] hover:bg-stone-50 text-stone-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <MessageSquareHeart className="w-3.5 h-3.5 text-rose-500" />
                          <span>مراجعة الفضفضات المعلقة ({stats.pendingSubmissions || 0})</span>
                        </button>
                      </div>
                    </div>

                    {/* Recent Submissions */}
                    <div>
                      <h3 className="font-heading font-bold text-sm text-stone-900 mb-3">
                        أحدث المشاركات الواردة في "احكي لنا"
                      </h3>
                      <div className="space-y-3">
                        {recentSubmissions.slice(0, 3).map((sub) => (
                          <div key={sub.id} className="p-3.5 bg-white border border-[#E7E2D8] rounded-xl flex items-center justify-between text-xs">
                            <p className="truncate max-w-md text-stone-700 italic">"{sub.message}"</p>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold">
                              {sub.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. SITE PREVIEW & DIRECT INSPECTION TAB */}
                {activeTab === 'site_preview' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E2D8]">
                      <div>
                        <h2 className="font-heading font-black text-xl text-stone-900">
                          معاينة الموقع والتعديلات الحية
                        </h2>
                        <p className="text-xs text-stone-500 mt-0.5">
                          تصفحي موقع "لسه في نور" مباشرة وتأكدي من ظهور كافة التعديلات والمقالات والتحديثات
                        </p>
                      </div>
                      <button
                        onClick={() => onNavigate('/')}
                        className="px-5 py-2.5 bg-[#36533D] hover:bg-[#2A4230] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                      >
                        <ExternalLink className="w-4 h-4 text-amber-300" />
                        <span>فتح الموقع في نافذة العرض الرئيسية</span>
                      </button>
                    </div>

                    {/* Quick Section Cards to Jump Directly to Edits */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div
                        onClick={() => onNavigate('/')}
                        className="p-5 bg-[#FAF7F2] border border-[#E7E2D8] hover:border-[#36533D]/40 rounded-2xl transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="w-8 h-8 rounded-xl bg-[#36533D]/10 text-[#36533D] flex items-center justify-center font-bold">
                            🏡
                          </span>
                          <span className="text-[10px] text-[#36533D] font-bold bg-[#36533D]/10 px-2 py-0.5 rounded-full group-hover:bg-[#36533D] group-hover:text-white transition-colors">
                            زيارة ←
                          </span>
                        </div>
                        <h3 className="font-heading font-bold text-sm text-stone-900 mb-1">
                          الصفحة الرئيسية
                        </h3>
                        <p className="text-[11px] text-stone-500 leading-relaxed">
                          معاينة البانر الترحيبي، الاقتباس الملهم "قبس نور"، أحدث المقالات والرسائل.
                        </p>
                      </div>

                      <div
                        onClick={() => onNavigate('/articles')}
                        className="p-5 bg-[#FAF7F2] border border-[#E7E2D8] hover:border-[#36533D]/40 rounded-2xl transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                            📖
                          </span>
                          <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            زيارة ←
                          </span>
                        </div>
                        <h3 className="font-heading font-bold text-sm text-stone-900 mb-1">
                          الموضوعات والمقالات
                        </h3>
                        <p className="text-[11px] text-stone-500 leading-relaxed">
                          مشاهدة المقالات المنشورة، التصنيفات، ومقالات الوعي والتعافي النفسي.
                        </p>
                      </div>

                      <div
                        onClick={() => onNavigate('/messages')}
                        className="p-5 bg-[#FAF7F2] border border-[#E7E2D8] hover:border-[#36533D]/40 rounded-2xl transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                            💌
                          </span>
                          <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full group-hover:bg-amber-600 group-hover:text-white transition-colors">
                            زيارة ←
                          </span>
                        </div>
                        <h3 className="font-heading font-bold text-sm text-stone-900 mb-1">
                          رسائل لسه في نور
                        </h3>
                        <p className="text-[11px] text-stone-500 leading-relaxed">
                          معاينة الرسائل الملهمة وبطاقات الاقتباسات اليومية والسكينة.
                        </p>
                      </div>

                      <div
                        onClick={() => onNavigate('/videos')}
                        className="p-5 bg-[#FAF7F2] border border-[#E7E2D8] hover:border-[#36533D]/40 rounded-2xl transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                            🎬
                          </span>
                          <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            زيارة ←
                          </span>
                        </div>
                        <h3 className="font-heading font-bold text-sm text-stone-900 mb-1">
                          مكتبة الفيديوهات
                        </h3>
                        <p className="text-[11px] text-stone-500 leading-relaxed">
                          مشاهدة مقاطع الفيديو والمحتوى المرئي وحلقات الدعم النفسي.
                        </p>
                      </div>

                      <div
                        onClick={() => onNavigate('/journeys')}
                        className="p-5 bg-[#FAF7F2] border border-[#E7E2D8] hover:border-[#36533D]/40 rounded-2xl transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                            🧭
                          </span>
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            زيارة ←
                          </span>
                        </div>
                        <h3 className="font-heading font-bold text-sm text-stone-900 mb-1">
                          رحلات التعافي
                        </h3>
                        <p className="text-[11px] text-stone-500 leading-relaxed">
                          معاينة المسارات الإرشادية وخطوات التعافي الذاتي من الصدمات.
                        </p>
                      </div>

                      <div
                        onClick={() => onNavigate('/podcast')}
                        className="p-5 bg-[#FAF7F2] border border-[#E7E2D8] hover:border-[#36533D]/40 rounded-2xl transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
                            🎙️
                          </span>
                          <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-full group-hover:bg-rose-600 group-hover:text-white transition-colors">
                            زيارة ←
                          </span>
                        </div>
                        <h3 className="font-heading font-bold text-sm text-stone-900 mb-1">
                          البودكاست الصوتي
                        </h3>
                        <p className="text-[11px] text-stone-500 leading-relaxed">
                          مشاهدة الحلقات الصوتية ومشغل البودكاست والنصوص المرافقة.
                        </p>
                      </div>
                    </div>

                    {/* Interactive Info Window */}
                    <div className="mt-6 border border-[#E7E2D8] rounded-2xl overflow-hidden shadow-xs bg-[#FAF7F2]">
                      <div className="bg-stone-100 px-4 py-3 border-b border-[#E7E2D8] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-rose-400" />
                          <span className="w-3 h-3 rounded-full bg-amber-400" />
                          <span className="w-3 h-3 rounded-full bg-emerald-400" />
                          <span className="text-xs font-mono text-stone-600 mr-2">لسه في نور — الموقع المباشر</span>
                        </div>
                        <button
                          onClick={() => onNavigate('/')}
                          className="px-3 py-1 rounded-lg bg-[#36533D] text-white text-xs font-bold hover:bg-[#2A4230] transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>عرض كامل في الصفحة</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="p-8 text-center bg-white">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#36533D] flex items-center justify-center mx-auto mb-4 border border-emerald-200 shadow-inner">
                          <Eye className="w-7 h-7" />
                        </div>
                        <h3 className="font-heading font-bold text-base text-stone-900 mb-2">
                          جميع تعديلاتك محفوظة ومنشورة مباشرة على المنصة
                        </h3>
                        <p className="text-xs text-stone-500 max-w-md mx-auto mb-5 leading-relaxed">
                          يمكنكِ الانتقال للموقع في أي وقت لتجربة التصفح كزائر عادي ومشاهدة المقالات والرسائل والاقتباس الملهم بكل وضوح دون أن تحجب لوحة التحكم أي عنصر.
                        </p>
                        <button
                          onClick={() => onNavigate('/')}
                          className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs inline-flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                        >
                          <Eye className="w-4 h-4 text-stone-950" />
                          <span>الذهاب إلى الصفحة الرئيسية ومعاينة كل شيء الآن</span>
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. ARTICLES MANAGEMENT */}
                {activeTab === 'articles' && (
                  <AdminArticlesTab
                    articles={articles}
                    categories={categories}
                    onReload={() => loadTabData('articles')}
                    showToast={showToast}
                    onNavigate={onNavigate}
                  />
                )}

                {/* 3. VIDEOS MANAGEMENT */}
                {activeTab === 'videos' && (
                  <AdminVideosTab
                    videos={videos}
                    categories={categories}
                    onReload={() => loadTabData('videos')}
                    showToast={showToast}
                    onNavigate={onNavigate}
                  />
                )}

                {/* 4. MESSAGES MANAGEMENT */}
                {activeTab === 'messages' && (
                  <AdminMessagesTab
                    messages={messages}
                    categories={categories}
                    onReload={() => loadTabData('messages')}
                    showToast={showToast}
                    onNavigate={onNavigate}
                  />
                )}

                {/* 5. JOURNEYS & PROGRAMS TAB */}
                {activeTab === 'journeys' && (
                  <AdminJourneysTab
                    journeys={journeys}
                    categories={categories}
                    onReload={() => loadTabData('journeys')}
                    showToast={showToast}
                    onNavigate={onNavigate}
                  />
                )}

                {/* 6. PODCASTS & AUDIO TAB */}
                {activeTab === 'podcasts' && (
                  <AdminPodcastsTab
                    podcasts={podcasts}
                    categories={categories}
                    onReload={() => loadTabData('podcasts')}
                    showToast={showToast}
                    onNavigate={onNavigate}
                  />
                )}

                {/* 7. SUBMISSIONS MODERATION ("احكي لنا") */}
                {activeTab === 'submissions' && (
                  <AdminSubmissionsTab
                    submissions={submissions}
                    onUpdateStatus={handleUpdateSubmissionStatus}
                    onDelete={handleDeleteSubmission}
                  />
                )}

                {/* 6. COMMENTS MODERATION */}
                {activeTab === 'comments' && (
                  <AdminCommentsTab
                    comments={comments}
                    onUpdateStatus={handleCommentStatus}
                  />
                )}

                {/* 7. CATEGORIES MANAGEMENT */}
                {activeTab === 'categories' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-[#E7E2D8]">
                      <div>
                        <h2 className="font-heading font-bold text-lg text-stone-900">التصنيفات والوسوم</h2>
                        <p className="text-xs text-stone-500">أقسام المحتوى وتصنيفاته</p>
                      </div>
                      <button
                        onClick={() => {
                          setCurrentCategory({ name: '', slug: '', description: '', display_order: 1 });
                          setIsEditingCategory(true);
                        }}
                        className="px-4 py-2 bg-[#36533D] text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>تصنيف جديد</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {categories.map((c) => (
                        <div key={c.id} className="p-4 bg-white border border-[#E7E2D8] rounded-2xl flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-sm text-stone-900">{c.name}</h4>
                            <p className="text-xs text-stone-500 line-clamp-1">{c.description}</p>
                            <span className="text-[10px] text-stone-400 font-mono">slug: {c.slug}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setCurrentCategory(c);
                                setIsEditingCategory(true);
                              }}
                              className="p-1.5 text-[#36533D] hover:bg-emerald-50 rounded-lg"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {isEditingCategory && (
                      <Modal isOpen={isEditingCategory} onClose={() => setIsEditingCategory(false)} title="بيانات التصنيف">
                        <form onSubmit={handleSaveCategory} className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1">اسم التصنيف</label>
                            <input
                              type="text"
                              required
                              value={currentCategory.name || ''}
                              onChange={(e) => setCurrentCategory({ ...currentCategory, name: e.target.value })}
                              className="w-full p-2 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1">الرابط المخصص (Slug)</label>
                            <input
                              type="text"
                              required
                              value={currentCategory.slug || ''}
                              onChange={(e) => setCurrentCategory({ ...currentCategory, slug: e.target.value })}
                              className="w-full p-2 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1">الوصف</label>
                            <textarea
                              rows={3}
                              value={currentCategory.description || ''}
                              onChange={(e) => setCurrentCategory({ ...currentCategory, description: e.target.value })}
                              className="w-full p-2 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs"
                            />
                          </div>
                          <button type="submit" className="w-full py-2.5 bg-[#36533D] text-white text-xs font-bold rounded-xl">
                            حفظ التصنيف
                          </button>
                        </form>
                      </Modal>
                    )}
                  </div>
                )}

                {/* 8. MEDIA LIBRARY */}
                {activeTab === 'media' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-[#E7E2D8]">
                      <div>
                        <h2 className="font-heading font-bold text-lg text-stone-900">مكتبة الوسائط</h2>
                        <p className="text-xs text-stone-500">إدارة الصور والملفات المرفوعة</p>
                      </div>
                      <button
                        onClick={() => setIsAddingMedia(true)}
                        className="px-4 py-2 bg-[#36533D] text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>إضافة رابط صورة</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {media.map((item) => (
                        <div key={item.id} className="p-2 bg-white border border-[#E7E2D8] rounded-xl overflow-hidden group">
                          <img src={item.file_url} alt="" className="w-full aspect-square object-cover rounded-lg mb-2" />
                          <p className="text-xs font-bold text-stone-900 truncate">{item.file_name}</p>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(item.file_url);
                              showToast('تم نسخ رابط الصورة 📋', 'success');
                            }}
                            className="w-full mt-1 py-1 text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-700 rounded font-bold"
                          >
                            نسخ الرابط
                          </button>
                        </div>
                      ))}
                    </div>

                    {isAddingMedia && (
                      <Modal isOpen={isAddingMedia} onClose={() => setIsAddingMedia(false)} title="إضافة ملف صورة">
                        <form onSubmit={handleAddMedia} className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1">اسم الملف</label>
                            <input
                              type="text"
                              required
                              value={newMedia.file_name}
                              onChange={(e) => setNewMedia({ ...newMedia, file_name: e.target.value })}
                              placeholder="صورة شروق وأمل"
                              className="w-full p-2 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1">رابط الصورة (URL)</label>
                            <input
                              type="text"
                              required
                              value={newMedia.file_url}
                              onChange={(e) => setNewMedia({ ...newMedia, file_url: e.target.value })}
                              placeholder="https://images.unsplash.com/..."
                              className="w-full p-2 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs"
                            />
                          </div>
                          <button type="submit" className="w-full py-2 bg-[#36533D] text-white text-xs font-bold rounded-xl">
                            إضافة للمكتبة
                          </button>
                        </form>
                      </Modal>
                    )}
                  </div>
                )}

                {/* 9. CONTACT MESSAGES */}
                {activeTab === 'contact' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="font-heading font-bold text-lg text-stone-900">رسائل التواصل الواردة</h2>
                      <p className="text-xs text-stone-500">رسائل الزوار والاستفسارات العامة</p>
                    </div>

                    <div className="space-y-3">
                      {contactMessages.map((msg) => (
                        <div key={msg.id} className="p-4 bg-white border border-[#E7E2D8] rounded-2xl">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="font-bold text-xs text-stone-900">{msg.name}</span>
                              <span className="text-[11px] text-stone-400 mr-2 font-mono">{msg.email}</span>
                            </div>
                            <span className="text-[10px] text-stone-400">{msg.created_at?.slice(0, 10)}</span>
                          </div>
                          <h4 className="font-bold text-xs text-[#36533D] mb-1">{msg.subject}</h4>
                          <p className="text-xs text-stone-700 leading-relaxed bg-[#FAF7F2] p-3 rounded-xl">{msg.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 10. USERS & MEMBERS MANAGEMENT (Admin Only) */}
                {activeTab === 'users' && isAdmin && (
                  <AdminUsersTab
                    users={filteredUsers}
                    currentUser={user}
                    isAdmin={isAdmin}
                    onAddUser={() => setIsAddingUser(true)}
                    onEditUser={handleOpenEditUser}
                    onDeleteUser={(u) => setUserToDelete(u)}
                    onRoleChange={handleQuickChangeRole}
                    searchQuery={userSearchQuery}
                    onSearchChange={setUserSearchQuery}
                    roleFilter={userRoleFilter}
                    onRoleFilterChange={(role) => setUserRoleFilter(role as any)}
                    stats={userStats}
                  />
                )}

                {/* 11. SITE SETTINGS (Admin Only) */}
                {activeTab === 'settings' && isAdmin && siteSettings && (
                  <form onSubmit={handleSaveSettings} className="space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-[#E7E2D8]">
                      <div>
                        <h2 className="font-heading font-bold text-lg text-stone-900">إعدادات المنصة والهوية</h2>
                        <p className="text-xs text-stone-500">التحكم في نصوص الواجهة وتفعيل الأقسام</p>
                      </div>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-[#36533D] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>حفظ التعديلات</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">اسم الموقع</label>
                        <input
                          type="text"
                          value={siteSettings.site_name}
                          onChange={(e) => setSiteSettings({ ...siteSettings, site_name: e.target.value })}
                          className="w-full p-2 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">الرسالة الجوهرية (Tagline)</label>
                        <input
                          type="text"
                          value={siteSettings.tagline}
                          onChange={(e) => setSiteSettings({ ...siteSettings, tagline: e.target.value })}
                          className="w-full p-2 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">عنوان البانر الرئيسي (Hero Title)</label>
                      <input
                        type="text"
                        value={siteSettings.hero_title}
                        onChange={(e) => setSiteSettings({ ...siteSettings, hero_title: e.target.value })}
                        className="w-full p-2 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">النص التعريفي في الفوتر</label>
                      <textarea
                        rows={3}
                        value={siteSettings.footer_about}
                        onChange={(e) => setSiteSettings({ ...siteSettings, footer_about: e.target.value })}
                        className="w-full p-2 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs leading-relaxed"
                      />
                    </div>
                  </form>
                )}

                {/* MODAL: ADD NEW USER */}
                {isAddingUser && (
                  <Modal isOpen={isAddingUser} onClose={() => setIsAddingUser(false)} title="إضافة حساب عضو / محرر جديد">
                    <form onSubmit={handleCreateUser} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">الاسم الكامل</label>
                        <input
                          type="text"
                          required
                          value={newUser.name}
                          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                          placeholder="مثال: سارة أحمد"
                          className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">البريد الإلكتروني</label>
                        <input
                          type="email"
                          required
                          value={newUser.email}
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                          placeholder="name@example.com"
                          className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">كلمة المرور المؤقتة</label>
                        <input
                          type="password"
                          required
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          placeholder="6 خانات على الأقل"
                          className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">الدور والرتبة في المنصة</label>
                        <select
                          value={newUser.role}
                          onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                          className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs font-bold"
                        >
                          <option value="USER">عضو زائر (USER) - حفظ المفضلة والتعليق</option>
                          <option value="EDITOR">محرر محتوى (EDITOR) - كتابة وإدارة المقالات والفيديوهات</option>
                          <option value="ADMIN">مدير عام (ADMIN) - صلاحيات إدارة كاملة وتحكم بالأعضاء</option>
                        </select>
                      </div>
                      <div className="pt-2 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingUser(false)}
                          className="px-4 py-2 border border-[#E7E2D8] text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-50"
                        >
                          إلغاء
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-[#36533D] hover:bg-[#2A4230] text-white text-xs font-bold rounded-xl shadow transition-all"
                        >
                          إنشاء الحساب فوراً
                        </button>
                      </div>
                    </form>
                  </Modal>
                )}

                {/* MODAL: EDIT EXISTING USER */}
                {editingUser && (
                  <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} title={`تعديل بيانات العضو: ${editingUser.name}`}>
                    <form onSubmit={handleSaveEditUser} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">الاسم الكامل</label>
                        <input
                          type="text"
                          required
                          value={editUserData.name}
                          onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                          className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">البريد الإلكتروني</label>
                        <input
                          type="email"
                          required
                          value={editUserData.email}
                          onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                          className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs font-mono focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">الرتبة والصلاحية</label>
                        <select
                          value={editUserData.role}
                          onChange={(e: any) => setEditUserData({ ...editUserData, role: e.target.value })}
                          className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs font-bold"
                        >
                          <option value="USER">عضو زائر (USER)</option>
                          <option value="EDITOR">محرر محتوى (EDITOR)</option>
                          <option value="ADMIN">مدير عام (ADMIN)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">النبذة التعريفية (Bio)</label>
                        <textarea
                          rows={2}
                          value={editUserData.bio}
                          onChange={(e) => setEditUserData({ ...editUserData, bio: e.target.value })}
                          placeholder="أخصائية نفسية، كاتبة ملهمة..."
                          className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          تعيين كلمة مرور جديدة (اختياري - اتركه فارغاً للإبقاء على الحالية)
                        </label>
                        <input
                          type="password"
                          value={editUserData.password || ''}
                          onChange={(e) => setEditUserData({ ...editUserData, password: e.target.value })}
                          placeholder="أدخل كلمة مرور جديدة إذا رغبت بتغييرها"
                          className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs focus:outline-none"
                        />
                      </div>
                      <div className="pt-2 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingUser(null)}
                          className="px-4 py-2 border border-[#E7E2D8] text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-50"
                        >
                          إلغاء
                        </button>
                        <button
                          type="submit"
                          disabled={isUpdatingUser}
                          className="px-5 py-2 bg-[#36533D] hover:bg-[#2A4230] text-white text-xs font-bold rounded-xl shadow transition-all disabled:opacity-60"
                        >
                          {isUpdatingUser ? 'جارٍ التحديث...' : 'حفظ التعديلات'}
                        </button>
                      </div>
                    </form>
                  </Modal>
                )}

                {/* MODAL: CONFIRM DELETE USER */}
                {userToDelete && (
                  <Modal isOpen={!!userToDelete} onClose={() => setUserToDelete(null)} title="تأكيد حذف حساب المستخدم">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800">
                        <AlertTriangle className="w-6 h-6 shrink-0 text-rose-600" />
                        <p className="text-xs leading-relaxed">
                          هل أنت متأكد من رغبتك في حذف حساب العضو <strong className="font-bold">"{userToDelete.name}"</strong> ({userToDelete.email})؟
                          هذا الإجراء نهائي ولا يمكن التراجع عنه.
                        </p>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setUserToDelete(null)}
                          className="px-4 py-2 border border-[#E7E2D8] text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-50"
                        >
                          إلغاء التراجع
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmDeleteUser}
                          disabled={isDeletingUser}
                          className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow transition-colors disabled:opacity-60"
                        >
                          {isDeletingUser ? 'جارٍ الحذف...' : 'تأكيد الحذف نهائياً'}
                        </button>
                      </div>
                    </div>
                  </Modal>
                )}

              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
