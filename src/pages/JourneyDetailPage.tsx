import React, { useState, useEffect } from 'react';
import {
  Compass,
  CheckCircle2,
  Circle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  HelpCircle,
  PenTool,
  Save,
  Check,
  PanelRightClose,
  PanelRightOpen,
  BookOpen,
  ListOrdered,
  ChevronDown,
  Bookmark,
  Share2,
  Clock,
  Layers,
  FileText
} from 'lucide-react';
import { Journey, JourneyStep } from '../types';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { Breadcrumbs, LoadingState, ErrorState, SEOHead } from '../components/Common';

export function JourneyDetailPage({
  slug,
  onNavigate
}: {
  slug: string;
  onNavigate: (path: string) => void;
}) {
  const { showToast } = useToast();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [steps, setSteps] = useState<JourneyStep[]>([]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Reader Controls
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileStepsOpen, setIsMobileStepsOpen] = useState(false);
  const [readingMode, setReadingMode] = useState<'step' | 'full'>('step');
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'huge'>('normal');

  // Local reflections state & progress
  const [reflections, setReflections] = useState<Record<number, string>>({});
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getJourney(slug)
      .then((res) => {
        setJourney(res.journey);
        setSteps(res.steps || []);

        // Load local progress
        const savedProgress = localStorage.getItem(`journey_progress_${slug}`);
        if (savedProgress) {
          try {
            const parsed = JSON.parse(savedProgress);
            setCompletedSteps(parsed.completed || []);
            setReflections(parsed.reflections || {});
          } catch {}
        }

        // Check if journey is bookmarked
        const bookmarks = localStorage.getItem('lesanour_saved_journeys');
        if (bookmarks) {
          try {
            const parsed = JSON.parse(bookmarks);
            setIsSaved(parsed.includes(slug));
          } catch {}
        }
      })
      .catch((err) => setError(err.message || 'تعذر تحميل بيانات الرحلة'))
      .finally(() => setLoading(false));
  }, [slug]);

  const saveReflection = (stepIdx: number, text: string) => {
    const updated = { ...reflections, [stepIdx]: text };
    setReflections(updated);

    const progressData = {
      completed: completedSteps,
      reflections: updated
    };
    localStorage.setItem(`journey_progress_${slug}`, JSON.stringify(progressData));
    showToast('تم حفظ تأملاتكِ الشخصية بنجاح 🤍', 'success');
  };

  const toggleStepCompleted = (stepIdx: number) => {
    let updated: number[];
    if (completedSteps.includes(stepIdx)) {
      updated = completedSteps.filter((idx) => idx !== stepIdx);
    } else {
      updated = [...completedSteps, stepIdx];
      showToast('مبارك! أنجزتِ هذه المحطة في مسار تعافيكِ 🌱', 'success');
    }
    setCompletedSteps(updated);

    const progressData = {
      completed: updated,
      reflections
    };
    localStorage.setItem(`journey_progress_${slug}`, JSON.stringify(progressData));
  };

  const toggleBookmark = () => {
    try {
      const raw = localStorage.getItem('lesanour_saved_journeys');
      let current: string[] = raw ? JSON.parse(raw) : [];
      let nextState = false;
      if (current.includes(slug)) {
        current = current.filter((s) => s !== slug);
        nextState = false;
        showToast('تمت إزالة الرحلة من المفضلة', 'info');
      } else {
        current.push(slug);
        nextState = true;
        showToast('تم حفظ الرحلة في قائمتكِ المفضلة 🤍', 'success');
      }
      localStorage.setItem('lesanour_saved_journeys', JSON.stringify(current));
      setIsSaved(nextState);
    } catch {}
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: journey?.title || 'رحلة تعافي',
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('تم نسخ رابط الرحلة للمشاركة', 'success');
    }
  };

  if (loading) {
    return <LoadingState message="نجهز لكِ محطات الرحلة بكل حب..." />;
  }

  if (error || !journey) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-right" dir="rtl">
        <ErrorState
          message={error || 'الرحلة المطلوبة غير متوفرة'}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const currentStep = steps[activeStepIndex];
  const progressPercent = steps.length > 0 ? Math.round((completedSteps.length / steps.length) * 100) : 0;

  const fontClass =
    fontSize === 'huge'
      ? 'text-lg sm:text-xl leading-loose'
      : fontSize === 'large'
      ? 'text-base sm:text-lg leading-relaxed'
      : 'text-sm sm:text-base leading-relaxed';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 text-right" dir="rtl">
      <SEOHead
        title={`${journey.title} | لسه في نور`}
        description={journey.description}
      />

      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <Breadcrumbs
          items={[
            { label: 'الرئيسية', path: '/' },
            { label: 'رحلات التعافي', path: '/journeys' },
            { label: journey.title }
          ]}
          onNavigate={onNavigate}
        />

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleBookmark}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
              isSaved
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : 'bg-white text-stone-600 border-[#E7E2D8] hover:bg-stone-50'
            }`}
            title="حفظ الرحلة"
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-500 text-amber-500' : ''}`} />
            <span className="hidden sm:inline">{isSaved ? 'محفوظة' : 'حفظ'}</span>
          </button>

          <button
            onClick={handleShare}
            className="px-3 py-1.5 rounded-xl text-xs font-bold border border-[#E7E2D8] bg-white text-stone-600 hover:bg-stone-50 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="مشاركة"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">مشاركة</span>
          </button>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-stone-900 border border-[#E7E2D8] mb-8 shadow-sm">
        <div className="relative aspect-[21/9] sm:aspect-[24/8] max-h-72 w-full">
          <img
            src={journey.cover_image}
            alt={journey.title}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent"></div>

          <div className="absolute bottom-6 right-6 left-6 text-white max-w-2xl">
            <span className="px-3 py-1 bg-[#36533D] text-xs font-bold rounded-full mb-3 inline-flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" />
              رحلة إرشادية بالخطوات
            </span>
            <h1 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl mb-2 leading-tight">
              {journey.title}
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-xl">
              {journey.description}
            </p>
          </div>
        </div>
      </div>

      {/* Journey Stats & Progress Bar */}
      <div className="p-4 bg-white border border-[#E7E2D8] rounded-2xl mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
        <div className="flex-1 w-full">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="text-stone-700">إنجازكِ في هذه الرحلة</span>
            <span className="text-[#36533D]">{progressPercent}% مكتمل</span>
          </div>
          <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#36533D] rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-stone-500 shrink-0 font-medium">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#36533D]" />
            {completedSteps.length} من {steps.length} محطات
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            نحو 15 دقيقة قراءة وتأمل
          </span>
        </div>
      </div>

      {/* Mobile Step Selector Bar - Non-sticky, compact and never obscures content */}
      <div className="lg:hidden bg-white border border-[#E7E2D8] rounded-2xl p-3 mb-6 shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-7 h-7 rounded-full bg-[#36533D]/10 text-[#36533D] text-xs flex items-center justify-center font-bold shrink-0">
              {activeStepIndex + 1}
            </span>
            <div className="min-w-0">
              <span className="text-[10px] text-stone-400 block font-medium">
                المحطة الحالية ({activeStepIndex + 1} من {steps.length}):
              </span>
              <span className="text-xs font-bold text-stone-900 truncate block">
                {currentStep?.title}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsMobileStepsOpen(!isMobileStepsOpen)}
              className="px-3 py-1.5 bg-[#FAF7F2] hover:bg-stone-100 text-stone-700 text-xs font-bold rounded-xl border border-[#E7E2D8] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>{isMobileStepsOpen ? 'إغلاق القائمة' : 'تغيير المحطة'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMobileStepsOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Collapsible Mobile Steps List */}
        {isMobileStepsOpen && (
          <div className="mt-3 pt-3 border-t border-stone-100 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 mb-1 px-1">
              <span>اختر محطة للانتقال إليها:</span>
              <button
                onClick={() => setIsMobileStepsOpen(false)}
                className="text-stone-400 hover:text-stone-600 underline"
              >
                إخفاء
              </button>
            </div>
            {steps.map((step, idx) => {
              const isActive = idx === activeStepIndex && readingMode === 'step';
              const isDone = completedSteps.includes(idx);
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveStepIndex(idx);
                    setReadingMode('step');
                    setIsMobileStepsOpen(false);
                  }}
                  className={`w-full text-right p-2.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                    isActive
                      ? 'bg-[#36533D] text-white font-bold'
                      : 'hover:bg-stone-50 text-stone-700 bg-stone-50/60'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-bold shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="truncate">{step.title}</span>
                  </div>
                  {isDone && (
                    <CheckCircle2
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? 'text-emerald-300' : 'text-[#36533D]'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Desktop Step Navigation Sidebar (Only rendered on desktop, never sticks on mobile, toggleable) */}
        {isSidebarOpen && (
          <aside className="hidden lg:block lg:col-span-4 bg-white border border-[#E7E2D8] rounded-3xl p-5 space-y-3 lg:sticky lg:top-24 shadow-2xs transition-all">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#36533D]/10 text-[#36533D] flex items-center justify-center">
                  <ListOrdered className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-stone-900 leading-none">
                    محطات الرحلة
                  </h3>
                  <span className="text-[11px] text-stone-400">
                    {steps.length} محطات للتعافي
                  </span>
                </div>
              </div>

              {/* Hide Sidebar Button */}
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="px-2 py-1 text-xs text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                title="إخفاء نافذة المحطات للقراءة بتركيز"
              >
                <PanelRightClose className="w-3.5 h-3.5" />
                <span className="text-[11px]">إخفاء</span>
              </button>
            </div>

            <div className="space-y-1.5 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
              {steps.map((step, idx) => {
                const isActive = idx === activeStepIndex && readingMode === 'step';
                const isDone = completedSteps.includes(idx);
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveStepIndex(idx);
                      setReadingMode('step');
                    }}
                    className={`w-full text-right p-3 rounded-2xl transition-all flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'bg-[#36533D] text-white font-bold shadow-sm'
                        : 'hover:bg-stone-50 text-stone-700 border border-transparent hover:border-stone-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold shrink-0 ${
                          isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="truncate text-xs sm:text-sm font-medium">
                        {step.title}
                      </span>
                    </div>
                    {isDone && (
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-emerald-300' : 'text-[#36533D]'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Read All Steps continuous mode shortcut */}
            <div className="pt-3 border-t border-stone-100">
              <button
                onClick={() => setReadingMode('full')}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                  readingMode === 'full'
                    ? 'bg-[#36533D]/10 text-[#36533D] border-[#36533D]/20'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>قراءة الموضوع كاملاً كدليل متصل</span>
              </button>
            </div>
          </aside>
        )}

        {/* Main Content Area */}
        <main
          className={`${
            isSidebarOpen ? 'lg:col-span-8' : 'lg:col-span-12 max-w-4xl mx-auto w-full'
          } bg-white border border-[#E7E2D8] rounded-3xl p-6 sm:p-10 shadow-2xs transition-all`}
        >
          {/* Reader Top Controls Toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-3 pb-6 mb-6 border-b border-stone-100">
            {/* View Mode Switcher */}
            <div className="inline-flex p-1 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs font-bold">
              <button
                onClick={() => setReadingMode('step')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  readingMode === 'step'
                    ? 'bg-[#36533D] text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>محطة بمحطة ({activeStepIndex + 1}/{steps.length})</span>
              </button>

              <button
                onClick={() => setReadingMode('full')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  readingMode === 'full'
                    ? 'bg-[#36533D] text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>قراءة الموضوع كاملاً</span>
              </button>
            </div>

            {/* Font Size & Sidebar Toggle */}
            <div className="flex items-center gap-2">
              {/* Desktop Show Sidebar Pill if hidden */}
              {!isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF7F2] hover:bg-stone-100 text-[#36533D] border border-[#E7E2D8] rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="عرض نافذة محطات الرحلة"
                >
                  <PanelRightOpen className="w-3.5 h-3.5" />
                  <span>عرض محطات الرحلة ({steps.length})</span>
                </button>
              )}

              {/* Font Size Controls */}
              <div className="inline-flex items-center bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl p-1 text-xs">
                <button
                  onClick={() => setFontSize('normal')}
                  className={`px-2 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                    fontSize === 'normal' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
                  }`}
                  title="خط عادي"
                >
                  A
                </button>
                <button
                  onClick={() => setFontSize('large')}
                  className={`px-2 py-1 rounded-lg font-bold cursor-pointer transition-colors text-sm ${
                    fontSize === 'large' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
                  }`}
                  title="خط متوسط"
                >
                  A+
                </button>
                <button
                  onClick={() => setFontSize('huge')}
                  className={`px-2 py-1 rounded-lg font-bold cursor-pointer transition-colors text-base ${
                    fontSize === 'huge' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
                  }`}
                  title="خط كبير مريح"
                >
                  A++
                </button>
              </div>
            </div>
          </div>

          {/* VIEW MODE 1: STEP-BY-STEP READING */}
          {readingMode === 'step' && currentStep && (
            <div className="space-y-8">
              {/* Step Header */}
              <div>
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#36533D] px-3 py-1 bg-[#36533D]/10 rounded-full">
                      المحطة رقم {activeStepIndex + 1} من {steps.length}
                    </span>
                    <span className="text-xs text-stone-400 font-medium">
                      خطوات التعافي والتحرر
                    </span>
                  </div>

                  <button
                    onClick={() => toggleStepCompleted(activeStepIndex)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                      completedSteps.includes(activeStepIndex)
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {completedSteps.includes(activeStepIndex) ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>محطة مكتملة</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-3.5 h-3.5" />
                        <span>تحديد كمكتملة</span>
                      </>
                    )}
                  </button>
                </div>

                <h2 className="font-heading font-black text-2xl sm:text-3xl text-stone-900 mb-6 leading-snug">
                  {currentStep.title}
                </h2>

                {/* Editorial Topic Reading Body */}
                <div className={`text-stone-800 ${fontClass} whitespace-pre-line space-y-4`}>
                  <p className="p-4 sm:p-6 bg-[#FAF7F2] rounded-2xl border-r-4 border-[#36533D] text-stone-900 font-medium">
                    {currentStep.explanation}
                  </p>
                </div>
              </div>

              {/* Practical Exercises */}
              {currentStep.exercises && currentStep.exercises.length > 0 && (
                <div className="p-5 sm:p-6 bg-emerald-50/50 border border-emerald-100 rounded-3xl">
                  <h4 className="font-heading font-bold text-sm sm:text-base text-[#36533D] mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>تطبيق عملي وخطوات واقعية لهذه المحطة:</span>
                  </h4>
                  <ul className="space-y-3 text-xs sm:text-sm text-stone-800">
                    {currentStep.exercises.map((ex, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#36533D] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{ex}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Reflection Questions */}
              {currentStep.questions && currentStep.questions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-heading font-bold text-sm sm:text-base text-stone-900 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-amber-500" />
                    <span>أسئلة للتأمل العميق وكتابة الحقيقة:</span>
                  </h4>
                  <div className="grid grid-cols-1 gap-2.5">
                    {currentStep.questions.map((q, i) => (
                      <div
                        key={i}
                        className="p-4 bg-amber-50/40 border border-amber-100 rounded-2xl text-xs sm:text-sm text-stone-800 font-medium leading-relaxed"
                      >
                        « {q} »
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Personal Notepad / Reflections */}
              <div className="pt-6 border-t border-[#E7E2D8]">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-heading font-bold text-sm text-stone-900 flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-[#36533D]" />
                    <span>مذكراتكِ وتأملاتكِ الخاصة بهذه المحطة:</span>
                  </h4>
                  <span className="text-[11px] text-stone-400">محفوظة في متصفحكِ بسرية وأمان</span>
                </div>
                <textarea
                  rows={4}
                  value={reflections[activeStepIndex] || ''}
                  onChange={(e) =>
                    setReflections({ ...reflections, [activeStepIndex]: e.target.value })
                  }
                  placeholder="اكتبي مشاعركِ وما يخطر في قلبكِ هنا دون خوف أو تبرير..."
                  className="w-full p-4 bg-[#FAF7F2] border border-[#E7E2D8] rounded-2xl text-xs sm:text-sm text-stone-800 leading-relaxed focus:outline-none focus:border-[#36533D] mb-3 transition-colors"
                />
                <button
                  onClick={() =>
                    saveReflection(activeStepIndex, reflections[activeStepIndex] || '')
                  }
                  className="px-4 py-2.5 bg-[#36533D] hover:bg-[#2A4230] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>حفظ تأملاتي في هذه المحطة</span>
                </button>
              </div>

              {/* Bottom Step Navigation Bar */}
              <div className="pt-6 border-t border-[#E7E2D8] flex items-center justify-between flex-wrap gap-4">
                <button
                  disabled={activeStepIndex <= 0}
                  onClick={() => {
                    setActiveStepIndex(activeStepIndex - 1);
                    window.scrollTo({ top: 320, behavior: 'smooth' });
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-[#E7E2D8] text-stone-700 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>المحطة السابقة</span>
                </button>

                <span className="text-xs font-medium text-stone-400 hidden sm:inline">
                  المحطة {activeStepIndex + 1} من إجمالي {steps.length}
                </span>

                <button
                  disabled={activeStepIndex >= steps.length - 1}
                  onClick={() => {
                    setActiveStepIndex(activeStepIndex + 1);
                    window.scrollTo({ top: 320, behavior: 'smooth' });
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#36533D] text-white hover:bg-[#2A4230] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>المحطة التالية</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* VIEW MODE 2: CONTINUOUS FULL TOPIC READING (الموضوع كاملاً كدليل متصل) */}
          {readingMode === 'full' && (
            <div className="space-y-12">
              <div className="p-6 bg-stone-50 border border-stone-200 rounded-3xl text-right">
                <span className="text-xs font-bold text-[#36533D] px-2.5 py-1 bg-white rounded-lg border border-stone-200 inline-block mb-2">
                  دليل القراءة المتكامل
                </span>
                <h2 className="font-heading font-black text-2xl sm:text-3xl text-stone-900 mb-2">
                  {journey.title}
                </h2>
                <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
                  هذا النص المتكامل يجمع لكِ جميع محطات الرحلة الست في مسار قرائي واحد وسلس، لتتمكني من قراءة الموضوع كاملاً دون انقطاع، والعودة إلى أي محطة وقتما تشائين.
                </p>
              </div>

              {/* Sequential Steps as Chapters */}
              <div className="space-y-12 divide-y divide-[#E7E2D8]">
                {steps.map((step, idx) => (
                  <div key={idx} className={idx > 0 ? 'pt-10' : ''}>
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-[#36533D] text-white font-bold text-sm flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <h3 className="font-heading font-black text-xl sm:text-2xl text-stone-900">
                          {step.title}
                        </h3>
                      </div>

                      <button
                        onClick={() => {
                          setActiveStepIndex(idx);
                          setReadingMode('step');
                          window.scrollTo({ top: 320, behavior: 'smooth' });
                        }}
                        className="px-3 py-1 bg-white hover:bg-stone-50 border border-[#E7E2D8] text-xs font-bold text-stone-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>الانتقال للتطبيق والتمارين</span>
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className={`text-stone-800 ${fontClass} mb-6 whitespace-pre-line leading-relaxed`}>
                      <p className="p-4 sm:p-5 bg-[#FAF7F2] rounded-2xl border-r-4 border-[#36533D] font-medium text-stone-900">
                        {step.explanation}
                      </p>
                    </div>

                    {/* Step exercises */}
                    {step.exercises && step.exercises.length > 0 && (
                      <div className="mb-4 p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100">
                        <h5 className="font-heading font-bold text-xs sm:text-sm text-[#36533D] mb-2 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>خطة التطبيق العملي للمحطة:</span>
                        </h5>
                        <ul className="space-y-1.5 text-xs sm:text-sm text-stone-700">
                          {step.exercises.map((ex, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#36533D] mt-2 shrink-0"></span>
                              <span>{ex}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Step questions */}
                    {step.questions && step.questions.length > 0 && (
                      <div className="p-4 bg-amber-50/30 rounded-2xl border border-amber-100">
                        <h5 className="font-heading font-bold text-xs sm:text-sm text-amber-900 mb-2 flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>أسئلة للتفكير الداخلي:</span>
                        </h5>
                        <div className="space-y-1.5 text-xs sm:text-sm text-stone-800">
                          {step.questions.map((q, i) => (
                            <p key={i}>• {q}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* End of Continuous Reading */}
              <div className="p-6 sm:p-8 bg-[#36533D] text-white rounded-3xl text-center space-y-3">
                <Sparkles className="w-8 h-8 text-amber-300 mx-auto" />
                <h4 className="font-heading font-bold text-xl">
                  «أنتِ لستِ ما حدث لكِ.. أنتِ ما تختارين أن تكوني عليه اليوم»
                </h4>
                <p className="text-stone-200 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
                  التعافي رحلة مستمرة تصنعين فيها سلامكِ حبة حبة، وتستردين نوركِ بخطى واثقة. متى ما شعرتِ بالحاجة للعودة، مساحتكِ هنا مفتوحة دائماً.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setReadingMode('step');
                      setActiveStepIndex(0);
                      window.scrollTo({ top: 320, behavior: 'smooth' });
                    }}
                    className="px-5 py-2.5 bg-white text-[#36533D] font-bold text-xs rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    العودة للمحطة الأولى وتدوين الملاحظات
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
