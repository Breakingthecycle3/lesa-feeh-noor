import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Clock,
  Eye,
  Bookmark,
  Play,
  Copy,
  Check,
  Share2,
  Headphones,
  Compass,
  ArrowLeft,
  Edit
} from 'lucide-react';
import { Article, Video, Message, Podcast, Category, Journey } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import {
  isArticleFavorite,
  toggleFavoriteArticle,
  onFavoritesChanged
} from '../lib/favorites';

// 1. ArticleCard
export function ArticleCard({
  article,
  onNavigate,
  isBookmarked: initialBookmarked = false,
  onBookmarkChange
}: {
  article: Article;
  onNavigate: (path: string) => void;
  isBookmarked?: boolean;
  onBookmarkChange?: () => void;
}) {
  const { user, isLoggedIn, isAdmin, isEditor } = useAuth();
  const isFatmaOrAdmin = isAdmin || isEditor || user?.role === 'ADMIN' || user?.email === 'fatmamohamed36699@gmail.com';
  const { showToast } = useToast();
  const [bookmarked, setBookmarked] = useState(() => initialBookmarked || isArticleFavorite(article.id) || isArticleFavorite(article.slug));

  useEffect(() => {
    setBookmarked(initialBookmarked || isArticleFavorite(article.id) || isArticleFavorite(article.slug));
  }, [initialBookmarked, article.id, article.slug]);

  useEffect(() => {
    const unsub = onFavoritesChanged(() => {
      setBookmarked(isArticleFavorite(article.id) || isArticleFavorite(article.slug));
    });
    return unsub;
  }, [article.id, article.slug]);

  const toggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = toggleFavoriteArticle(article);
    setBookmarked(newStatus);
    showToast(newStatus ? 'تم حفظ المقال في مفضلتكِ 🔖' : 'تمت إزالة المقال من المفضلة', 'info');
    onBookmarkChange?.();
    if (isLoggedIn) {
      api.toggleBookmark('article', article.id).catch(() => {});
    }
  };

  return (
    <article
      onClick={() => onNavigate(`/articles/${article.slug}`)}
      className="group flex flex-col bg-white border border-[#E7E2D8] hover:border-[#36533D]/40 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer text-right"
      dir="rtl"
    >
      {/* Cover Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
        <img
          src={article.featured_image || 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80'}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/40 via-transparent to-transparent opacity-60"></div>
        
        {/* Category Pill */}
        {article.category_name && (
          <span className="absolute top-3 right-3 px-3 py-1 bg-white/95 backdrop-blur-md text-[#36533D] font-bold text-xs rounded-full shadow-sm">
            {article.category_name}
          </span>
        )}

        {/* Bookmark Button */}
        <button
          onClick={toggleBookmark}
          className={`absolute top-3 left-3 p-2 rounded-full backdrop-blur-md transition-all cursor-pointer ${
            bookmarked ? 'bg-[#36533D] text-white' : 'bg-white/90 text-stone-700 hover:bg-white'
          }`}
          title={bookmarked ? 'محفوظ في المفضلة' : 'حفظ في المفضلة'}
        >
          <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current' : ''}`} />
        </button>

        {/* Inside Edit Button for Fatma / Admins */}
        {isFatmaOrAdmin && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(`/articles/${article.slug}`);
            }}
            className="absolute bottom-3 left-3 px-2.5 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-[11px] shadow-sm flex items-center gap-1 cursor-pointer transition-all border border-amber-500/40 z-10 active:scale-95"
            title="فتح هذا الموضوع وتعديله من الداخل"
          >
            <Edit className="w-3 h-3 text-stone-950" />
            <span>تعديل من الداخل</span>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 text-xs text-stone-400 mb-2">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {article.reading_time} دقائق قراءة
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {article.view_count || 0}
            </span>
          </div>

          <h3 className="font-heading font-bold text-base md:text-lg text-stone-900 group-hover:text-[#36533D] leading-snug mb-2.5 transition-colors line-clamp-2">
            {article.title}
          </h3>

          <p className="text-xs md:text-sm text-stone-500 leading-relaxed line-clamp-2 mb-4">
            {article.excerpt}
          </p>
        </div>

        {/* Author & Arrow */}
        <div className="pt-3 border-t border-[#F0EBE1] flex items-center justify-between text-xs text-stone-600">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#36533D]/10 text-[#36533D] flex items-center justify-center font-bold text-[10px]">
              ن
            </span>
            <span className="font-medium text-stone-700 truncate max-w-[140px]">{article.author_name}</span>
          </div>
          <span className="flex items-center gap-1 text-[#36533D] font-bold group-hover:-translate-x-1 transition-transform">
            اقرأ المزيد
            <ArrowLeft className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </article>
  );
}

// 2. VideoCard
export function VideoCard({
  video,
  onNavigate
}: {
  video: Video;
  onNavigate: (path: string) => void;
}) {
  return (
    <div
      onClick={() => onNavigate(`/videos/${video.slug}`)}
      className="group flex flex-col bg-white border border-[#E7E2D8] hover:border-[#36533D]/40 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer text-right"
      dir="rtl"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-stone-900">
        <img
          src={video.thumbnail || 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80'}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
          loading="lazy"
        />
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-[#36533D]/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 fill-current mr-0.5" />
          </div>
        </div>

        {/* Duration badge */}
        <span className="absolute bottom-2.5 left-2.5 px-2.5 py-1 bg-stone-900/80 backdrop-blur-sm text-white font-medium text-xs rounded-md">
          {video.duration}
        </span>

        {video.category_name && (
          <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 bg-white/90 text-[#36533D] font-bold text-xs rounded-full">
            {video.category_name}
          </span>
        )}
      </div>

      <div className="p-4">
        <h4 className="font-heading font-bold text-sm md:text-base text-stone-900 group-hover:text-[#36533D] line-clamp-2 leading-snug mb-1.5 transition-colors">
          {video.title}
        </h4>
        <div className="flex items-center gap-3 text-xs text-stone-400">
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            {video.view_count || 0} مشاهدة
          </span>
          <span>•</span>
          <span>{video.author_name}</span>
        </div>
      </div>
    </div>
  );
}

// 3. MessageCard ("رسائل لسه في نور")
export function MessageCard({
  message,
  onNavigate
}: {
  message: Message;
  onNavigate?: (path: string) => void;
}) {
  const { user, isAdmin, isEditor } = useAuth();
  const isAdminUser = Boolean(
    isAdmin ||
    user?.role === 'ADMIN' ||
    isEditor ||
    user?.email === 'fatmamohamed36699@gmail.com'
  );
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const copyText = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`"${message.text}"\n\n— منصة لسه في نور`);
    setCopied(true);
    showToast('تم نسخ الرسالة الملهمة 🤍', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  const shareText = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = typeof window !== 'undefined' ? `${window.location.origin}/messages/${message.slug}` : '';
    const shareText = encodeURIComponent(`"${message.text}"\n\n— لسه في نور\n${url}`);
    window.open(`https://api.whatsapp.com/send?text=${shareText}`, '_blank');
  };

  return (
    <div
      onClick={() => onNavigate?.(`/messages/${message.slug}`)}
      className="group relative flex flex-col justify-between p-6 md:p-8 rounded-3xl overflow-hidden border border-[#E7E2D8] bg-[#FDFCFB] hover:shadow-lg transition-all duration-300 text-right cursor-pointer min-h-[260px]"
      dir="rtl"
    >
      {/* Soft background glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-[#36533D]/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
      
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-[#36533D] px-3 py-1 bg-[#36533D]/10 rounded-full">
            {message.category_name || 'رسالة أمل'}
          </span>
          <span className="text-2xl font-serif text-[#C5A880] select-none">“</span>
        </div>

        <h4 className="font-heading font-bold text-lg text-stone-900 mb-2 leading-snug">
          {message.title}
        </h4>

        <p className="font-body text-sm md:text-base text-stone-700 leading-relaxed mb-6 font-normal">
          {message.text}
        </p>
      </div>

      <div className="pt-4 border-t border-[#EFE9DF] flex items-center justify-between text-xs text-stone-500">
        <span className="font-medium text-stone-600">منصة لسه في نور</span>
        <div className="flex items-center gap-1.5">
          {isAdminUser && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate?.(`/messages/${message.slug}`);
              }}
              className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-[10px] rounded-lg shadow-2xs border border-amber-500/40 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              title="تعديل هذه الرسالة من الداخل"
            >
              <Edit className="w-3 h-3 text-stone-950" />
              <span>تعديل</span>
            </button>
          )}
          <button
            onClick={copyText}
            className="p-2 hover:bg-stone-200/60 rounded-lg text-stone-600 hover:text-stone-900 transition-colors"
            title="نسخ الرسالة"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={shareText}
            className="p-2 hover:bg-stone-200/60 rounded-lg text-stone-600 hover:text-stone-900 transition-colors"
            title="مشاركة عبر واتساب"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// 4. PodcastCard
export function PodcastCard({
  podcast,
  onNavigate
}: {
  podcast: Podcast;
  onNavigate: (path: string) => void;
}) {
  return (
    <div
      onClick={() => onNavigate(`/podcast/${podcast.slug}`)}
      className="group flex items-center gap-4 p-4 bg-white border border-[#E7E2D8] hover:border-[#36533D]/40 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer text-right"
      dir="rtl"
    >
      <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden bg-stone-100 shrink-0">
        <img
          src={podcast.cover_image}
          alt={podcast.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-stone-900/30 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-[#36533D] text-white flex items-center justify-center shadow">
            <Play className="w-3.5 h-3.5 fill-current mr-0.5" />
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs text-[#36533D] font-bold mb-1">
          <Headphones className="w-3.5 h-3.5" />
          <span>الحلقة {podcast.episode_number}</span>
          <span>•</span>
          <span className="text-stone-400 font-normal">{podcast.duration}</span>
        </div>
        <h4 className="font-heading font-bold text-sm md:text-base text-stone-900 group-hover:text-[#36533D] line-clamp-1 leading-snug mb-1 transition-colors">
          {podcast.title}
        </h4>
        <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
          {podcast.description}
        </p>
      </div>
    </div>
  );
}

// 5. JourneyCard
export function JourneyCard({
  journey,
  onNavigate
}: {
  journey: Journey;
  onNavigate: (path: string) => void;
}) {
  return (
    <div
      onClick={() => onNavigate(`/journeys/${journey.slug}`)}
      className="group relative flex flex-col bg-white border border-[#E7E2D8] hover:border-[#36533D]/50 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer text-right"
      dir="rtl"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-stone-900">
        <img
          src={journey.cover_image}
          alt={journey.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-85 group-hover:opacity-95"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent"></div>
        
        <span className="absolute top-3.5 right-3.5 px-3 py-1 bg-white/95 text-[#36533D] font-bold text-xs rounded-full shadow-sm flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5" />
          رحلة إرشادية متكاملة
        </span>

        <div className="absolute bottom-3.5 right-3.5 left-3.5 flex items-center justify-between text-xs text-white/90">
          <span className="px-2.5 py-1 bg-stone-900/60 backdrop-blur-md rounded-md font-medium">
            {journey.steps_count || 6} محطات تعافي
          </span>
          <span className="flex items-center gap-1 font-bold text-emerald-300 group-hover:-translate-x-1 transition-transform">
            ابدأ الرحلة
            <ArrowLeft className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-heading font-bold text-base md:text-lg text-stone-900 group-hover:text-[#36533D] mb-2 leading-snug transition-colors">
            {journey.title}
          </h3>
          <p className="text-xs md:text-sm text-stone-500 leading-relaxed line-clamp-2">
            {journey.description}
          </p>
        </div>
      </div>
    </div>
  );
}

// 6. CategoryCard
export function CategoryCard({
  category,
  onNavigate
}: {
  category: Category;
  onNavigate: (path: string) => void;
}) {
  return (
    <div
      onClick={() => onNavigate(`/categories/${category.slug}`)}
      className="group p-5 bg-white border border-[#E7E2D8] hover:border-[#36533D]/40 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer text-right flex flex-col justify-between"
      dir="rtl"
    >
      <div>
        <div className="w-10 h-10 rounded-xl bg-[#36533D]/10 text-[#36533D] flex items-center justify-center font-bold text-sm mb-3 group-hover:bg-[#36533D] group-hover:text-white transition-all">
          {category.name.charAt(0)}
        </div>
        <h4 className="font-heading font-bold text-base text-stone-900 group-hover:text-[#36533D] mb-1.5 transition-colors">
          {category.name}
        </h4>
        <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">
          {category.description}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-[#F0EBE1] flex items-center justify-between text-xs text-stone-400">
        <span>{category.articles_count || 0} موضوعات</span>
        <ArrowLeft className="w-3.5 h-3.5 text-[#36533D] opacity-0 group-hover:opacity-100 group-hover:-translate-x-1 transition-all" />
      </div>
    </div>
  );
}
