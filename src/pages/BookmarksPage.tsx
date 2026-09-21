import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Bookmark, Sparkles, BookOpen, Trash2, ArrowRight, FolderPlus, Folder, Filter, Tag, Check, X, Edit3 } from 'lucide-react';
import { Article } from '../types';
import { api } from '../lib/api';
import { ArticleCard } from '../components/Cards';
import { Breadcrumbs, LoadingState, EmptyState, SEOHead } from '../components/Common';
import {
  getFavoriteArticles,
  removeFavoriteArticle,
  onFavoritesChanged
} from '../lib/favorites';
import { motion, AnimatePresence } from 'motion/react';

interface CategorizedArticle extends Article {
  bookmarkCategory: string | null;
}

export function BookmarksPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [savedArticles, setSavedArticles] = useState<CategorizedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  const loadSavedContent = useCallback(async () => {
    // 1. Instantly retrieve locally saved articles from localStorage
    const localArticles = getFavoriteArticles();
    let mergedArticles: CategorizedArticle[] = localArticles.map(a => ({ ...a, bookmarkCategory: null }));

    try {
      // 2. Try fetching server bookmarks if logged in
      const bmRes = await api.getBookmarks();
      const bookmarks = bmRes.bookmarks || [];
      const articleBookmarks = bookmarks.filter((b) => b.content_type === 'article');
      const articleIds = articleBookmarks.map((b) => b.content_id);

      if (articleIds.length > 0) {
        const artRes = await api.getArticles({ limit: 100 });
        const allArticles = artRes.articles || [];
        
        // Merge without duplicates and assign categories
        articleBookmarks.forEach((bm) => {
          const srvArt = allArticles.find(a => a.id === bm.content_id);
          if (srvArt) {
            const existingIdx = mergedArticles.findIndex(m => m.id === srvArt.id);
            if (existingIdx > -1) {
              mergedArticles[existingIdx].bookmarkCategory = bm.category;
            } else {
              mergedArticles.push({ ...srvArt, bookmarkCategory: bm.category });
            }
          }
        });
      }
    } catch (err) {
      console.error('Error loading bookmarks:', err);
    }

    setSavedArticles(mergedArticles);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSavedContent();
    const unsubscribe = onFavoritesChanged(() => {
      loadSavedContent();
    });
    return unsubscribe;
  }, [loadSavedContent]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    savedArticles.forEach(a => {
      if (a.bookmarkCategory) cats.add(a.bookmarkCategory);
    });
    return Array.from(cats);
  }, [savedArticles]);

  const filteredArticles = useMemo(() => {
    if (activeCategory === 'all') return savedArticles;
    if (activeCategory === 'uncategorized') return savedArticles.filter(a => !a.bookmarkCategory);
    return savedArticles.filter(a => a.bookmarkCategory === activeCategory);
  }, [savedArticles, activeCategory]);

  const handleUpdateCategory = async (articleId: number, category: string | null) => {
    try {
      await api.updateBookmarkCategory('article', articleId, category);
      await loadSavedContent();
      setEditingId(null);
      setNewCategoryName('');
    } catch (err) {
      console.error('Failed to update category:', err);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('هل تودين مسح جميع المقالات المحفوظة من المفضلة في متصفحكِ؟')) {
      savedArticles.forEach((a) => removeFavoriteArticle(a.id));
      setSavedArticles([]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 text-right" dir="rtl">
      <SEOHead title="المفضلة والمحفوظات" description="موضوعاتكِ المفضلة المحفوظة للرجوع إليها في أي وقت." />

      <Breadcrumbs
        items={[
          { label: 'الرئيسية', path: '/' },
          { label: 'المفضلة والمحفوظات' }
        ]}
        onNavigate={onNavigate}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-6 border-b border-[#E7E2D8]">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#36533D]/10 text-[#36533D] font-bold text-xs mb-3">
            <Bookmark className="w-3.5 h-3.5 fill-current" />
            <span>مكتبتكِ الخاصة</span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-stone-900 mb-2">
            الموضوعات التي قمتِ بحفظها
          </h1>
          <p className="font-body text-sm text-stone-600 leading-relaxed">
            احتفظي هنا بكل مقال لامس قلبكِ أو منحكِ طمأنينة لتعودي إليه حين تحتاجين السكينة، يمكنكِ الآن تنظيم مقالاتكِ في تصنيفات مخصصة.
          </p>
        </div>

        {savedArticles.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-500 font-bold bg-[#FAF7F2] px-3 py-1.5 rounded-xl border border-[#E7E2D8]">
              {savedArticles.length} مقالات محفوظة
            </span>
            <button
              onClick={handleClearAll}
              className="text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-xl border border-red-200 transition-colors flex items-center gap-1 cursor-pointer"
              title="إفراغ المفضلة"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>إفراغ المفضلة</span>
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <LoadingState message="نستحضر محفوظاتكِ..." />
      ) : savedArticles.length > 0 ? (
        <div className="space-y-8">
          {/* Categories Selector */}
          <div className="flex flex-wrap gap-2 mb-8 p-1.5 bg-stone-100/50 rounded-2xl border border-stone-200/50">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeCategory === 'all'
                  ? 'bg-[#36533D] text-white shadow-md'
                  : 'text-stone-600 hover:bg-stone-200/60'
              }`}
            >
              الكل
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeCategory === cat
                    ? 'bg-[#36533D] text-white shadow-md'
                    : 'text-stone-600 hover:bg-stone-200/60'
                }`}
              >
                <Folder className="w-3 h-3" />
                <span>{cat}</span>
              </button>
            ))}
            <button
              onClick={() => setActiveCategory('uncategorized')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeCategory === 'uncategorized'
                  ? 'bg-[#36533D] text-white shadow-md'
                  : 'text-stone-600 hover:bg-stone-200/60'
              }`}
            >
              غير مصنف
            </button>
          </div>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {filteredArticles.map((art) => (
              <div key={art.id} className="flex flex-col space-y-4">
                <ArticleCard
                  article={art}
                  isBookmarked={true}
                  onBookmarkChange={loadSavedContent}
                  onNavigate={onNavigate}
                />
                
                {/* Category Management UI */}
                <div className="px-1">
                  {editingId === art.id ? (
                    <div className="flex items-center gap-2 bg-stone-50 p-2 rounded-xl border border-[#E7E2D8]">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="اسم التصنيف..."
                        className="flex-1 bg-transparent border-none text-xs focus:ring-0 px-2"
                        autoFocus
                      />
                      <button
                        onClick={() => handleUpdateCategory(art.id, newCategoryName)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded-lg"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 text-stone-400 hover:bg-stone-100 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-stone-400" />
                        <span className="text-xs font-medium text-stone-500">
                          {art.bookmarkCategory || 'بدون تصنيف'}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setEditingId(art.id);
                          setNewCategoryName(art.bookmarkCategory || '');
                        }}
                        className="text-[10px] font-bold text-[#36533D] hover:underline flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{art.bookmarkCategory ? 'تغيير التصنيف' : 'إضافة تصنيف'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          title="لم تقومي بحفظ أي مقال بعد"
          description="يمكنكِ الضغط على زر «إضافة للمفضلة» في أعلى أو أسفل أي مقال ملهم لحفظه في هذه الصفحة والرجوع إليه لاحقاً."
          actionLabel="تصفح الموضوعات الآن"
          onAction={() => onNavigate('/articles')}
        />
      )}
    </div>
  );
}
