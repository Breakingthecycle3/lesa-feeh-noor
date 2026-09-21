import React, { useState, useEffect } from 'react';
import {
  Clock,
  Eye,
  Calendar,
  Bookmark,
  Share2,
  ChevronRight,
  ChevronLeft,
  MessageCircle,
  Send,
  Sparkles,
  User as UserIcon,
  Video as VideoIcon,
  ArrowLeft,
  Edit,
  Shield,
  Volume2
} from 'lucide-react';
import { Article, Video, Comment } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Breadcrumbs, ShareButtons, LoadingState, ErrorState, SEOHead } from '../components/Common';
import { ArticleCard, VideoCard } from '../components/Cards';
import { ArticleAudioPlayer } from '../components/ArticleAudioPlayer';
import { ArticleEditModal } from '../components/ArticleEditModal';
import { MOODS } from '../data/moods';
import {
  isArticleFavorite,
  toggleFavoriteArticle,
  onFavoritesChanged
} from '../lib/favorites';

export function ArticleDetailPage({
  slug,
  onNavigate
}: {
  slug: string;
  onNavigate: (path: string) => void;
}) {
  const { user, isLoggedIn, isAdmin, isEditor, openAuthModal } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [article, setArticle] = useState<Article | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const isAdminUser = Boolean(
    isAdmin ||
    user?.role === 'ADMIN' ||
    isEditor ||
    user?.email === 'fatmamohamed36699@gmail.com'
  );
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [recommendedVideos, setRecommendedVideos] = useState<Video[]>([]);
  const [prevArticle, setPrevArticle] = useState<{ title: string; slug: string } | null>(null);
  const [nextArticle, setNextArticle] = useState<{ title: string; slug: string } | null>(null);
  const [bookmarked, setBookmarked] = useState(false);

  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (user) {
      setAuthorName(user.name || '');
      setAuthorEmail(user.email || '');
    }
  }, [user]);

  const fetchArticle = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getArticle(slug);
      setArticle(res.article);
      if (res.article) {
        setBookmarked(isArticleFavorite(res.article.id) || isArticleFavorite(res.article.slug));
      }
      setRelatedArticles(res.relatedArticles || []);
      setRecommendedVideos(res.recommendedVideos || []);
      setPrevArticle(res.prevArticle || null);
      setNextArticle(res.nextArticle || null);

      // Load comments for this article
      if (res.article?.id) {
        api.getComments('article', res.article.id).then((cRes) => {
          setComments(cRes.comments || []);
        });
      }
    } catch (err: any) {
      setError(err.message || 'تعذر تحميل المقال');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticle();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  // Synchronize bookmark status when localStorage changes or article loads
  useEffect(() => {
    if (article) {
      setBookmarked(isArticleFavorite(article.id) || isArticleFavorite(article.slug));
    }
    const unsubscribe = onFavoritesChanged(() => {
      if (article) {
        setBookmarked(isArticleFavorite(article.id) || isArticleFavorite(article.slug));
      }
    });
    return unsubscribe;
  }, [article?.id, article?.slug]);

  const toggleBookmark = () => {
    if (!article) return;
    const newStatus = toggleFavoriteArticle(article);
    setBookmarked(newStatus);

    if (newStatus) {
      showToast('تمت إضافة المقال إلى مفضلتكِ بنجاح 🔖', 'success');
    } else {
      showToast('تمت إزالة المقال من المفضلة', 'info');
    }

    // Optional background sync if user is logged in
    if (isLoggedIn) {
      api.toggleBookmark('article', article.id).catch(() => {});
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!article || !commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await api.addComment({
        content_type: 'article',
        content_id: article.id,
        author_name: authorName || 'متابعة كريمة',
        author_email: authorEmail || 'guest@lesanour.com',
        comment_text: commentText
      });
      showToast(res.message, 'success');
      setCommentText('');

      // Refresh comments
      api.getComments('article', article.id).then((cRes) => {
        setComments(cRes.comments || []);
      });
    } catch (err: any) {
      showToast(err.message || 'فشل إرسال التعليق', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) return <LoadingState message="نستحضر لكِ هذا المقال بهدوء..." />;
  if (error || !article) return <ErrorState message={error || 'المقال غير موجود'} onRetry={fetchArticle} />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 text-right" dir="rtl">
      <SEOHead
        title={article.title}
        description={article.excerpt}
      />

      <Breadcrumbs
        items={[
          { label: 'الرئيسية', path: '/' },
          { label: 'الموضوعات', path: '/articles' },
          { label: article.category_name || 'عام', path: `/categories/${article.category_slug || ''}` },
          { label: article.title }
        ]}
        onNavigate={onNavigate}
      />

      {/* 🛡️ Admin In-Place Topic Edit Banner (Appears inside the topic for admins) */}
      {isAdminUser && (
        <div
          id="admin-topic-edit-banner"
          className="my-6 p-4 sm:p-5 bg-gradient-to-r from-amber-50/90 via-emerald-50/70 to-stone-50 border-2 border-amber-400/90 rounded-3xl shadow-sm flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-black text-lg shadow-sm shrink-0">
              ✏️
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-heading font-black text-sm sm:text-base text-stone-900">
                  لوحة تعديل الموضوع المباشرة (فاطمة محمد)
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#36533D] text-white">
                  مدير المنصة 🛡️
                </span>
                {article.status === 'published' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    منشور للعامة 🟢
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900">
                    مسودة خاصة 📝
                  </span>
                )}
                {article.is_featured === 1 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                    مميز في الرئيسية ⭐
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                يمكنكِ تعديل هذا المقال وعنوانه وصورته ومحتواه مباشرة من هنا، وستظهر التعديلات فوراً أمامكِ دون أن تحجبكِ أي لوحة تحكم!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsEditModalOpen(true)}
              id="btn-edit-article-top-action"
              className="px-5 py-2.5 bg-[#36533D] hover:bg-[#2A4230] text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer border border-[#36533D] active:scale-95"
            >
              <Edit className="w-4 h-4 text-amber-300" />
              <span>تعديل هذا الموضوع الآن</span>
            </button>
            <button
              onClick={() => onNavigate('/admin')}
              className="px-3.5 py-2.5 bg-white hover:bg-stone-100 text-stone-700 font-bold text-xs rounded-xl border border-stone-300 flex items-center gap-1.5 transition-all cursor-pointer"
              title="الانتقال للوحة التحكم الإدارية العامة"
            >
              <Shield className="w-3.5 h-3.5 text-stone-500" />
              <span>لوحة الإدارة</span>
            </button>
          </div>
        </div>
      )}

      {/* Article Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 bg-[#36533D]/10 text-[#36533D] font-bold text-xs rounded-full">
            {article.category_name}
          </span>
          <span className="text-stone-300">•</span>
          <span className="text-xs text-stone-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {article.reading_time} دقائق قراءة
          </span>
          <span className="text-stone-300">•</span>
          <span className="text-xs text-stone-500 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            {article.view_count || 0} قراءة
          </span>
        </div>

        <h1 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-stone-900 leading-tight mb-4">
          {article.title}
        </h1>

        <p className="font-body text-base sm:text-lg text-stone-600 leading-relaxed mb-6 font-medium">
          {article.excerpt}
        </p>

        {/* Author info & Actions button row */}
        <div className="flex items-center justify-between py-4 border-y border-[#E7E2D8] flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#36533D]/10 text-[#36533D] flex items-center justify-center font-bold text-sm">
              {article.author_name?.charAt(0) || 'ن'}
            </div>
            <div>
              <p className="font-bold text-sm text-stone-900">{article.author_name}</p>
              <p className="text-xs text-stone-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                نُشر في {article.published_at?.slice(0, 10)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Primary Inside Edit Button for Admin */}
            {isAdminUser && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                id="article-edit-btn-author-row"
                className="px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer border border-amber-500/40 active:scale-95"
                title="تعديل هذا الموضوع مباشرة"
              >
                <Edit className="w-4 h-4 text-stone-950" />
                <span>تعديل الموضوع</span>
              </button>
            )}

            <button
              onClick={() => {
                const player = document.getElementById('article-audio-player');
                if (player) {
                  player.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  // Optionally trigger play automatically
                  const playBtn = document.getElementById('tts-play-toggle');
                  if (playBtn) {
                    setTimeout(() => {
                      (playBtn as HTMLButtonElement).click();
                    }, 800);
                  }
                }
              }}
              className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-amber-200 bg-amber-50/50 text-[#36533D] hover:bg-amber-100 transition-all cursor-pointer flex items-center gap-2 text-xs font-bold shadow-2xs"
            >
              <Volume2 className="w-4 h-4" />
              <span>استماع للمقال</span>
            </button>

            <button
              onClick={toggleBookmark}
              id="article-bookmark-top-btn"
              className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 text-xs font-bold shadow-2xs ${
                bookmarked
                  ? 'bg-[#36533D] text-white border-[#36533D] hover:bg-[#2A4230]'
                  : 'bg-white text-stone-700 border-[#E7E2D8] hover:bg-stone-50 hover:border-stone-400'
              }`}
              title={bookmarked ? 'المقال محفوظ في مفضلتكِ (انقر للإزالة)' : 'إضافة المقال للمفضلة'}
            >
              <Bookmark className={`w-4 h-4 transition-transform ${bookmarked ? 'fill-amber-300 text-amber-300 scale-105' : 'text-stone-500'}`} />
              <span>{bookmarked ? 'محفوظ في مفضلتكِ' : 'إضافة للمفضلة'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Featured Cover Image */}
      {article.featured_image && (
        <div className="relative aspect-[16/9] rounded-3xl overflow-hidden mb-8 shadow-sm border border-[#E7E2D8] bg-stone-100">
          <img
            src={article.featured_image}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Text-to-Speech (TTS) Audio Player */}
      <ArticleAudioPlayer
        title={article.title}
        excerpt={article.excerpt}
        content={article.content}
      />

      {/* Article Body Content */}
      <div
        className="prose-editorial max-w-none text-stone-800 leading-relaxed text-base md:text-lg mb-12"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {/* Tags if any */}
      {article.tags && article.tags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap py-4 border-t border-[#E7E2D8] mb-8">
          <span className="text-xs font-bold text-stone-400">وسوم:</span>
          {article.tags.map((t, i) => (
            <span key={i} className="px-3 py-1 bg-white border border-[#E7E2D8] text-stone-600 rounded-lg text-xs font-medium">
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Save to Favorites & Share Section */}
      <div className="p-6 bg-[#FAF7F2] border border-[#E7E2D8] rounded-2xl mb-12 flex flex-col md:flex-row items-center justify-between gap-5 text-right">
        <div className="w-full md:w-auto">
          <p className="text-xs font-bold text-stone-500 mb-2">مشاركة المقال مع من تحب:</p>
          <ShareButtons title={article.title} />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 pt-4 md:pt-0 border-[#E7E2D8]">
          <button
            onClick={toggleBookmark}
            id="article-bookmark-bottom-btn"
            className={`px-4 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 text-xs font-bold shadow-2xs ${
              bookmarked
                ? 'bg-[#36533D] text-white border-[#36533D] hover:bg-[#2A4230]'
                : 'bg-white text-stone-800 border-[#E7E2D8] hover:bg-stone-50 hover:border-stone-400'
            }`}
          >
            <Bookmark className={`w-4 h-4 transition-transform ${bookmarked ? 'fill-amber-300 text-amber-300' : 'text-stone-500'}`} />
            <span>{bookmarked ? 'تم حفظه في مفضلتكِ' : 'إضافة للمفضلة للرجوع لاحقاً'}</span>
          </button>

          <button
            onClick={() => onNavigate('/bookmarks')}
            id="article-view-bookmarks-link"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-[#36533D] hover:text-[#2A4230] hover:underline transition cursor-pointer"
          >
            <span>عرض كل محفوظاتكِ</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Next & Previous navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-16 pt-6 border-t border-[#E7E2D8]">
        {prevArticle ? (
          <button
            onClick={() => onNavigate(`/articles/${prevArticle.slug}`)}
            className="p-4 bg-white border border-[#E7E2D8] hover:border-[#36533D] rounded-xl text-right transition-colors group cursor-pointer"
          >
            <span className="text-[11px] text-stone-400 flex items-center gap-1 mb-1">
              <ChevronRight className="w-3.5 h-3.5" />
              المقال السابق
            </span>
            <p className="font-bold text-xs sm:text-sm text-stone-900 group-hover:text-[#36533D] line-clamp-1">
              {prevArticle.title}
            </p>
          </button>
        ) : <div />}

        {nextArticle && (
          <button
            onClick={() => onNavigate(`/articles/${nextArticle.slug}`)}
            className="p-4 bg-white border border-[#E7E2D8] hover:border-[#36533D] rounded-xl text-left transition-colors group cursor-pointer"
          >
            <span className="text-[11px] text-stone-400 flex items-center justify-end gap-1 mb-1">
              المقال التالي
              <ChevronLeft className="w-3.5 h-3.5" />
            </span>
            <p className="font-bold text-xs sm:text-sm text-stone-900 group-hover:text-[#36533D] line-clamp-1 text-right">
              {nextArticle.title}
            </p>
          </button>
        )}
      </div>

      {/* Mood Reader Discovery Box */}
      <div className="mb-14 p-5 sm:p-6 rounded-2xl bg-[#FDFBF7] border border-[#E7E2D8] text-right">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌿</span>
            <div>
              <h4 className="font-heading font-bold text-sm sm:text-base text-stone-900">
                كيف تشعر الآن بعد هذه القراءة؟
              </h4>
              <p className="text-xs text-stone-500">
                اختر حالتك المزاجية لنقترح لك مقالات ورحلات تعافٍ تناسب ما تحتاج إليه روحك في هذه اللحظة:
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
          {MOODS.map((m) => (
            <button
              key={m.id}
              onClick={() => onNavigate(`/articles?mood=${m.id}`)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 border border-[#E7E2D8] text-xs font-bold text-stone-700 whitespace-nowrap transition-all shadow-2xs hover:border-stone-400 cursor-pointer"
            >
              <span>{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recommended Video if any */}
      {recommendedVideos.length > 0 && (
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <VideoIcon className="w-5 h-5 text-[#36533D]" />
            <h3 className="font-heading font-bold text-xl text-stone-900">فيديو مقترح مرتبط بهذا الموضوع</h3>
          </div>
          <div className="max-w-md">
            <VideoCard video={recommendedVideos[0]} onNavigate={onNavigate} />
          </div>
        </div>
      )}

      {/* Comments Section */}
      <section className="mb-16 pt-8 border-t border-[#E7E2D8]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#36533D]" />
            <h3 className="font-heading font-bold text-xl text-stone-900">المشاركات والتعليقات ({comments.length})</h3>
          </div>
          <span className="text-xs text-stone-400">مساحة للحوار الواعي والمحترم</span>
        </div>

        {/* Comment Form */}
        <form onSubmit={handleCommentSubmit} className="p-5 bg-white border border-[#E7E2D8] rounded-2xl mb-8 space-y-4">
          <h4 className="font-bold text-xs text-stone-700">أضيفي أثرك أو شاركينا رأيكِ:</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="اسمكِ الكريم (أو اسم مستعار)"
                className="w-full px-3.5 py-2 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs focus:outline-none focus:border-[#36533D]"
              />
            </div>
            <div>
              <input
                type="email"
                value={authorEmail}
                onChange={(e) => setAuthorEmail(e.target.value)}
                placeholder="البريد الإلكتروني (لن ينشر علناً)"
                className="w-full px-3.5 py-2 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs focus:outline-none focus:border-[#36533D]"
              />
            </div>
          </div>

          <div>
            <textarea
              required
              rows={3}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="اكتبي تعليقكِ هنا بكل محبة ووعي..."
              className="w-full p-3 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs leading-relaxed focus:outline-none focus:border-[#36533D]"
            />
          </div>

          <button
            type="submit"
            disabled={submittingComment}
            className="px-5 py-2.5 bg-[#36533D] hover:bg-[#2A4230] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-60"
          >
            {submittingComment ? 'جارٍ النشر...' : 'إرسال التعليق'}
            <Send className="w-3 h-3" />
          </button>
        </form>

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length > 0 ? (
            comments.map((c) => (
              <div key={c.id} className="p-4 bg-white border border-[#E7E2D8] rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#FAF7F2] border border-[#E7E2D8] flex items-center justify-center font-bold text-xs text-[#36533D]">
                      {c.author_name.charAt(0)}
                    </div>
                    <span className="font-bold text-xs text-stone-900">{c.author_name}</span>
                  </div>
                  <span className="text-[10px] text-stone-400">{c.created_at?.slice(0, 10)}</span>
                </div>
                <p className="font-body text-xs sm:text-sm text-stone-700 leading-relaxed pr-9">
                  {c.comment_text}
                </p>
              </div>
            ))
          ) : (
            <p className="text-xs text-stone-400 text-center py-4">كن أول من يترك أثراً وشاركنا رأيك 🤍</p>
          )}
        </div>
      </section>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="pt-8 border-t border-[#E7E2D8]">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-[#36533D]" />
            <h3 className="font-heading font-bold text-xl text-stone-900">موضوعات ذات صلة قد تهمكِ</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {relatedArticles.map((rel) => (
              <ArticleCard key={rel.id} article={rel} onNavigate={onNavigate} />
            ))}
          </div>
        </section>
      )}

      {/* Floating Quick Edit Button for Admin */}
      {isAdminUser && (
        <button
          onClick={() => setIsEditModalOpen(true)}
          id="article-floating-edit-btn"
          className="fixed bottom-6 left-6 z-40 px-4 py-3 bg-[#36533D] hover:bg-[#2A4230] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-xl flex items-center gap-2 border-2 border-amber-400 cursor-pointer transition-all hover:scale-105 active:scale-95"
          title="تعديل هذا الموضوع مباشرة من الداخل"
        >
          <Edit className="w-4 h-4 text-amber-300" />
          <span>تعديل الموضوع من الداخل ✏️</span>
        </button>
      )}

      {/* Article Edit Modal */}
      {article && (
        <ArticleEditModal
          isOpen={isEditModalOpen}
          article={article}
          onClose={() => setIsEditModalOpen(false)}
          onSaved={(updated) => {
            setArticle(updated);
            if (updated.slug && updated.slug !== slug) {
              onNavigate(`/articles/${updated.slug}`);
            }
          }}
        />
      )}
    </div>
  );
}
