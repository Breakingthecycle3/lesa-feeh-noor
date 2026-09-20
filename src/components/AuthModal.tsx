import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalTab, openAuthModal, login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      if (authModalTab === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء العملية');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
    setError('');
    setIsSubmitting(true);
    try {
      await login(demoEmail, demoPass);
    } catch (err: any) {
      setError(err.message || 'فشل الدخول بالحساب التجريبي');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-[#FCFAF7] border border-[#E7E2D8] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden text-right"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E7E2D8] bg-[#FAF7F2]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#36533D]"></span>
            <h3 className="font-heading font-bold text-lg text-stone-900">
              {authModalTab === 'login' ? 'تسجيل الدخول إلى لسه في نور' : 'إنشاء حساب جديد'}
            </h3>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 p-1.5 m-5 bg-stone-200/60 rounded-xl text-sm font-medium">
          <button
            type="button"
            onClick={() => {
              setError('');
              openAuthModal('login');
            }}
            className={`py-2 rounded-lg transition-all ${
              authModalTab === 'login'
                ? 'bg-white text-stone-900 shadow-sm font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => {
              setError('');
              openAuthModal('register');
            }}
            className={`py-2 rounded-lg transition-all ${
              authModalTab === 'register'
                ? 'bg-white text-stone-900 shadow-sm font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            حساب جديد
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
              {error}
            </div>
          )}

          {authModalTab === 'register' && (
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">الاسم الكريم</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: سارة محمد"
                  className="w-full pl-3 pr-10 py-2.5 bg-white border border-[#E7E2D8] rounded-xl text-sm focus:outline-none focus:border-[#36533D] focus:ring-1 focus:ring-[#36533D] transition-all"
                />
                <User className="w-4 h-4 text-stone-400 absolute right-3.5 top-3" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">البريد الإلكتروني</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-3 pr-10 py-2.5 bg-white border border-[#E7E2D8] rounded-xl text-sm focus:outline-none focus:border-[#36533D] focus:ring-1 focus:ring-[#36533D] transition-all"
              />
              <Mail className="w-4 h-4 text-stone-400 absolute right-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">كلمة المرور</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-3 pr-10 py-2.5 bg-white border border-[#E7E2D8] rounded-xl text-sm focus:outline-none focus:border-[#36533D] focus:ring-1 focus:ring-[#36533D] transition-all"
              />
              <Lock className="w-4 h-4 text-stone-400 absolute right-3.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-[#36533D] hover:bg-[#2A4230] text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            {isSubmitting ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>{authModalTab === 'login' ? 'دخول' : 'تأكيد الحساب والانضمام'}</span>
                <ArrowLeft className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
