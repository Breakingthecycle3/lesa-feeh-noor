import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Shield, 
  Lock, 
  Smartphone, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  QrCode,
  Key,
  ShieldCheck,
  RefreshCw,
  Layers,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../../context/ToastContext';

export function AdminSecurityTab() {
  const { user, hasPermission } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'personal' | 'global'>('personal');
  const [loading, setLoading] = useState(false);
  const [setupData, setSetupData] = useState<{ secret: string; qrCodeUrl: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Global security settings state
  const [globalSettings, setGlobalSettings] = useState({
    security_min_password_length: '8',
    security_require_special_char: 'true',
    security_require_number: 'true',
    security_require_uppercase: 'true',
    security_max_login_attempts: '5',
    security_lockout_duration_minutes: '15',
    security_multi_session_enabled: 'true'
  });

  const { showToast } = useToast();

  useEffect(() => {
    if (activeSubTab === 'global') {
      fetchGlobalSettings();
    }
  }, [activeSubTab]);

  const fetchGlobalSettings = async () => {
    setLoading(true);
    try {
      const { settings } = await api.getSettings();
      const settingsData = settings as any;
      setGlobalSettings(prev => ({
        ...prev,
        ...Object.keys(prev).reduce((acc, key) => {
          if (settingsData[key] !== undefined) {
            acc[key] = settingsData[key];
          }
          return acc;
        }, {} as any)
      }));
    } catch (err) {
      showToast('فشل تحميل إعدادات الأمان', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGlobalSettings = async () => {
    setLoading(true);
    try {
      await api.admin.updateSettings(globalSettings);
      showToast('تم حفظ إعدادات الأمان بنجاح', 'success');
    } catch (err) {
      showToast('فشل حفظ الإعدادات', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSetup = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.admin.setup2FA();
      setSetupData(data);
    } catch (err: any) {
      setError(err.message || 'فشل بدء إعداد المصادقة الثنائية');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length !== 6) return;

    setLoading(true);
    setError(null);
    try {
      await api.admin.verify2FASetup(verificationCode);
      setSuccess('تم تفعيل المصادقة الثنائية بنجاح!');
      setSetupData(null);
      setVerificationCode('');
      // In a real app, we might want to refresh the user context here
      window.location.reload(); 
    } catch (err: any) {
      setError(err.message || 'رمز التحقق غير صحيح');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في إيقاف المصادقة الثنائية؟ سيقلل هذا من أمان حسابك.')) return;

    setLoading(true);
    setError(null);
    try {
      await api.admin.disable2FA();
      setSuccess('تم إيقاف المصادقة الثنائية بنجاح');
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'فشل إيقاف المصادقة الثنائية');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-black text-stone-900 flex items-center gap-3">
            <Shield className="w-7 h-7 text-[#36533D]" />
            الأمان والحماية (Security)
          </h2>
          <p className="text-sm text-stone-500 mt-1">إدارة طبقات الحماية وسياسات الأمان للمنصة</p>
        </div>

        <div className="flex gap-2 bg-stone-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveSubTab('personal')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSubTab === 'personal' ? 'bg-white text-primary shadow-sm' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <Key className="w-4 h-4 inline-block ml-2" />
            حسابي (2FA)
          </button>
          {hasPermission('settings.edit') && (
            <button
              onClick={() => setActiveSubTab('global')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeSubTab === 'global' ? 'bg-white text-primary shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4 inline-block ml-2" />
              إعدادات المنصة
            </button>
          )}
        </div>
      </div>

      {activeSubTab === 'personal' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 2FA Status Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${user?.two_factor_enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-400'}`}>
                    <Smartphone className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-stone-900">المصادقة الثنائية (2FA)</h3>
                    <p className="text-stone-500 text-sm mt-1">إضافة طبقة حماية إضافية لحسابك باستخدام تطبيق Google Authenticator أو ما يماثله</p>
                  </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-xs font-black border uppercase tracking-wider ${user?.two_factor_enabled ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-stone-50 text-stone-500 border-stone-200'}`}>
                  {user?.two_factor_enabled ? 'مفعلة' : 'غير مفعلة'}
                </div>
              </div>

              <div className="mt-10">
                <AnimatePresence mode="wait">
                  {success && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-700 text-sm font-bold"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      {success}
                    </motion.div>
                  )}

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700 text-sm font-bold"
                    >
                      <AlertTriangle className="w-5 h-5" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {!user?.two_factor_enabled && !setupData && (
                  <div className="space-y-6">
                    <div className="bg-stone-50 rounded-2xl p-6 border border-dashed border-stone-200">
                      <h4 className="font-bold text-stone-800 mb-2">كيف تعمل المصادقة الثنائية؟</h4>
                      <ul className="space-y-3 text-sm text-stone-600">
                        <li className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-[#36533D] text-white text-[10px] flex items-center justify-center font-bold">1</div>
                          قم بتحميل تطبيق مصادقة (مثل Google Authenticator).
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-[#36533D] text-white text-[10px] flex items-center justify-center font-bold">2</div>
                          امسح رمز QR الذي سيظهر لك هنا.
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-[#36533D] text-white text-[10px] flex items-center justify-center font-bold">3</div>
                          أدخل الرمز المكون من 6 أرقام لتأكيد الربط.
                        </li>
                      </ul>
                    </div>
                    <button 
                      onClick={handleStartSetup}
                      disabled={loading}
                      className="w-full sm:w-auto px-8 py-4 bg-[#1C1917] text-white rounded-2xl font-black text-sm shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5 text-amber-400" />}
                      تفعيل المصادقة الثنائية الآن
                    </button>
                  </div>
                )}

                {setupData && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                      <div className="p-4 bg-white border-4 border-stone-100 rounded-3xl shadow-inner">
                        <img src={setupData.qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3 text-[#36533D]">
                          <QrCode className="w-6 h-6" />
                          <h4 className="font-black text-lg">خطوة المسح والربط</h4>
                        </div>
                        <p className="text-stone-500 text-sm leading-relaxed">
                          قم بفتح تطبيق المصادقة على هاتفك واختيار "إضافة حساب" ثم مسح الرمز المقابل. 
                          إذا لم تتمكن من المسح، استخدم الرمز السري أدناه يدوياً:
                        </p>
                        <div className="p-3 bg-stone-100 rounded-xl border border-stone-200 font-mono text-sm text-center tracking-widest font-black select-all">
                          {setupData.secret}
                        </div>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-stone-100 space-y-4">
                      <div className="flex items-center gap-3 text-stone-800">
                        <ShieldCheck className="w-6 h-6 text-emerald-600" />
                        <h4 className="font-black text-lg">تأكيد التفعيل</h4>
                      </div>
                      <form onSubmit={handleVerifySetup} className="flex flex-col sm:flex-row gap-4">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="أدخل الرمز (6 أرقام)"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                          className="flex-1 px-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-center text-2xl font-black tracking-[0.5em] focus:outline-none focus:ring-4 focus:ring-[#36533D]/10 transition-all"
                        />
                        <button 
                          type="submit"
                          disabled={loading || verificationCode.length !== 6}
                          className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-emerald-700 transition-all disabled:opacity-50"
                        >
                          {loading ? 'جارٍ التحقق...' : 'تأكيد التفعيل'}
                        </button>
                      </form>
                      <button 
                        onClick={() => setSetupData(null)}
                        className="text-stone-400 text-xs font-bold hover:text-stone-600 transition-colors"
                      >
                        إلغاء العملية
                      </button>
                    </div>
                  </motion.div>
                )}

                {user?.two_factor_enabled && (
                  <div className="space-y-6">
                    <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                      <div className="flex items-center gap-3 text-emerald-700 mb-3">
                        <ShieldCheck className="w-6 h-6" />
                        <h4 className="font-black">حسابك محمي بنجاح</h4>
                      </div>
                      <p className="text-emerald-600 text-sm leading-relaxed">
                        المصادقة الثنائية نشطة حالياً. في كل مرة تقوم فيها بتسجيل الدخول من جهاز جديد، سيُطلب منك إدخال رمز التحقق من تطبيق المصادقة الخاص بك.
                      </p>
                    </div>
                    
                    <button 
                      onClick={handleDisable}
                      disabled={loading}
                      className="px-6 py-3 border border-stone-200 text-stone-600 rounded-xl font-bold text-sm hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      إيقاف المصادقة الثنائية
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info Sidebar */}
          <div className="space-y-6">
            <div className="bg-[#36533D] text-white rounded-3xl p-8 shadow-xl">
              <h4 className="font-heading font-bold text-lg mb-4 flex items-center gap-2 text-amber-300">
                <Shield className="w-5 h-5" />
                أهمية الأمان
              </h4>
              <p className="text-sm text-stone-200 leading-relaxed mb-6">
                بصفتك مديراً للمنصة، فإن حسابك يحمل صلاحيات حساسة. المصادقة الثنائية تحمي بيانات الموقع والمستخدمين حتى في حال تسرب كلمة المرور الخاصة بك.
              </p>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-xs">حماية ضد هجمات التصيد</span>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-xs">تأمين بيانات المشتركين والمقالات</span>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-xs">الالتزام بمعايير الأمان العالمية</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Global Security Settings Form */}
            <div className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm space-y-8">
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-[#36533D]">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-900">سياسات كلمات المرور</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">الحد الأدنى لطول كلمة المرور</label>
                    <input
                      type="number"
                      min="6"
                      max="32"
                      value={globalSettings.security_min_password_length}
                      onChange={(e) => setGlobalSettings({...globalSettings, security_min_password_length: e.target.value})}
                      className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-3 pt-4 md:pt-7">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={globalSettings.security_require_special_char === 'true'}
                        onChange={(e) => setGlobalSettings({...globalSettings, security_require_special_char: String(e.target.checked)})}
                        className="w-5 h-5 rounded border-stone-300 text-primary focus:ring-primary/20"
                      />
                      <span className="text-sm font-medium text-stone-600 group-hover:text-stone-900 transition-colors">تطلب رموزاً خاصة (@#$%)</span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={globalSettings.security_require_number === 'true'}
                        onChange={(e) => setGlobalSettings({...globalSettings, security_require_number: String(e.target.checked)})}
                        className="w-5 h-5 rounded border-stone-300 text-primary focus:ring-primary/20"
                      />
                      <span className="text-sm font-medium text-stone-600 group-hover:text-stone-900 transition-colors">تطلب أرقاماً (0-9)</span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={globalSettings.security_require_uppercase === 'true'}
                        onChange={(e) => setGlobalSettings({...globalSettings, security_require_uppercase: String(e.target.checked)})}
                        className="w-5 h-5 rounded border-stone-300 text-primary focus:ring-primary/20"
                      />
                      <span className="text-sm font-medium text-stone-600 group-hover:text-stone-900 transition-colors">تطلب حروفاً كبيرة (A-Z)</span>
                    </label>
                  </div>
                </div>
              </section>

              <div className="h-px bg-stone-100" />

              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-[#36533D]">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-900">حماية الدخول (Rate Limiting)</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">أقصى عدد لمحاولات الدخول الخاطئة</label>
                    <input
                      type="number"
                      min="3"
                      max="20"
                      value={globalSettings.security_max_login_attempts}
                      onChange={(e) => setGlobalSettings({...globalSettings, security_max_login_attempts: e.target.value})}
                      className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">مدة الحظر (بالدقائق)</label>
                    <input
                      type="number"
                      min="1"
                      max="1440"
                      value={globalSettings.security_lockout_duration_minutes}
                      onChange={(e) => setGlobalSettings({...globalSettings, security_lockout_duration_minutes: e.target.value})}
                      className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>
              </section>

              <div className="h-px bg-stone-100" />

              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-[#36533D]">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-900">إدارة الجلسات</h3>
                </div>
                
                <div className="flex flex-col gap-4">
                  <label className="flex items-center gap-3 cursor-pointer group p-4 bg-stone-50 rounded-2xl border border-stone-100 hover:border-stone-200 transition-all">
                    <input
                      type="checkbox"
                      checked={globalSettings.security_multi_session_enabled === 'true'}
                      onChange={(e) => setGlobalSettings({...globalSettings, security_multi_session_enabled: String(e.target.checked)})}
                      className="w-5 h-5 rounded border-stone-300 text-primary focus:ring-primary/20"
                    />
                    <div>
                      <span className="block text-sm font-bold text-stone-800">السماح بتسجيل الدخول من عدة أجهزة في نفس الوقت</span>
                      <span className="block text-xs text-stone-500 mt-1">عند التعطيل، سيتم تسجيل خروج المستخدم من كافة الأجهزة الأخرى عند دخوله من جهاز جديد.</span>
                    </div>
                  </label>
                </div>
              </section>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleSaveGlobalSettings}
                  disabled={loading}
                  className="px-10 py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 flex items-center gap-3"
                >
                  {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  حفظ إعدادات الأمان العامة
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6">
              <div className="flex items-center gap-3 text-amber-800 mb-4">
                <AlertTriangle className="w-6 h-6" />
                <h4 className="font-bold">تنبيه إداري</h4>
              </div>
              <p className="text-sm text-amber-700 leading-relaxed">
                تعديل هذه الإعدادات يؤثر على كافة مستخدمي المنصة بشكل فوري. يرجى التأكد من إبلاغ الفريق بأي تغييرات في سياسة كلمة المرور.
              </p>
            </div>
            
            <div className="bg-stone-50 border border-stone-200 rounded-3xl p-6">
              <h4 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-stone-400" />
                إحصائيات الأمان
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-500">محاولات الدخول (24س)</span>
                  <span className="font-bold">128</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-500">الحسابات المحظورة حالياً</span>
                  <span className="font-bold">2</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-500">نسبة تفعيل 2FA</span>
                  <span className="font-bold text-emerald-600">45%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
