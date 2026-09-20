import React, { useState, useEffect, useCallback } from 'react';
import { Bookmark, Sparkles, BookOpen, Trash2, ArrowRight } from 'lucide-react';
import { Article } from '../types';
import { api } from '../lib/api';
import { ArticleCard } from '../components/Cards';
import { Breadcrumbs, LoadingState, EmptyState, SEOHead } from '../components/Common';
import {
  getFavoriteArticles,
  removeFavoriteArticle,
  onFavoritesChanged
} from '../lib/favorites';

export function BookmarksPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [savedArticles, setSavedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSavedContent = useCallback(async () => {
    // 1. Instantly retrieve locally saved articles from localStorage
    const localArticles = getFavoriteArticles();
    let mergedArticles = [...localArticles];

    try {
      // 2. Try fetching server bookmarks if logged in
      const bmRes = await api.getBookmarks();
      const articleIds = bmRes.bookmarks
        ?.filter((b) => b.content_type === 'article')
        .map((b) => b.content_id) || [];

      if (articleIds.length > 0) {
        const artRes = await api.getArticles({ limit: 50 });
        const serverFiltered = (artRes.articles || []).filter((a) => articleIds.includes(a.id));
        
        // Merge without duplicates
        serverFiltered.forEach((srvArt) => {
          if (!mergedArticles.some((m) => m.id === srvArt.id || m.slug === srvArt.slug)) {
            mergedArticles.push(srvArt);
          }
        });
      }
    } catch {
      // Guest or offline: local favorites are fully displayed
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
            احتفظي هنا بكل مقال لامس قلبكِ أو منحكِ طمأنينة لتعودي إليه حين تحتاجين السكينة، محفوظة في متصفحكِ للرجوع إليها دائماً.
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedArticles.map((art) => (
            <ArticleCard
              key={art.id}
              article={art}
              isBookmarked={true}
              onBookmarkChange={loadSavedContent}
              onNavigate={onNavigate}
            />
          ))}
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
