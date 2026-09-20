import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Quote as QuoteIcon,
  X,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Share2,
  ArrowLeft,
  BookOpen,
  MessageSquareHeart,
  Heart
} from 'lucide-react';
import { InspiringQuote } from '../types';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';

interface InspiringQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export function InspiringQuoteModal({
  isOpen,
  onClose,
  onNavigate
}: InspiringQuoteModalProps) {
  const { showToast } = useToast();
  const [quote, setQuote] = useState<InspiringQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dontShowToday, setDontShowToday] = useState(false);
  const [liked, setLiked] = useState(false);

  // Fetch initial or random quote when opened
  useEffect(() => {
    if (isOpen) {
      // Check if user previously marked don't show today
      const todayStr = new Date().toISOString().split('T')[0];
      const savedDismissDate = localStorage.getItem('lesanour_quote_dismissed_date');
      setDontShowToday(savedDismissDate === todayStr);

      if (!quote) {
        fetchRandomQuote();
      }
    }
  }, [isOpen]);

  const fetchRandomQuote = async (excludeCurrent = true) => {
    setLoading(true);
    try {
      const res = await api.getRandomQuote(excludeCurrent && quote ? quote.id : undefined);
      if (res.quote) {
        setQuote(res.quote);
        setLiked(false);
      }
    } catch (err) {
      // Fallback peaceful quote
      setQuote({
        id: 'fallback-quote',
        text: 'أنت لست ما حدث لك.. أنت القوة التي اختارت أن تنهض بعد كل انكسار. تذكري دائماً أن لطف الله يحيط بك من حيث لا تشعرين.',
        title: 'رسائل لسه في نور',
        author: 'فريق لسه في نور',
        category: 'السكينة والسلام',
        sourceType: 'message',
        url: '/messages'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!quote) return;
    const textToCopy = `«${quote.text}»\n— ${quote.author} (${quote.title})\nمنصة لسه في نور: ${window.location.origin}${quote.url}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      showToast('تم نسخ الاقتباس إلى الحافظة بنجاح ✨', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('تعذر نسخ الاقتباس تلقائياً', 'error');
    }
  };

  const handleShare = async () => {
    if (!quote) return;
    const shareData = {
      title: quote.title,
      text: `«${quote.text}»\n— ${quote.author}`,
      url: `${window.location.origin}${quote.url}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or unsupported
      }
    } else {
      handleCopy();
    }
  };

  const handleDismissToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setDontShowToday(isChecked);
    const todayStr = new Date().toISOString().split('T')[0];
    if (isChecked) {
      localStorage.setItem('lesanour_quote_dismissed_date', todayStr);
      showToast('لن يظهر الاقتباس تلقائياً لبقية هذا اليوم (يمكنك فتحه في أي وقت من القائمة)', 'info');
    } else {
      localStorage.removeItem('lesanour_quote_dismissed_date');
    }
  };

  const handleNavigate = (path: string) => {
    onClose();
    onNavigate(path);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="inspiring-quote-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/40 backdrop-blur-xs overflow-y-auto"
        dir="rtl"
        onClick={onClose}
      >
        <motion.div
          id="inspiring-quote-modal-content"
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#E7E2D8] overflow-hidden my-6 flex flex-col"
        >
          {/* Subtle Ambient Decorative Header Background */}
          <div className="relative bg-gradient-to-r from-[#36533D] via-[#2A4230] to-[#1C1917] text-white px-6 py-5 overflow-hidden">
            {/* Background Aura */}
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 right-10 w-40 h-40 bg-emerald-400/15 rounded-full blur-2xl pointer-events-none" />

            <div className="relative flex items-center justify-between z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shadow-inner">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-extrabold text-white text-base sm:text-lg">
                      قبس من النور لقلبك
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-amber-400/25 border border-amber-300/40 text-amber-200 text-[10px] font-bold">
                      اقتباس ملهم
                    </span>
                  </div>
                  <p className="text-stone-300 text-xs mt-0.5 font-normal">
                    رسالة هادئة ترافقك وتبث الأمل في روحك اليوم
                  </p>
                </div>
              </div>

              <button
                id="close-inspiring-quote-modal"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quote Body Card */}
          <div className="p-6 sm:p-8 bg-[#FAF7F2]/60 relative flex-1 flex flex-col">
            {/* Decorative Giant Quotation Mark */}
            <QuoteIcon className="absolute top-4 right-6 w-16 h-16 text-[#36533D]/10 pointer-events-none rotate-180" />

            {loading ? (
              <div className="min-h-[180px] flex flex-col items-center justify-center gap-3 py-10">
                <RefreshCw className="w-7 h-7 text-[#36533D] animate-spin" />
                <p className="text-xs text-stone-500 font-medium">جاري اختيار اقتباس ملهم لقلبك...</p>
              </div>
            ) : quote ? (
              <div className="flex flex-col justify-between flex-1 relative z-10">
                {/* Category & Source Type Tag */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#36533D]/10 text-[#36533D] border border-[#36533D]/20">
                      {quote.sourceType === 'article' ? (
                        <BookOpen className="w-3.5 h-3.5" />
                      ) : (
                        <MessageSquareHeart className="w-3.5 h-3.5" />
                      )}
                      <span>{quote.category}</span>
                    </span>
                    <span className="text-[11px] text-stone-400 font-medium">
                      {quote.sourceType === 'article' ? 'مقتبس من مقال' : 'من رسائل المنصة'}
                    </span>
                  </div>

                  {/* Favorite / Heart Reaction */}
                  <button
                    onClick={() => {
                      setLiked(!liked);
                      if (!liked) {
                        showToast('أضيف إلى اقتباساتك المفضلة اليوم ✨', 'success');
                      }
                    }}
                    className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                      liked
                        ? 'text-rose-500 bg-rose-50'
                        : 'text-stone-400 hover:text-rose-500 hover:bg-stone-100'
                    }`}
                    title={liked ? 'في المفضلة' : 'أعجبني هذا الاقتباس'}
                  >
                    <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Quote Text */}
                <div className="my-3 sm:my-4">
                  <blockquote className="text-stone-800 text-lg sm:text-xl font-heading leading-relaxed tracking-normal font-semibold text-right">
                    «{quote.text}»
                  </blockquote>
                </div>

                {/* Attribution & Source Info */}
                <div className="pt-4 border-t border-[#E7E2D8] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-stone-500 font-medium">المصدر: </span>
                    <button
                      onClick={() => handleNavigate(quote.url)}
                      className="font-bold text-[#36533D] hover:underline hover:text-[#2A4230] transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>{quote.title}</span>
                      <ArrowLeft className="w-3 h-3 rotate-45" />
                    </button>
                  </div>

                  <div className="text-stone-400 font-medium">
                    بقلم: <span className="text-stone-700 font-bold">{quote.author}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Action Buttons Bar */}
          <div className="px-6 py-4 bg-white border-t border-[#E7E2D8] flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Another Quote Button */}
                <button
                  id="inspiring-quote-refresh-btn"
                  onClick={() => fetchRandomQuote(true)}
                  disabled={loading}
                  className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60"
                  title="سحب اقتباس ملهم آخر"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#36533D] ${loading ? 'animate-spin' : ''}`} />
                  <span>اقتباس آخر ✨</span>
                </button>

                {/* Copy Quote Button */}
                <button
                  id="inspiring-quote-copy-btn"
                  onClick={handleCopy}
                  className="px-3 py-2 rounded-xl border border-[#E7E2D8] hover:bg-stone-50 text-stone-600 font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="نسخ نص الاقتباس"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">تم النسخ</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-stone-500" />
                      <span>نسخ</span>
                    </>
                  )}
                </button>

                {/* Share Button */}
                <button
                  id="inspiring-quote-share-btn"
                  onClick={handleShare}
                  className="p-2 rounded-xl border border-[#E7E2D8] hover:bg-stone-50 text-stone-600 transition-all cursor-pointer"
                  title="مشاركة الاقتباس"
                >
                  <Share2 className="w-3.5 h-3.5 text-stone-500" />
                </button>
              </div>

              {/* Source Reading Button */}
              {quote && (
                <button
                  id="inspiring-quote-read-source-btn"
                  onClick={() => handleNavigate(quote.url)}
                  className="px-4 py-2 rounded-xl bg-[#36533D] hover:bg-[#2A4230] text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <span>قراءة المصدر كاملاً</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Don't show again today check & Close */}
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={dontShowToday}
                  onChange={handleDismissToggle}
                  className="w-3.5 h-3.5 text-[#36533D] rounded border-stone-300 focus:ring-[#36533D] cursor-pointer"
                />
                <span className="text-[11px] text-stone-600">عدم الإظهار تلقائياً لبقية اليوم</span>
              </label>

              <button
                onClick={onClose}
                id="inspiring-quote-close-preview-btn"
                className="text-xs font-bold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>إغلاق ومعاينة الموقع والتعديلات</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
