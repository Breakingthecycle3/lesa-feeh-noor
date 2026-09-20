import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ArrowLeft,
  Compass,
  BookOpen,
  Quote,
  Clock,
  ChevronLeft,
  Heart,
  RotateCcw
} from 'lucide-react';
import { MoodKey, MoodRecommendationData, Article, Journey } from '../types';
import { MOODS } from '../data/moods';
import { api } from '../lib/api';

interface MoodSelectorProps {
  onNavigate: (path: string) => void;
  initialMood?: MoodKey;
  showTitle?: boolean;
  className?: string;
  onSelectMood?: (moodKey: MoodKey) => void;
}

export function MoodSelector({
  onNavigate,
  initialMood = 'calm',
  showTitle = true,
  className = '',
  onSelectMood
}: MoodSelectorProps) {
  const [selectedMood, setSelectedMood] = useState<MoodKey>(initialMood);
  const [data, setData] = useState<MoodRecommendationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load recommendations when selectedMood changes
  useEffect(() => {
    let isCurrent = true;
    setLoading(true);

    api.getMoodRecommendations(selectedMood)
      .then((res) => {
        if (isCurrent) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Failed to load mood recommendations, falling back to local data', err);
        if (isCurrent) {
          const currentConfig = MOODS.find((m) => m.id === selectedMood) || MOODS[0];
          setData({
            mood: currentConfig,
            articles: [],
            journeys: [],
            messages: []
          });
          setLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedMood]);

  const handleMoodSelect = (moodId: MoodKey) => {
    setSelectedMood(moodId);
    if (onSelectMood) {
      onSelectMood(moodId);
    }
  };

  const activeMoodConfig = MOODS.find((m) => m.id === selectedMood) || MOODS[0];

  return (
    <section
      id="mood-discovery-section"
      className={`relative overflow-hidden rounded-3xl border border-[#E7E2D8] bg-[#FDFBF7] p-6 sm:p-8 md:p-10 shadow-sm text-right ${className}`}
      dir="rtl"
    >
      {/* Background ambient gradient glow */}
      <div className="absolute -top-16 -right-16 w-64 h-64 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header section */}
      {showTitle && (
        <div className="max-w-3xl mb-8 space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#36533D]/10 text-[#36533D] font-bold text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>بوصلة المشاعر والسكينة</span>
          </div>

          <h2 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-stone-900 leading-tight">
            قبل أن تبدأ القراءة... <span className="text-[#36533D]">كيف تشعر الآن؟</span>
          </h2>

          <p className="font-body text-sm sm:text-base text-stone-600 leading-relaxed">
            اختاري حالتك النفسية أو ما تبحث عنه روحك في هذه اللحظة، لنقترح لكِ مقالات ورحلات تعافٍ تلمس قلبك وتهدئ سريرتك.
          </p>
        </div>
      )}

      {/* Mood Options Buttons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 mb-8 relative z-10">
        {MOODS.map((m) => {
          const isSelected = selectedMood === m.id;
          return (
            <button
              key={m.id}
              type="button"
              id={`mood-btn-${m.id}`}
              onClick={() => handleMoodSelect(m.id)}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all text-right cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
                isSelected
                  ? 'bg-white border-[#36533D] shadow-md ring-2 ring-[#36533D]/15'
                  : 'bg-white/70 hover:bg-white border-[#E7E2D8] hover:border-stone-400/60 shadow-xs'
              }`}
            >
              {/* Selected indicator top bar */}
              {isSelected && (
                <motion.div
                  layoutId="activeMoodPill"
                  className="absolute top-0 left-0 right-0 h-1 bg-[#36533D]"
                />
              )}

              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-2xl transform group-hover:scale-110 transition-transform">
                  {m.emoji}
                </span>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-[#36533D] animate-ping" />
                )}
              </div>

              <div>
                <h4
                  className={`font-heading font-bold text-xs sm:text-sm leading-snug transition-colors ${
                    isSelected ? 'text-[#36533D]' : 'text-stone-800'
                  }`}
                >
                  {m.label}
                </h4>
                <p className="text-[11px] text-stone-500 mt-1 line-clamp-2 leading-relaxed hidden sm:block">
                  {m.sublabel}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Mood Focus Box & Quote */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedMood}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className="relative z-10"
        >
          {/* Calm Quote Banner for the mood */}
          <div
            className={`p-5 sm:p-6 rounded-2xl border mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${activeMoodConfig.accentBg} ${activeMoodConfig.borderColor}`}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/80 border border-white/90 flex items-center justify-center shrink-0 text-stone-700 shadow-xs">
                <Quote className="w-5 h-5 text-[#36533D]" />
              </div>
              <div>
                <p className="font-heading font-bold text-sm sm:text-base text-stone-900 leading-relaxed">
                  "{data?.mood?.quote?.text || activeMoodConfig.quote.text}"
                </p>
                <span className="text-xs text-stone-500 font-medium mt-1 block">
                  — {data?.mood?.quote?.author || activeMoodConfig.quote.author}
                </span>
              </div>
            </div>

            <button
              onClick={() => onNavigate(`/articles?mood=${selectedMood}`)}
              id="view-all-mood-articles"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-stone-50 text-[#36533D] border border-[#E7E2D8] font-bold text-xs shadow-xs transition-all shrink-0 cursor-pointer"
            >
              <span>عرض كافة موضوعات {activeMoodConfig.label}</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Recommendations Content Grid */}
          <div className="space-y-8">
            {/* 1. Recommended Articles */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#36533D]" />
                  <h3 className="font-heading font-bold text-base sm:text-lg text-stone-900">
                    مقالات مقترحة تناسب هذا الشعور
                  </h3>
                </div>
                <button
                  onClick={() => onNavigate(`/articles?mood=${selectedMood}`)}
                  className="text-xs font-bold text-[#36533D] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>المزيد</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-44 rounded-2xl bg-stone-200/60 animate-pulse"
                    />
                  ))}
                </div>
              ) : data?.articles && data.articles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.articles.slice(0, 3).map((article) => (
                    <div
                      key={article.id}
                      id={`mood-article-${article.slug}`}
                      onClick={() => onNavigate(`/articles/${article.slug}`)}
                      className="group bg-white rounded-2xl border border-[#E7E2D8] p-4 hover:border-[#36533D]/40 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div className="flex items-start gap-3.5 mb-3">
                        {article.featured_image && (
                          <img
                            src={article.featured_image}
                            alt={article.title}
                            className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0 border border-stone-200"
                            loading="lazy"
                          />
                        )}
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-[#36533D] px-2 py-0.5 rounded-md bg-[#36533D]/8 inline-block">
                            {article.category_name || 'الوعي النفسي'}
                          </span>
                          <h4 className="font-heading font-bold text-sm text-stone-900 line-clamp-2 group-hover:text-[#36533D] transition-colors leading-snug">
                            {article.title}
                          </h4>
                        </div>
                      </div>

                      <p className="text-xs text-stone-500 line-clamp-2 mb-3 leading-relaxed">
                        {article.excerpt}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-[11px] text-stone-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-400" />
                          <span>{article.reading_time} دقائق قراءة</span>
                        </span>
                        <span className="text-[#36533D] font-bold flex items-center gap-1 group-hover:translate-x-[-2px] transition-transform">
                          <span>اقرأ الآن</span>
                          <ArrowLeft className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 px-4 bg-white/60 rounded-2xl border border-dashed border-[#E7E2D8]">
                  <p className="text-sm text-stone-500">
                    جاري تحديث المقالات المناسبة لهذه الحالة النفسية.. يمكنك استكشاف كافة الموضوعات.
                  </p>
                  <button
                    onClick={() => onNavigate('/articles')}
                    className="mt-3 px-4 py-2 rounded-xl bg-[#36533D] text-white text-xs font-bold shadow-xs hover:bg-[#2A4230] transition cursor-pointer"
                  >
                    تصفح مكتبة المقالات
                  </button>
                </div>
              )}
            </div>

            {/* 2. Recommended Journeys */}
            {data?.journeys && data.journeys.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-[#36533D]" />
                    <h3 className="font-heading font-bold text-base sm:text-lg text-stone-900">
                      رحلات تعافٍ إرشادية مقترحة
                    </h3>
                  </div>
                  <button
                    onClick={() => onNavigate('/journeys')}
                    className="text-xs font-bold text-[#36533D] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>كافة الرحلات</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.journeys.slice(0, 2).map((journey) => (
                    <div
                      key={journey.id}
                      id={`mood-journey-${journey.slug}`}
                      onClick={() => onNavigate(`/journeys/${journey.slug}`)}
                      className="group bg-white rounded-2xl border border-[#E7E2D8] p-4 sm:p-5 hover:border-[#36533D]/40 hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row items-center gap-4"
                    >
                      {journey.cover_image && (
                        <img
                          src={journey.cover_image}
                          alt={journey.title}
                          className="w-full sm:w-28 h-28 rounded-xl object-cover shrink-0 border border-stone-200"
                          loading="lazy"
                        />
                      )}
                      <div className="flex-1 space-y-2 w-full">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-amber-800 px-2 py-0.5 rounded-full bg-amber-100">
                            {journey.steps_count || 6} محطات إرشادية
                          </span>
                          <span className="text-xs text-stone-400">
                            {journey.category_name || 'رحلة تعافي'}
                          </span>
                        </div>

                        <h4 className="font-heading font-bold text-sm sm:text-base text-stone-900 group-hover:text-[#36533D] transition-colors leading-snug">
                          {journey.title}
                        </h4>

                        <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                          {journey.description}
                        </p>

                        <div className="pt-1 flex items-center gap-1 text-xs font-bold text-[#36533D]">
                          <span>ابدأ الرحلة خطوة بخطوة</span>
                          <ArrowLeft className="w-3.5 h-3.5 group-hover:translate-x-[-3px] transition-transform" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
