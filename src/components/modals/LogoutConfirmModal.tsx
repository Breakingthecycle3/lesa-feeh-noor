import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LogoutConfirmModalProps {
  onConfirm: () => void;
}

export function LogoutConfirmModal({ onConfirm }: LogoutConfirmModalProps) {
  const { isLogoutModalOpen, closeLogoutModal } = useAuth();

  const handleConfirm = () => {
    onConfirm();
    closeLogoutModal();
  };

  return (
    <AnimatePresence>
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLogoutModal}
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-100"
          >
            {/* Header / Accent bar */}
            <div className="h-2 bg-rose-500" />
            
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
                  <LogOut className="w-6 h-6" />
                </div>
                <button
                  onClick={closeLogoutModal}
                  className="p-2 hover:bg-stone-50 rounded-xl transition-colors text-stone-400 hover:text-stone-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 mb-8">
                <h3 className="text-2xl font-bold text-stone-900 leading-tight">
                  تأكيد تسجيل الخروج
                </h3>
                <p className="text-stone-500 leading-relaxed">
                  هل أنت متأكد من رغبتك في تسجيل الخروج؟ ستحتاج إلى إدخال بياناتك مرة أخرى عند العودة.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row-reverse gap-3">
                <button
                  onClick={handleConfirm}
                  className="flex-1 px-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-rose-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>تأكيد الخروج</span>
                </button>
                <button
                  onClick={closeLogoutModal}
                  className="flex-1 px-6 py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] cursor-pointer"
                >
                  تراجع
                </button>
              </div>
            </div>

            {/* Security Tip */}
            <div className="px-8 py-4 bg-stone-50 border-t border-stone-100 flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-stone-400" />
              <span className="text-[10px] text-stone-400 font-medium uppercase tracking-wider">
                نصيحة أمان: لا تترك حسابك مفتوحاً على الأجهزة العامة
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
