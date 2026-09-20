import React, { useState, useEffect } from 'react';
import { Eye, Calendar, User, Sparkles, MessageCircle, Send } from 'lucide-react';
import { Video, Article, Comment } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Breadcrumbs, ShareButtons, LoadingState, ErrorState, SEOHead } from '../components/Common';
import { VideoCard, ArticleCard } from '../components/Cards';

export function VideoDetailPage({
  slug,
  onNavigate
}: {
  slug: string;
  onNavigate: (path: string) => void;
}) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [video, setVideo] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);

  // Comments
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

  const fetchVideo = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getVideo(slug);
      setVideo(res.video);
      setRelatedVideos(res.relatedVideos || []);
      setRelatedArticles(res.relatedArticles || []);

      if (res.video?.id) {
        api.getComments('video', res.video.id).then((cRes) => {
          setComments(cRes.comments || []);
        });
      }
    } catch (err: any) {
      setError(err.message || 'تعذر تحميل الفيديو');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideo();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!video || !commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await api.addComment({
        content_type: 'video',
        content_id: video.id,
        author_name: authorName || 'متابعة كريمة',
        author_email: authorEmail || 'guest@lesanour.com',
        comment_text: commentText
      });
      showToast(res.message, 'success');
      setCommentText('');

      api.getComments('video', video.id).then((cRes) => {
        setComments(cRes.comments || []);
      });
    } catch (err: any) {
      showToast(err.message || 'فشل إرسال التعليق', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) return <LoadingState message="نستحضر الفيديو الإرشادي..." />;
  if (error || !video) return <ErrorState message={error || 'الفيديو غير موجود'} onRetry={fetchVideo} />;

  // Extract YouTube ID if valid
  let embedUrl = '';
  if (video.video_url.includes('youtube.com/watch?v=')) {
    const id = video.video_url.split('watch?v=')[1]?.split('&')[0];
    embedUrl = `https://www.youtube.com/embed/${id}?autoplay=1`;
  } else if (video.video_url.includes('youtu.be/')) {
    const id = video.video_url.split('youtu.be/')[1]?.split('?')[0];
    embedUrl = `https://www.youtube.com/embed/${id}?autoplay=1`;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 text-right" dir="rtl">
      <SEOHead title={video.title} description={video.description} />

      <Breadcrumbs
        items={[
          { label: 'الرئيسية', path: '/' },
          { label: 'الفيديوهات', path: '/videos' },
          { label: video.title }
        ]}
        onNavigate={onNavigate}
      />

      {/* Video Player Box */}
      <div className="relative aspect-[16/9] w-full rounded-3xl overflow-hidden bg-stone-900 shadow-2xl mb-8 border border-[#E7E2D8]">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        ) : (
          <video
            controls
            poster={video.thumbnail}
            className="w-full h-full object-cover"
          >
            <source src={video.video_url} type="video/mp4" />
            متصفحك لا يدعم تشغيل الفيديو.
          </video>
        )}
      </div>

      {/* Info Section */}
      <div className="mb-10 pb-8 border-b border-[#E7E2D8]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 bg-[#36533D]/10 text-[#36533D] font-bold text-xs rounded-full">
            {video.category_name || 'فيديو إرشادي'}
          </span>
          <span className="text-stone-300">•</span>
          <span className="text-xs text-stone-500 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            {video.view_count || 0} مشاهدة
          </span>
          <span className="text-stone-300">•</span>
          <span className="text-xs text-stone-500">المدة: {video.duration}</span>
        </div>

        <h1 className="font-heading font-black text-2xl sm:text-3xl text-stone-900 mb-4 leading-snug">
          {video.title}
        </h1>

        <div className="flex items-center justify-between flex-wrap gap-4 py-3 border-y border-[#E7E2D8] mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#36533D]/10 text-[#36533D] flex items-center justify-center font-bold text-xs">
              {video.author_name?.charAt(0) || 'ن'}
            </div>
            <div>
              <p className="font-bold text-xs text-stone-900">{video.author_name}</p>
              <p className="text-[10px] text-stone-400">إشراف منصة لسه في نور</p>
            </div>
          </div>

          <ShareButtons title={video.title} />
        </div>

        <div className="prose max-w-none text-stone-700 text-sm md:text-base leading-relaxed whitespace-pre-line">
          {video.description}
        </div>
      </div>

      {/* Comments */}
      <section className="mb-16">
        <div className="flex items-center gap-2 mb-6">
          <MessageCircle className="w-5 h-5 text-[#36533D]" />
          <h3 className="font-heading font-bold text-xl text-stone-900">التعليقات والمشاركات ({comments.length})</h3>
        </div>

        {/* Form */}
        <form onSubmit={handleCommentSubmit} className="p-5 bg-white border border-[#E7E2D8] rounded-2xl mb-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="اسمكِ الكريم"
              className="w-full px-3.5 py-2 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs focus:outline-none focus:border-[#36533D]"
            />
            <input
              type="email"
              value={authorEmail}
              onChange={(e) => setAuthorEmail(e.target.value)}
              placeholder="البريد الإلكتروني"
              className="w-full px-3.5 py-2 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs focus:outline-none focus:border-[#36533D]"
            />
          </div>
          <textarea
            required
            rows={3}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="شاركينا انطباعكِ أو تجربتكِ مع موضوع الفيديو..."
            className="w-full p-3 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs leading-relaxed focus:outline-none focus:border-[#36533D]"
          />
          <button
            type="submit"
            disabled={submittingComment}
            className="px-5 py-2.5 bg-[#36533D] hover:bg-[#2A4230] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-60"
          >
            {submittingComment ? 'جارٍ النشر...' : 'إرسال التعليق'}
            <Send className="w-3 h-3" />
          </button>
        </form>

        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="p-4 bg-white border border-[#E7E2D8] rounded-2xl">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs text-stone-900">{c.author_name}</span>
                <span className="text-[10px] text-stone-400">{c.created_at?.slice(0, 10)}</span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">{c.comment_text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Related Videos & Articles */}
      {relatedVideos.length > 0 && (
        <section className="pt-8 border-t border-[#E7E2D8]">
          <h3 className="font-heading font-bold text-xl text-stone-900 mb-6">فيديوهات أخرى قد تهمكِ</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {relatedVideos.map((rv) => (
              <VideoCard key={rv.id} video={rv} onNavigate={onNavigate} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
