import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  User as UserIcon, 
  Mail, 
  Shield, 
  Camera, 
  Save, 
  ArrowRight,
  Loader2,
  Lock,
  Clock,
  Layout
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface ProfilePageProps {
  onNavigate: (path: string) => void;
}

export function ProfilePage({ onNavigate }: ProfilePageProps) {
  const { user, updateProfile, isAdmin, isSuperAdmin, isEditor } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    avatar: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        bio: user.bio || '',
        avatar: user.avatar || ''
      }));
    } else {
      // Redirect to home if not logged in
      onNavigate('/');
    }
  }, [user, onNavigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      showToast('كلمات المرور غير متطابقة', 'error');
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        name: formData.name,
        bio: formData.bio,
        avatar: formData.avatar,
        password: formData.password || undefined
      });
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (err: any) {
      showToast(err.message || 'فشل تحديث الملف الشخصي', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-[#FAF7F2] min-h-screen pb-20 pt-10" dir="rtl">
      <div className="max-w-4xl mx-auto px-4">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs font-bold text-stone-400 mb-8">
          <button onClick={() => onNavigate('/')} className="hover:text-[#36533D]">الرئيسية</button>
          <ArrowRight className="w-3 h-3" />
          <span className="text-stone-900">حسابي الشخصي</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar: Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl border border-[#E7E2D8] p-8 text-center shadow-sm"
            >
              <div className="relative inline-block mb-6">
                <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-xl mx-auto bg-stone-100">
                  <img 
                    src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-[#36533D] text-white flex items-center justify-center shadow-lg border-2 border-white cursor-pointer hover:scale-105 transition-transform">
                  <Camera className="w-5 h-5" />
                </div>
              </div>

              <h2 className="text-xl font-bold text-stone-900 mb-1">{user.name}</h2>
              <p className="text-xs text-stone-500 mb-4">{user.email}</p>

              <div className="flex flex-wrap justify-center gap-2 mb-6">
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase border ${
                  isSuperAdmin 
                    ? 'bg-amber-100 text-amber-900 border-amber-200' 
                    : isAdmin 
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                    : 'bg-stone-100 text-stone-600 border-stone-200'
                }`}>
                  {isSuperAdmin ? '🛡️ مدير عام' : isAdmin ? 'مدير نظام' : isEditor ? 'محرر محتوى' : 'عضو متابع'}
                </span>
              </div>

              <div className="pt-6 border-t border-stone-100 text-right space-y-4">
                <div className="flex items-center gap-3 text-stone-600">
                  <Clock className="w-4 h-4 text-[#36533D]" />
                  <div className="text-[11px]">
                    <p className="text-stone-400 font-bold uppercase leading-none mb-1">تاريخ الانضمام</p>
                    <p className="font-bold">{new Date(user.created_at || Date.now()).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>

                {(isAdmin || isEditor) && (
                  <button 
                    onClick={() => onNavigate('/admin')}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-stone-50 hover:bg-stone-100 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 text-stone-700">
                      <Layout className="w-4 h-4 text-[#36533D]" />
                      <span className="text-xs font-bold">لوحة الإدارة</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-[#36533D] transform rotate-180" />
                  </button>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Main Content: Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl border border-[#E7E2D8] overflow-hidden shadow-sm"
            >
              <div className="px-8 py-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                <h3 className="font-bold text-stone-900 flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-[#36533D]" />
                  إعدادات الحساب
                </h3>
                <span className="text-[10px] text-stone-400 font-black uppercase tracking-widest">تحديث البيانات</span>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-8">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-500 pr-1">الاسم الكامل</label>
                    <div className="relative">
                      <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input 
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full pr-11 pl-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#36533D]/20 focus:border-[#36533D] transition-all text-sm font-bold"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-500 pr-1">البريد الإلكتروني (لا يمكن تغييره)</label>
                    <div className="relative">
                      <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input 
                        type="email"
                        value={user.email}
                        disabled
                        className="w-full pr-11 pl-4 py-3 bg-stone-100 border border-stone-200 rounded-2xl text-stone-400 text-sm font-bold cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-500 pr-1">نبذة عني</label>
                  <textarea 
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="اكتب نبذة بسيطة عنك..."
                    rows={4}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#36533D]/20 focus:border-[#36533D] transition-all text-sm font-medium leading-relaxed"
                  />
                </div>

                {/* Avatar URL */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-500 pr-1">رابط الصورة الشخصية</label>
                  <div className="relative">
                    <Camera className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input 
                      type="url"
                      value={formData.avatar}
                      onChange={(e) => setFormData(prev => ({ ...prev, avatar: e.target.value }))}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full pr-11 pl-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#36533D]/20 focus:border-[#36533D] transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                {/* Password Change Section */}
                <div className="pt-6 border-t border-stone-100 space-y-6">
                  <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-500" />
                    تغيير كلمة المرور (اختياري)
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-500 pr-1">كلمة المرور الجديدة</label>
                      <input 
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#36533D]/20 focus:border-[#36533D] transition-all text-sm font-bold"
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-500 pr-1">تأكيد كلمة المرور</label>
                      <input 
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#36533D]/20 focus:border-[#36533D] transition-all text-sm font-bold"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-8 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-stone-400">
                    <Shield className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">جميع بياناتك مشفرة ومحمية</span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-8 py-3.5 bg-[#36533D] hover:bg-[#2A4230] text-white rounded-2xl font-bold text-sm shadow-lg shadow-[#36533D]/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>حفظ التغييرات</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
