import React, { useState, useMemo } from 'react';
import {
  Compass,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Star,
  Layers,
  Sparkles,
  ExternalLink,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  HelpCircle,
  PenTool,
  Save
} from 'lucide-react';
import { Journey, Category, JourneyStep } from '../../types';
import { api } from '../../lib/api';

const JOURNEY_COVER_PRESETS = [
  { label: 'طريق هادئ وسط الطبيعة', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80' },
  { label: 'شروق شمس وأمل جديد', url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=1200&q=80' },
  { label: 'سكينة البحر والصفاء', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80' },
  { label: 'أوراق الشجر والنمو', url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1200&q=80' },
  { label: 'جبال وهدوء النفس', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80' }
];

interface AdminJourneysTabProps {
  journeys: Journey[];
  categories: Category[];
  onReload: () => void | Promise<void>;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onNavigate: (path: string) => void;
}

export function AdminJourneysTab({
  journeys,
  categories,
  onReload,
  showToast,
  onNavigate
}: AdminJourneysTabProps) {
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [featuredFilter, setFeaturedFilter] = useState('all');

  // Edit / Create state
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [journeyToDelete, setJourneyToDelete] = useState<Journey | null>(null);

  const [currentJourney, setCurrentJourney] = useState<Partial<Journey>>({
    title: '',
    slug: '',
    description: '',
    cover_image: '',
    category_id: categories[0]?.id || 1,
    status: 'published',
    is_featured: 0
  });

  const [steps, setSteps] = useState<Array<{
    title: string;
    explanation: string;
    exercises: string[];
    questions: string[];
  }>>([]);

  const [newExerciseInput, setNewExerciseInput] = useState<{ [index: number]: string }>({});
  const [newQuestionInput, setNewQuestionInput] = useState<{ [index: number]: string }>({});

  // Filtered journeys
  const filteredJourneys = useMemo(() => {
    return journeys.filter((j) => {
      if (categoryFilter !== 'all' && String(j.category_id) !== String(categoryFilter)) return false;
      if (statusFilter !== 'all' && j.status !== statusFilter) return false;
      if (featuredFilter === 'featured' && !j.is_featured) return false;
      if (featuredFilter === 'standard' && j.is_featured) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = j.title?.toLowerCase().includes(q);
        const matchDesc = j.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }
      return true;
    });
  }, [journeys, searchQuery, categoryFilter, statusFilter, featuredFilter]);

  // Open Create
  const handleOpenCreate = () => {
    setCurrentJourney({
      title: '',
      slug: '',
      description: '',
      cover_image: JOURNEY_COVER_PRESETS[0].url,
      category_id: categories[0]?.id || 1,
      status: 'published',
      is_featured: 0
    });
    setSteps([
      {
        title: 'المحطة الأولى: الوعي وكسر الإنكار',
        explanation: 'الخطوة الأولى في رحلة الشفاء تبدأ بالاعتراف بالمشاعر وتسميتها بوضوح دون تبرير.',
        exercises: ['كتابة رسالة تفريغية صادقة دون إرسالها'],
        questions: ['ما هي المشاعر التي كنت أهرب من مواجهتها؟']
      },
      {
        title: 'المحطة الثانية: إعادة بناء الحدود النفسية',
        explanation: 'وضع حدود صحية تحمي طاقتك وسلامك الداخلي من الاستنزاف المستمر.',
        exercises: ['تحديد 3 مواقف أقول فيها (لا) بحزم ولطف'],
        questions: ['أين تنتهي مسؤوليتي وتبدأ مسؤولية الآخرين؟']
      }
    ]);
    setIsEditing(true);
  };

  // Open Edit
  const handleOpenEdit = async (journey: Journey) => {
    setCurrentJourney(journey);
    setIsLoadingDetail(true);
    setIsEditing(true);
    try {
      const res = await api.admin.getJourneyById(journey.id);
      if (res?.steps && res.steps.length > 0) {
        setSteps(
          res.steps.map((s) => ({
            title: s.title || '',
            explanation: s.explanation || '',
            exercises: Array.isArray(s.exercises) ? s.exercises : [],
            questions: Array.isArray(s.questions) ? s.questions : []
          }))
        );
      } else {
        setSteps([
          {
            title: 'المحطة الأولى: البداية والاستبصار',
            explanation: 'شرح أهداف هذه المحطة وما تحتاج للتركيز عليه.',
            exercises: [],
            questions: []
          }
        ]);
      }
    } catch {
      // Fallback
      setSteps([
        {
          title: 'المحطة الأولى: البداية والاستبصار',
          explanation: '',
          exercises: [],
          questions: []
        }
      ]);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Quick Toggles
  const handleToggleStatus = async (journey: Journey) => {
    const newStatus = journey.status === 'published' ? 'draft' : 'published';
    try {
      await api.admin.updateJourney(journey.id, {
        ...journey,
        status: newStatus
      });
      showToast(newStatus === 'published' ? 'تم نشر الرحلة للجميع' : 'تم تحويل الرحلة لمسودة', 'success');
      onReload();
    } catch (err: any) {
      showToast(err.message || 'فشل تعديل الحالة', 'error');
    }
  };

  const handleToggleFeatured = async (journey: Journey) => {
    const newFeatured = journey.is_featured ? 0 : 1;
    try {
      await api.admin.updateJourney(journey.id, {
        ...journey,
        is_featured: newFeatured
      });
      showToast(newFeatured ? 'تم تمييز الرحلة في الواجهة ⭐' : 'تم إلغاء التمييز', 'success');
      onReload();
    } catch (err: any) {
      showToast(err.message || 'فشل التحديث', 'error');
    }
  };

  // Step Management
  const handleAddStep = () => {
    setSteps([
      ...steps,
      {
        title: `المحطة ${steps.length + 1}: خطوة جديدة نحو التعافي`,
        explanation: '',
        exercises: [],
        questions: []
      }
    ]);
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length <= 1) {
      showToast('يجب أن تحتوي الرحلة على محطة واحدة على الأقل', 'error');
      return;
    }
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === steps.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...steps];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setSteps(updated);
  };

  const handleAddExercise = (stepIndex: number) => {
    const text = newExerciseInput[stepIndex]?.trim();
    if (!text) return;
    const updated = [...steps];
    updated[stepIndex].exercises = [...updated[stepIndex].exercises, text];
    setSteps(updated);
    setNewExerciseInput({ ...newExerciseInput, [stepIndex]: '' });
  };

  const handleRemoveExercise = (stepIndex: number, exIndex: number) => {
    const updated = [...steps];
    updated[stepIndex].exercises = updated[stepIndex].exercises.filter((_, i) => i !== exIndex);
    setSteps(updated);
  };

  const handleAddQuestion = (stepIndex: number) => {
    const text = newQuestionInput[stepIndex]?.trim();
    if (!text) return;
    const updated = [...steps];
    updated[stepIndex].questions = [...updated[stepIndex].questions, text];
    setSteps(updated);
    setNewQuestionInput({ ...newQuestionInput, [stepIndex]: '' });
  };

  const handleRemoveQuestion = (stepIndex: number, qIndex: number) => {
    const updated = [...steps];
    updated[stepIndex].questions = updated[stepIndex].questions.filter((_, i) => i !== qIndex);
    setSteps(updated);
  };

  // Save Journey
  const handleSaveJourney = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentJourney.title?.trim()) {
      showToast('يرجى إدخال عنوان رحلة التعافي', 'error');
      return;
    }
    if (steps.length === 0) {
      showToast('يجب إضافة محطة علاجية واحدة على الأقل', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: currentJourney.title,
        slug: currentJourney.slug || currentJourney.title.toLowerCase().replace(/[^\w\u0621-\u064A\s-]/g, '').replace(/\s+/g, '-'),
        description: currentJourney.description || '',
        cover_image: currentJourney.cover_image || JOURNEY_COVER_PRESETS[0].url,
        category_id: currentJourney.category_id || categories[0]?.id || 1,
        is_featured: currentJourney.is_featured ? 1 : 0,
        status: currentJourney.status || 'published',
        steps: steps.map((s, idx) => ({
          step_number: idx + 1,
          title: s.title,
          explanation: s.explanation,
          exercises_json: JSON.stringify(s.exercises),
          reflection_questions_json: JSON.stringify(s.questions)
        }))
      };

      if (currentJourney.id) {
        await api.admin.updateJourney(currentJourney.id, payload);
        showToast('تم تحديث رحلة التعافي بنجاح ✨', 'success');
      } else {
        await api.admin.createJourney(payload);
        showToast('تم إنشاء ونشر رحلة التعافي الجديدة 🧭', 'success');
      }

      setIsEditing(false);
      onReload();
    } catch (err: any) {
      showToast(err.message || 'فشل حفظ رحلة التعافي', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Journey
  const handleDeleteConfirm = async () => {
    if (!journeyToDelete) return;
    try {
      await api.admin.deleteJourney(journeyToDelete.id);
      showToast(`تم حذف رحلة "${journeyToDelete.title}" نهائياً`, 'info');
      setJourneyToDelete(null);
      onReload();
    } catch (err: any) {
      showToast(err.message || 'فشل الحذف', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics */}
      <div className="bg-white border border-[#E7E2D8] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#36533D]/10 text-[#36533D] rounded-xl">
              <Compass className="w-5 h-5" />
            </span>
            <h2 className="font-heading font-bold text-xl text-stone-900">
              إدارة رحلات التعافي والوعي النفسي
            </h2>
            <span className="px-2.5 py-0.5 bg-[#FAF7F2] text-[#36533D] text-xs font-bold rounded-full border border-[#E7E2D8]">
              {journeys.length} رحلة
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            برامج علاجية خطوة بخطوة؛ تتضمن محطات تفاعلية، وتمارين عملية، وتأملات تساعد القارئة في التعافي وبناء الذات.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 bg-[#36533D] hover:bg-[#2b4231] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء رحلة تعافي جديدة</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#E7E2D8] rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="البحث في عناوين ووصف رحلات التعافي..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-3 py-2 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs text-stone-800 focus:outline-none focus:border-[#36533D]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs font-medium text-stone-700"
          >
            <option value="all">كل الأقسام والتصنيفات</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs font-medium text-stone-700"
          >
            <option value="all">جميع الحالات (منشور ومسودة)</option>
            <option value="published">المنشورة فقط</option>
            <option value="draft">المسودات فقط</option>
          </select>

          {/* Featured Filter */}
          <select
            value={featuredFilter}
            onChange={(e) => setFeaturedFilter(e.target.value)}
            className="px-3 py-2 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs font-medium text-stone-700"
          >
            <option value="all">جميع الرحلات</option>
            <option value="featured">المميزة فقط ⭐</option>
            <option value="standard">غير المميزة</option>
          </select>
        </div>
      </div>

      {/* Journeys List */}
      {filteredJourneys.length === 0 ? (
        <div className="bg-white border border-[#E7E2D8] rounded-2xl p-12 text-center">
          <Compass className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="font-heading font-bold text-stone-800 text-base mb-1">لا توجد رحلات مطابقة</h3>
          <p className="text-xs text-stone-500 mb-4">جربي تعديل معايير البحث أو ابدئي بإنشاء رحلة علاجية جديدة.</p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-[#36533D] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء أول رحلة</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredJourneys.map((j) => (
            <div
              key={j.id}
              className="bg-white border border-[#E7E2D8] rounded-2xl overflow-hidden shadow-xs hover:border-[#36533D]/40 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Cover Image & Badges */}
                <div className="relative aspect-video bg-stone-100 overflow-hidden">
                  <img
                    src={j.cover_image || JOURNEY_COVER_PRESETS[0].url}
                    alt={j.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Badges */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleStatus(j)}
                      title="انقري للتبديل بين منشور ومسودة"
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-xs cursor-pointer transition-transform active:scale-95 ${
                        j.status === 'published'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-stone-600 text-stone-100'
                      }`}
                    >
                      {j.status === 'published' ? 'منشور' : 'مسودة'}
                    </button>
                    <button
                      onClick={() => handleToggleFeatured(j)}
                      title="تبديل تمييز الرحلة"
                      className={`p-1.5 rounded-full shadow-xs cursor-pointer transition-colors ${
                        j.is_featured ? 'bg-amber-400 text-amber-950' : 'bg-white/80 text-stone-600 hover:bg-white'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${j.is_featured ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <div className="absolute bottom-2.5 right-2.5 left-2.5 flex items-center justify-between text-white text-[11px] font-medium">
                    <span className="bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-md">
                      {j.category_name || 'تطوير الذات'}
                    </span>
                    <span className="flex items-center gap-1 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-md">
                      <Layers className="w-3 h-3 text-emerald-400" />
                      <span>{j.steps_count || 1} محطات</span>
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2">
                  <h3 className="font-heading font-bold text-sm text-stone-900 line-clamp-1">
                    {j.title}
                  </h3>
                  <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                    {j.description || 'لا يوجد وصف مضاف لهذه الرحلة.'}
                  </p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="p-3 bg-[#FAF7F2] border-t border-[#E7E2D8] flex items-center justify-between gap-2">
                <button
                  onClick={() => onNavigate(`/journeys/${j.slug}`)}
                  className="px-2.5 py-1.5 text-stone-600 hover:text-[#36533D] hover:bg-stone-200/50 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                  title="عرض مباشر بالموقع"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>معاينة</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(j)}
                    className="px-3 py-1.5 bg-[#36533D]/10 hover:bg-[#36533D] text-[#36533D] hover:text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>تعديل المحطات</span>
                  </button>
                  <button
                    onClick={() => setJourneyToDelete(j)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="حذف الرحلة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDIT / CREATE MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-[#E7E2D8] rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E7E2D8] flex items-center justify-between bg-[#FAF7F2]">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-[#36533D] text-white rounded-xl">
                  <Compass className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-heading font-bold text-base text-stone-900">
                    {currentJourney.id ? `تعديل رحلة التعافي: ${currentJourney.title}` : 'إنشاء رحلة تعافي جديدة 🧭'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    حددي بيانات الرحلة وأضيفي المحطات التفاعلية والتمارين التطبيقية
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            {isLoadingDetail ? (
              <div className="p-12 text-center text-stone-500 text-xs">
                جاري تحميل محطات الرحلة...
              </div>
            ) : (
              <form onSubmit={handleSaveJourney} className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* 1. Basic Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-stone-800 mb-1.5">
                      عنوان رحلة التعافي <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: رحلة الشفاء من الصدمات وبناء المرونة النفسية"
                      value={currentJourney.title || ''}
                      onChange={(e) => setCurrentJourney({ ...currentJourney, title: e.target.value })}
                      className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#36533D]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1.5">
                      الرابط المخصص (Slug)
                    </label>
                    <input
                      type="text"
                      placeholder="healing-journey-slug"
                      value={currentJourney.slug || ''}
                      onChange={(e) => setCurrentJourney({ ...currentJourney, slug: e.target.value })}
                      className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#36533D]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1.5">
                      التصنيف النفسي <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={currentJourney.category_id || categories[0]?.id || 1}
                      onChange={(e) => setCurrentJourney({ ...currentJourney, category_id: Number(e.target.value) })}
                      className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#36533D]"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-stone-800 mb-1.5">
                      مقدمة وهدف الرحلة
                    </label>
                    <textarea
                      rows={2}
                      placeholder="اكتبي نبذة تشرح للزائرة ما الذي ستكتسبه عند إتمام هذه المحطات..."
                      value={currentJourney.description || ''}
                      onChange={(e) => setCurrentJourney({ ...currentJourney, description: e.target.value })}
                      className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs text-stone-900 leading-relaxed focus:outline-none focus:border-[#36533D]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-stone-800 mb-1.5">
                      صورة الغلاف (رابط الصورة)
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={currentJourney.cover_image || ''}
                      onChange={(e) => setCurrentJourney({ ...currentJourney, cover_image: e.target.value })}
                      className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#36533D]"
                    />
                    {/* Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[11px] text-stone-500 font-medium">صور مقترحة:</span>
                      {JOURNEY_COVER_PRESETS.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCurrentJourney({ ...currentJourney, cover_image: p.url })}
                          className="px-2 py-1 bg-stone-100 hover:bg-[#36533D]/10 hover:text-[#36533D] rounded text-[10px] text-stone-700 transition-colors"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-800">
                      <input
                        type="checkbox"
                        checked={currentJourney.status === 'published'}
                        onChange={(e) => setCurrentJourney({ ...currentJourney, status: e.target.checked ? 'published' : 'draft' })}
                        className="rounded text-[#36533D] focus:ring-[#36533D]"
                      />
                      <span>نشر الرحلة مباشرة على المنصة</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-800">
                      <input
                        type="checkbox"
                        checked={Boolean(currentJourney.is_featured)}
                        onChange={(e) => setCurrentJourney({ ...currentJourney, is_featured: e.target.checked ? 1 : 0 })}
                        className="rounded text-[#36533D] focus:ring-[#36533D]"
                      />
                      <span>تمييز في الصفحة الرئيسية (Featured ⭐)</span>
                    </label>
                  </div>
                </div>

                {/* 2. Interactive Steps Builder */}
                <div className="pt-4 border-t border-[#E7E2D8] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-heading font-bold text-sm text-stone-900 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#36533D]" />
                        <span>محطات الرحلة العلاجية ({steps.length})</span>
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        كل محطة تحتوي على عنوان وشرح معرفي، بالإضافة إلى تمارين عملية وأسئلة تفكر ذاتي.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddStep}
                      className="px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#36533D]/10 text-[#36533D] border border-[#E7E2D8] hover:border-[#36533D] rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة محطة جديدة</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {steps.map((step, sIdx) => (
                      <div
                        key={sIdx}
                        className="p-4 bg-[#FAF7F2] border border-[#E7E2D8] rounded-2xl space-y-3 relative group"
                      >
                        {/* Step Top Bar */}
                        <div className="flex items-center justify-between border-b border-[#E7E2D8] pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#36533D] text-white text-xs font-bold flex items-center justify-center">
                              {sIdx + 1}
                            </span>
                            <span className="font-bold text-xs text-stone-800">
                              المحطة رقم {sIdx + 1}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveStep(sIdx, 'up')}
                              disabled={sIdx === 0}
                              className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-30"
                              title="تحريك لأعلى"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveStep(sIdx, 'down')}
                              disabled={sIdx === steps.length - 1}
                              className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-30"
                              title="تحريك لأسفل"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveStep(sIdx)}
                              className="p-1 text-rose-400 hover:text-rose-600 mr-2"
                              title="حذف المحطة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Step Title & Explanation */}
                        <div>
                          <label className="block text-[11px] font-bold text-stone-700 mb-1">
                            عنوان المحطة
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="مثال: مواجهة الإنكار والاعتراف بالمشاعر"
                            value={step.title}
                            onChange={(e) => {
                              const updated = [...steps];
                              updated[sIdx].title = e.target.value;
                              setSteps(updated);
                            }}
                            className="w-full p-2 bg-white border border-[#E7E2D8] rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#36533D]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-stone-700 mb-1">
                            الشرح المعرفي والتوجيه النفسي
                          </label>
                          <textarea
                            rows={3}
                            placeholder="اكتبي التوجيه والخطوات التوعوية لهذه المحطة بالتفصيل..."
                            value={step.explanation}
                            onChange={(e) => {
                              const updated = [...steps];
                              updated[sIdx].explanation = e.target.value;
                              setSteps(updated);
                            }}
                            className="w-full p-2 bg-white border border-[#E7E2D8] rounded-xl text-xs text-stone-900 leading-relaxed focus:outline-none focus:border-[#36533D]"
                          />
                        </div>

                        {/* Practical Exercises */}
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-bold text-stone-700 flex items-center gap-1">
                            <PenTool className="w-3.5 h-3.5 text-[#36533D]" />
                            <span>التمارين التطبيقية والعملية</span>
                          </label>

                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {step.exercises.map((ex, exIdx) => (
                              <span
                                key={exIdx}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#E7E2D8] text-stone-800 rounded-lg text-xs"
                              >
                                <span>{ex}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveExercise(sIdx, exIdx)}
                                  className="text-stone-400 hover:text-rose-600"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>

                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="أضيفي تمريناً عملياً (مثال: كتابة 3 صفات إيجابية في نفسك)"
                              value={newExerciseInput[sIdx] || ''}
                              onChange={(e) => setNewExerciseInput({ ...newExerciseInput, [sIdx]: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddExercise(sIdx);
                                }
                              }}
                              className="flex-1 p-1.5 bg-white border border-[#E7E2D8] rounded-lg text-xs text-stone-800"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddExercise(sIdx)}
                              className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-xs font-bold"
                            >
                              إضافة
                            </button>
                          </div>
                        </div>

                        {/* Self Reflection Questions */}
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-bold text-stone-700 flex items-center gap-1">
                            <HelpCircle className="w-3.5 h-3.5 text-[#36533D]" />
                            <span>أسئلة التفكر الذاتي</span>
                          </label>

                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {step.questions.map((q, qIdx) => (
                              <span
                                key={qIdx}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#E7E2D8] text-stone-800 rounded-lg text-xs"
                              >
                                <span>{q}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveQuestion(sIdx, qIdx)}
                                  className="text-stone-400 hover:text-rose-600"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>

                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="أضيفي سؤال تفكر (مثال: متى كانت آخر مرة شعرتِ فيها بالأمان التام؟)"
                              value={newQuestionInput[sIdx] || ''}
                              onChange={(e) => setNewQuestionInput({ ...newQuestionInput, [sIdx]: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddQuestion(sIdx);
                                }
                              }}
                              className="flex-1 p-1.5 bg-white border border-[#E7E2D8] rounded-lg text-xs text-stone-800"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddQuestion(sIdx)}
                              className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-xs font-bold"
                            >
                              إضافة
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Modal Footer Controls */}
                <div className="pt-4 border-t border-[#E7E2D8] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-bold rounded-xl transition-colors"
                  >
                    إلغاء
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-[#36533D] hover:bg-[#2b4231] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'جاري الحفظ...' : 'حفظ ونشر رحلة التعافي ✨'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {journeyToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E7E2D8] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-heading font-bold text-base text-stone-900">حذف رحلة التعافي نهائياً؟</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                هل أنتِ متأكدة من حذف رحلة "{journeyToDelete.title}" وكل محطاتها العلاجية؟ هذا الإجراء لا يمكن التراجع عنه.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setJourneyToDelete(null)}
                className="flex-1 py-2 border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-bold rounded-xl"
              >
                تراجع
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
