import React, { useState, useEffect } from 'react';
import { Search, Filter, Sparkles, X, Quote, Edit, Shield, Plus } from 'lucide-react';
import { Article, Category } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ArticleCard } from '../components/Cards';
import { Breadcrumbs, Pagination, LoadingState, EmptyState, SEOHead } from '../components/Common';
import { MOODS } from '../data/moods';

export function ArticlesPage({
  categorySlug,
  initialMood,
  onNavigate
}: {
  categorySlug?: string;
  initialMood?: string;
  onNavigate: (path: string) => void;
}) {
  const { user, isAdmin, isEditor } = useAuth();
  const isFatmaOrAdmin = isAdmin || isEditor || user?.role === 'ADMIN' || user?.email === 'fatmamohamed36699@gmail.com';
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(categorySlug || '');
  const [selectedMood, setSelectedMood] = useState<string>(initialMood || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<'latest' | 'popular'>('latest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCategories().then((res) => setCategories(res.categories || []));
  }, []);

  useEffect(() => {
    if (categorySlug !== undefined) {
      setSelectedCategory(categorySlug);
      setPage(1);
    }
  }, [categorySlug]);

  useEffect(() => {
    if (initialMood !== undefined) {
      setSelectedMood(initialMood);
      setPage(1);
    }
  }, [initialMood]);

  useEffect(() => {
    setLoading(true);
    api.getArticles({
      category: selectedCategory || undefined,
      mood: selectedMood || undefined,
      search: searchQuery || undefined,
      sort,
      page,
      limit: 9
    })
      .then((res) => {
        setArticles(res.articles || []);
        setTotalPages(res.pagination?.totalPages || 1);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedCategory, selectedMood, searchQuery, sort, page]);

  const activeCategoryObj = categories.find((c) => c.slug === selectedCategory);
  const activeMoodObj = MOODS.find((m) => m.id === selectedMood);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 text-right" dir="rtl">
      <SEOHead
        title={activeCategoryObj ? `موضوعات ${activeCategoryObj.name}` : 'الموضوعات والمقالات'}
        description="مكتبة شاملة لمقالات الدعم النفسي والوعي بالعلاقات وتجاوز الصدمات وبناء الحدود الشخصية."
      />

      <Breadcrumbs
        items={[
          { label: 'الرئيسية', path: '/' },
          { label: 'الموضوعات', path: '/articles' },
          ...(activeCategoryObj ? [{ label: activeCategoryObj.name }] : [])
        ]}
        onNavigate={onNavigate}
      />

      {/* 🛡️ Admin Topic Management Bar */}
      {isFatmaOrAdmin && (
        <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-emerald-50/50 border border-amber-300 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 text-xs text-stone-800">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span className="font-bold text-stone-900">صلاحيات إدارة الموضوعات مفعلة (فاطمة محمد):</span>
            <span className="text-stone-600 hidden sm:inline">
              يمكنكِ النقر على زر «تعديل من الداخل» على أي بطاقة، أو فتح أي موضوع لتعديله مباشرة من الداخل.
            </span>
          </div>
          <button
            onClick={() => onNavigate('/admin')}
            className="px-3.5 py-1.5 bg-[#36533D] hover:bg-[#2A4230] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
          >
            <Shield className="w-3.5 h-3.5 text-amber-300" />
            <span>لوحة التحكم الرئيسية</span>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="max-w-3xl mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#36533D]/10 text-[#36533D] font-bold text-xs mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>المكتبة التحريرية</span>
        </div>
        <h1 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-stone-900 mb-3">
          {activeCategoryObj ? activeCategoryObj.name : 'موضوعات لسه في نور'}
        </h1>
        <p className="font-body text-sm sm:text-base text-stone-600 leading-relaxed">
          {activeCategoryObj
            ? activeCategoryObj.description
            : 'مقالات ورؤى نفسية واعية كُتبت بلغة دافئة ومسؤولة، ترافقك في فهم نفسك وبناء أمانك الداخلي.'}
        </p>
      </div>

      {/* Mood Quick Filter Bar */}
      <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-[#FDFBF7] border border-[#E7E2D8] shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">💭</span>
            <span className="font-heading font-bold text-xs sm:text-sm text-stone-900">
              تصفح بحسب حالتك المزاجية واحتياجك الحالي:
            </span>
          </div>
          {selectedMood && (
            <button
              onClick={() => {
                setSelectedMood('');
                setPage(1);
              }}
              className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 transition cursor-pointer self-start sm:self-auto"
            >
              <X className="w-3.5 h-3.5" />
              <span>إلغاء تصفية الحالة المزاجية</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
          <button
            onClick={() => {
              setSelectedMood('');
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              !selectedMood
                ? 'bg-stone-800 text-white shadow-xs'
                : 'bg-white border border-[#E7E2D8] text-stone-600 hover:bg-stone-50'
            }`}
          >
            جميع الحالات
          </button>
          {MOODS.map((m) => {
            const isSelected = selectedMood === m.id;
            return (
              <button
                key={m.id}
                id={`filter-mood-${m.id}`}
                onClick={() => {
                  setSelectedMood(isSelected ? '' : m.id);
                  setPage(1);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? `${m.accentBg} ${m.color} border ${m.borderColor} shadow-xs font-black ring-1 ring-stone-400/30`
                    : 'bg-white border border-[#E7E2D8] text-stone-700 hover:bg-stone-50'
                }`}
              >
                <span>{m.emoji}</span>
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Mood Quote Banner if selected */}
        {activeMoodObj && (
          <div className={`mt-3 p-3 rounded-xl border flex items-center gap-3 text-xs ${activeMoodObj.accentBg} ${activeMoodObj.borderColor}`}>
            <Quote className="w-4 h-4 text-stone-600 shrink-0" />
            <p className="text-stone-800 font-medium">
              "{activeMoodObj.quote.text}"
            </p>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4 mb-10">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => {
              setSelectedCategory('');
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              !selectedCategory
                ? 'bg-[#36533D] text-white shadow-sm'
                : 'bg-white border border-[#E7E2D8] text-stone-700 hover:bg-stone-50'
            }`}
          >
            الكل
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              onClick={() => {
                setSelectedCategory(c.slug);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === c.slug
                  ? 'bg-[#36533D] text-white shadow-sm'
                  : 'bg-white border border-[#E7E2D8] text-stone-700 hover:bg-stone-50'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="ابحث في الموضوعات..."
              className="w-full pl-4 pr-10 py-2.5 bg-white border border-[#E7E2D8] rounded-xl text-xs focus:outline-none focus:border-[#36533D]"
            />
            <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-3" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-stone-500 font-medium flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              الترتيب:
            </span>
            <select
              value={sort}
              onChange={(e: any) => setSort(e.target.value)}
              className="px-3 py-2 bg-white border border-[#E7E2D8] rounded-xl text-xs font-bold text-stone-700 focus:outline-none"
            >
              <option value="latest">الأحدث أولاً</option>
              <option value="popular">الأكثر قراءة</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <LoadingState message="جارٍ استحضار الموضوعات..." />
      ) : articles.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((art) => (
              <ArticleCard key={art.id} article={art} onNavigate={onNavigate} />
            ))}
          </div>

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      ) : (
        <EmptyState
          title="لم نجد موضوعات تطابق بحثك"
          description="جربي البحث بكلمات أبسط أو إزالة تصفية التصنيفات."
          actionLabel="عرض كل الموضوعات"
          onAction={() => {
            setSelectedCategory('');
            setSearchQuery('');
          }}
        />
      )}
    </div>
  );
}
