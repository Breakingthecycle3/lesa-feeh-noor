import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  ArrowLeft,
  Heart,
  Compass,
  Headphones,
  Video as VideoIcon,
  BookOpen,
  MessageSquareHeart,
  Quote,
  Flame,
  ChevronRight
} from 'lucide-react';
import { Article, Video, Message, Journey, Podcast, Category } from '../types';
import { api } from '../lib/api';
import { ArticleCard, VideoCard, MessageCard, JourneyCard, PodcastCard, CategoryCard } from '../components/Cards';
import { LoadingState } from '../components/Common';
import { MoodSelector } from '../components/MoodSelector';

export function HomePage({
  onNavigate,
  onOpenQuoteModal
}: {
  onNavigate: (path: string) => void;
  onOpenQuoteModal?: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [featuredArticle, setFeaturedArticle] = useState<Article | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [popularArticles, setPopularArticles] = useState<Article[]>([]);
  const [dailyQuoteIndex, setDailyQuoteIndex] = useState(0);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [artRes, vidRes, msgRes, jrnRes, podRes, catRes, popRes] = await Promise.all([
          api.getArticles({ limit: 6 }),
          api.getVideos({ limit: 4 }),
          api.getMessages({ limit: 6 }),
          api.getJourneys(),
          api.getPodcasts(),
          api.getCategories(),
          api.getPopular()
        ]);

        const allArticles = artRes.articles || [];
        setArticles(allArticles);
        const feat = allArticles.find((a) => a.is_featured === 1) || allArticles[0] || null;
        setFeaturedArticle(feat);

        setVideos(vidRes.videos || []);
        setMessages(msgRes.messages || []);
        setJourneys(jrnRes.journeys || []);
        setPodcasts(podRes.podcasts || []);
        setCategories(catRes.categories || []);
        setPopularArticles(popRes.mostReadArticles || []);
      } catch (err) {
        console.error('Failed to load homepage data', err);
      } finally {
        setLoading(false);
      }
    }

    loadHomeData();
  }, []);

  if (loading) {
    return <LoadingState message="نستحضر لكِ مساحة السكينة والنور..." />;
  }

  const dailyMessages = messages.length > 0 ? messages : [
    {
      id: 1,
      title: 'كل مرحلة ولها نورها',
      text: 'ما تمرين به اليوم ليس نهاية حكايتك، بل هو المنعطف الذي يعلمك كيف تضعين حدودك وتحمين قلبك بوعي.',
      category_name: 'همسة أمل',
      slug: 'stage-light',
      author_name: 'فريق لسه في نور',
      is_featured: 1,
      view_count: 10,
      status: 'published' as const,
      created_at: ''
    }
  ];

  const currentDaily = dailyMessages[dailyQuoteIndex % dailyMessages.length];

  return (
    <div className="space-y-20 md:space-y-28 pb-20 text-right" dir="rtl">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-8 md:pt-14 pb-12 md:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left/Text column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#36533D]/10 text-[#36533D] font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>مساحة عربية دافئة للتعافي واستعادة الذات</span>
              </div>

              <h1 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-stone-900 leading-[1.2] tracking-tight">
                مهما كان اللي عديت بيه... <br />
                <span className="text-[#36533D] relative inline-block">
                  لسه في نور.
                  <svg className="absolute -bottom-2 left-0 right-0 w-full text-amber-400/40 -z-10" viewBox="0 0 200 12" fill="currentColor">
                    <path d="M0,10 Q100,0 200,10" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>

              <p className="font-body text-base sm:text-lg text-stone-600 leading-relaxed max-w-2xl">
                هنا مساحتكِ الآمنة لفهم مشاعرك، التشافي من العلاقات المرهقة، بناء حدودكِ النفسية، واكتشاف أن القوة الحقيقية تبدأ من الرفق بنفسك.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => onNavigate('/journeys')}
                  className="px-6 py-3.5 bg-[#36533D] hover:bg-[#2A4230] text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Compass className="w-4 h-4 text-emerald-300" />
                  <span>اكتشفي رحلة التعافي</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onNavigate('/videos')}
                  className="px-5 py-3.5 bg-white hover:bg-stone-50 border border-[#E7E2D8] text-stone-800 font-bold rounded-xl text-sm transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <VideoIcon className="w-4 h-4 text-[#36533D]" />
                  <span>شاهدي الفيديوهات الإرشادية</span>
                </button>

                <button
                  onClick={() => onNavigate('/chat')}
                  className="px-5 py-3.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/80 text-emerald-900 font-bold rounded-xl text-sm transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>تحدث مع رفيق النور (AI)</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-[#E7E2D8] flex items-center gap-6 text-xs text-stone-500">
                <div className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  <span>محتوى نفسي رصين ومبسط</span>
                </div>
                <div>•</div>
                <div>سرية وأمان تام</div>
                <div>•</div>
                <div>صوت يدعمكِ ولا يحكم عليكِ</div>
              </div>
            </div>

            {/* Right/Visual column */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-stone-100">
                  <img
                    src="https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1000&q=80"
                    alt="ضوء شمس ونباتات دافئة"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent"></div>
                  
                  {/* Overlay inspirational sticker */}
                  <div className="absolute bottom-6 right-6 left-6 p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-white/40 shadow-lg text-right">
                    <p className="text-xs font-bold text-[#36533D] mb-1 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      رسالة لكِ الآن
                    </p>
                    <p className="text-xs sm:text-sm text-stone-800 font-medium leading-relaxed">
                      "أنتِ لستِ ما حدث لكِ.. أنتِ ما تختارين أن تصبحي عليه اليوم."
                    </p>
                  </div>
                </div>

                {/* Decorative glow */}
                <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-[#C5A880]/20 rounded-full blur-3xl -z-10"></div>
                <div className="absolute -top-6 -left-6 w-48 h-48 bg-[#36533D]/10 rounded-full blur-3xl -z-10"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURED EMOTIONAL MESSAGE BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#2A4736] via-[#36533D] to-[#243A2C] text-white p-8 md:p-12 shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-200 text-xs font-bold">
                <Quote className="w-3 h-3" />
                <span>رسالة من القلب</span>
              </div>
              <h2 className="font-heading font-bold text-xl md:text-2xl lg:text-3xl leading-snug">
                "ليس عليكِ أن تملكي كل الإجابات اليوم، يكفي أن تأخذي نَفَساً عميقاً وتختاري الرفق بقلبك."
              </h2>
              <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
                في منصة لسه في نور، لا نطلب منكِ أن تتجاوزي الألم فوراً، بل نسير معكِ خطوة بخطوة حتى يعود الأمان إلى داخلك.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              {onOpenQuoteModal && (
                <button
                  onClick={onOpenQuoteModal}
                  id="home-quote-banner-btn"
                  className="w-full sm:w-auto px-5 py-3.5 bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-300/40 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  title="سحب اقتباس عشوائي ملهم"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>قبس من النور ✨</span>
                </button>
              )}
              <button
                onClick={() => onNavigate('/messages')}
                className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-stone-100 text-[#36533D] font-bold rounded-xl text-sm shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>رسائل النور اليومية</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2.5 MOOD DISCOVERY & RECOMMENDATION SECTION */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <MoodSelector onNavigate={onNavigate} />
      </div>

      {/* 3. LATEST TOPICS & ARTICLES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 pb-4 border-b border-[#E7E2D8]">
          <div>
            <div className="text-xs font-bold text-[#36533D] mb-1">المكتبة التحريرية</div>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-stone-900">
              أحدث الموضوعات والمقالات
            </h2>
          </div>
          <button
            onClick={() => onNavigate('/articles')}
            className="text-xs sm:text-sm font-bold text-[#36533D] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>عرض كل الموضوعات</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.slice(0, 6).map((art) => (
            <ArticleCard key={art.id} article={art} onNavigate={onNavigate} />
          ))}
        </div>
      </section>

      {/* 4. FEATURED TOPIC SPOTLIGHT */}
      {featuredArticle && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-1 bg-[#FAF7F2] rounded-3xl border border-[#E7E2D8]">
            <div className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl overflow-hidden bg-white">
              <div className="lg:col-span-6 relative aspect-[16/10] lg:aspect-auto min-h-[300px]">
                <img
                  src={featuredArticle.featured_image}
                  alt={featuredArticle.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-4 right-4 px-3.5 py-1 bg-[#36533D] text-white font-bold text-xs rounded-full shadow">
                  موضوع مختار بعناية
                </span>
              </div>

              <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#36533D] font-bold mb-3">
                    <span>{featuredArticle.category_name}</span>
                    <span>•</span>
                    <span className="text-stone-400 font-normal">{featuredArticle.reading_time} دقائق قراءة</span>
                  </div>

                  <h3 className="font-heading font-bold text-xl sm:text-2xl text-stone-900 mb-3 leading-snug hover:text-[#36533D] cursor-pointer transition-colors"
                    onClick={() => onNavigate(`/articles/${featuredArticle.slug}`)}
                  >
                    {featuredArticle.title}
                  </h3>

                  <p className="font-body text-sm text-stone-600 leading-relaxed mb-6">
                    {featuredArticle.excerpt}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-[#E7E2D8]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#36533D]/10 text-[#36533D] flex items-center justify-center font-bold text-xs">
                      {featuredArticle.author_name?.charAt(0) || 'ن'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-800">{featuredArticle.author_name}</p>
                      <p className="text-[10px] text-stone-400">إشراف فريق التحرير النفسي</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate(`/articles/${featuredArticle.slug}`)}
                    className="px-4 py-2 bg-[#36533D] hover:bg-[#2A4230] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span>قراءة الموضوع كاملاً</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. LATEST VIDEOS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 pb-4 border-b border-[#E7E2D8]">
          <div>
            <div className="text-xs font-bold text-[#36533D] mb-1">مرئيات إرشادية قصيرة</div>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-stone-900">
              فيديوهات تساعدكِ على الفهم والتعافي
            </h2>
          </div>
          <button
            onClick={() => onNavigate('/videos')}
            className="text-xs sm:text-sm font-bold text-[#36533D] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>كل الفيديوهات</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {videos.slice(0, 4).map((vid) => (
            <VideoCard key={vid.id} video={vid} onNavigate={onNavigate} />
          ))}
        </div>
      </section>

      {/* 6. "ربما تحتاجين أن تسمعي هذا اليوم" (Daily Rotating Inspiration) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative p-8 md:p-12 bg-white border border-[#E7E2D8] rounded-3xl shadow-sm text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#36533D]/10 text-[#36533D] flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-amber-500" />
          </div>

          <span className="text-xs font-bold text-[#36533D] block mb-2">
            ربما تحتاجين أن تسمعي هذا اليوم 🤍
          </span>

          <h3 className="font-heading font-bold text-lg md:text-xl text-stone-800 leading-relaxed mb-6 max-w-xl mx-auto">
            "{currentDaily.text}"
          </h3>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setDailyQuoteIndex((prev) => (prev + 1) % dailyMessages.length)}
              className="px-4 py-2 bg-[#FAF7F2] hover:bg-[#F0EBE1] border border-[#E7E2D8] text-xs font-bold text-stone-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>رسالة أخرى</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate('/messages')}
              className="px-4 py-2 bg-[#36533D] text-white hover:bg-[#2A4230] text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              تصفحي كل الرسائل
            </button>
          </div>
        </div>
      </section>

      {/* 7. HEALING JOURNEYS PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 pb-4 border-b border-[#E7E2D8]">
          <div>
            <div className="text-xs font-bold text-[#36533D] mb-1">مسارات متكاملة بالخطوات</div>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-stone-900">
              رحلات التعافي الإرشادية
            </h2>
          </div>
          <button
            onClick={() => onNavigate('/journeys')}
            className="text-xs sm:text-sm font-bold text-[#36533D] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>استكشاف كل المسارات</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {journeys.slice(0, 2).map((jrn) => (
            <JourneyCard key={jrn.id} journey={jrn} onNavigate={onNavigate} />
          ))}
        </div>
      </section>

      {/* 8. PODCAST PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 pb-4 border-b border-[#E7E2D8]">
          <div>
            <div className="text-xs font-bold text-[#36533D] mb-1">صوت يرافقك في طريقك</div>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-stone-900">
              بودكاست لسه في نور
            </h2>
          </div>
          <button
            onClick={() => onNavigate('/podcast')}
            className="text-xs sm:text-sm font-bold text-[#36533D] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>جميع الحلقات</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {podcasts.slice(0, 4).map((pod) => (
            <PodcastCard key={pod.id} podcast={pod} onNavigate={onNavigate} />
          ))}
        </div>
      </section>

      {/* 9. MOST READ / POPULAR CONTENT */}
      {popularArticles.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-600" />
            <h3 className="font-heading font-bold text-xl text-stone-900">الموضوعات الأكثر قراءة وتأثيراً</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {popularArticles.slice(0, 4).map((pop, idx) => (
              <div
                key={pop.id}
                onClick={() => onNavigate(`/articles/${pop.slug}`)}
                className="group p-4 bg-white border border-[#E7E2D8] hover:border-[#36533D]/40 rounded-2xl flex items-start gap-3 cursor-pointer transition-all shadow-sm"
              >
                <span className="w-7 h-7 rounded-xl bg-[#FAF7F2] border border-[#E7E2D8] text-[#36533D] font-bold text-xs flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div>
                  <h4 className="font-heading font-bold text-xs sm:text-sm text-stone-900 group-hover:text-[#36533D] line-clamp-2 leading-snug mb-1 transition-colors">
                    {pop.title}
                  </h4>
                  <span className="text-[11px] text-stone-400">{pop.view_count || 0} قراءة</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 10. ANONYMOUS "احكي لنا" INVITATION */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-[#FAF7F2] border border-[#E7E2D8] p-8 md:p-12 text-right">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E7E2D8] text-xs font-bold text-[#36533D]">
                <MessageSquareHeart className="w-3.5 h-3.5 text-rose-500" />
                <span>مساحة سرية بدون اسم أو حكم</span>
              </div>
              <h3 className="font-heading font-black text-2xl sm:text-3xl text-stone-900">
                احكي لنا.. نحن هنا لنسمعك
              </h3>
              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed max-w-xl">
                في بعض الأحيان، نحتاج فقط لمساحة آمنة نضع فيها ثقل ما نحمله دون خوف. يمكنكِ كتابة ما تشعرين به بسرية تامة، ونقرأ كل حرف باحترام ورعاية.
              </p>
            </div>
            <div className="md:col-span-4 flex md:justify-end">
              <button
                onClick={() => onNavigate('/tell-us')}
                className="w-full sm:w-auto px-6 py-3.5 bg-[#36533D] hover:bg-[#2A4230] text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>ابدأي بالفضفضة الآن</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 11. CATEGORIES BROWSER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between pb-3 border-b border-[#E7E2D8]">
          <h3 className="font-heading font-bold text-xl text-stone-900">تصفحي حسب ما تحتاجينه الآن</h3>
          <span className="text-xs text-stone-400">جميع الأقسام منظمة لمساعدتك</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => onNavigate(`/categories/${c.slug}`)}
              className="p-3.5 bg-white border border-[#E7E2D8] hover:border-[#36533D] hover:bg-[#FAF7F2] rounded-xl text-right transition-all group cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-[#36533D]/10 text-[#36533D] flex items-center justify-center font-bold text-xs mb-2 group-hover:bg-[#36533D] group-hover:text-white transition-colors">
                {c.name.charAt(0)}
              </div>
              <h5 className="font-bold text-xs text-stone-900 group-hover:text-[#36533D] truncate">{c.name}</h5>
              <span className="text-[10px] text-stone-400 block mt-0.5">{c.articles_count || 0} مقال</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
