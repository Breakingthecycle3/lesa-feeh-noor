import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles } from 'lucide-react';
import { MoodSelector } from './MoodSelector';
import { MoodKey } from '../types';

interface MoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
  initialMood?: MoodKey;
}

export function MoodModal({
  isOpen,
  onClose,
  onNavigate,
  initialMood = 'calm'
}: MoodModalProps) {
  if (!isOpen) return null;

  const handleNavigateAndClose = (path: string) => {
    onClose();
    onNavigate(path);
  };

  return (
    <AnimatePresence>
      <div
        id="mood-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-sm overflow-y-auto"
        dir="rtl"
        onClick={onClose}
      >
        <motion.div
          id="mood-modal-content"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#E7E2D8] overflow-hidden my-6 max-h-[90vh] flex flex-col"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E2D8] bg-[#FAF7F2] shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#36533D]/10 text-[#36533D] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="font-heading font-bold text-stone-900 text-base sm:text-lg">
                بوصلة مشاعرك قبل القراءة
              </h3>
            </div>

            <button
              onClick={onClose}
              id="close-mood-modal"
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body with MoodSelector */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1">
            <MoodSelector
              onNavigate={handleNavigateAndClose}
              initialMood={initialMood}
              showTitle={false}
              className="border-0 p-0 shadow-none bg-transparent"
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
