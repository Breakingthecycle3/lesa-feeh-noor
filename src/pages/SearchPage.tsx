import React, { useState, useEffect } from 'react';
import { Search, Sparkles, BookOpen, Video as VideoIcon, Quote, Headphones, Compass } from 'lucide-react';
import { Article, Video, Message, Podcast, Journey } from '../types';
import { api } from '../lib/api';
import { ArticleCard, VideoCard, MessageCard, PodcastCard, JourneyCard } from '../components/Cards';
import { Breadcrumbs, LoadingState, EmptyState, SEOHead } from '../components/Common';

export function SearchPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'articles' | 'videos' | 'messages' | 'podcasts' | 'journeys'>('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    articles: Article[];
    videos: Video[];
    messages: Message[];
    podcasts: Podcast[];
    journeys: Journey[];
  }>({
    articles: [],
    videos: [],
    messages: [],
    podcasts: [],
    journeys: []
  });
  const [totalResults, setTotalResults] = useState(0);

  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults({ articles: [], videos: [], messages: [], podcasts: [], journeys: [] });
      setTotalResults(0);
      return;
    }
    setLoading(true);
    try {
      const res = await api.search(searchTerm);
      setResults(res.results);
      setTotalResults(res.totalResults || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        handleSearch(query);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 text-right" dir="rtl">
      <SEOHead title="البحث الشامل" description="ابحث في جميع محتويات منصة لسه في نور." />

      <Breadcrumbs
        items={[
          { label: 'الرئيسية', path: '/' },
          { label: 'البحث' }
        ]}
        onNavigate={onNavigate}
      />

      {/* Search Input Bar */}
      <div className="max-w-2xl mx-auto mb-10 text-center">
        <h1 className="font-heading font-black text-2xl sm:text-3xl text-stone-900 mb-4">
          عن ماذا تبحثين اليوم؟
        </h1>
        <div className="relative">
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="اكتبي كلمة مثل: نرجسية، حدود، أمان، تجاوز، طلاق، قلق..."
            className="w-full pl-4 pr-12 py-4 bg-white border border-[#E7E2D8] rounded-2xl text-sm sm:text-base focus:outline-none focus:border-[#36533D] shadow-sm"
          />
          <Search className="w-5 h-5 text-[#36533D] absolute right-4 top-4.5" />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex items-center justify-center gap-2 flex-wrap mt-3 text-xs text-stone-500">
          <span>كلمات رائجة:</span>
          {['الحدود الشخصية', 'التعافي من الصدمة', 'العلاقات المؤذية', 'السلام الداخلي'].map((kw) => (
            <button
              key={kw}
              onClick={() => {
                setQuery(kw);
                handleSearch(kw);
              }}
              className="px-2.5 py-1 bg-white border border-[#E7E2D8] rounded-lg hover:border-[#36533D] transition-colors cursor-pointer"
            >
              {kw}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs Filter */}
      {query && (
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 mb-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#36533D] text-white shadow-sm'
                : 'bg-white border border-[#E7E2D8] text-stone-700 hover:bg-stone-50'
            }`}
          >
            الكل ({totalResults})
          </button>
          <button
            onClick={() => setActiveTab('articles')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'articles'
                ? 'bg-[#36533D] text-white shadow-sm'
                : 'bg-white border border-[#E7E2D8] text-stone-700 hover:bg-stone-50'
            }`}
          >
            المقالات ({results.articles.length})
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'videos'
                ? 'bg-[#36533D] text-white shadow-sm'
                : 'bg-white border border-[#E7E2D8] text-stone-700 hover:bg-stone-50'
            }`}
          >
            الفيديوهات ({results.videos.length})
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'messages'
                ? 'bg-[#36533D] text-white shadow-sm'
                : 'bg-white border border-[#E7E2D8] text-stone-700 hover:bg-stone-50'
            }`}
          >
            الرسائل ({results.messages.length})
          </button>
        </div>
      )}

      {/* Results Display */}
      {loading ? (
        <LoadingState message="نبحث لكِ في كل زوايا المنصة..." />
      ) : query && totalResults === 0 ? (
        <EmptyState
          title={`لم نعثر على نتائج لـ "${query}"`}
          description="جربي البحث بمرادفات أخرى أو تصفح الأقسام الرئيسية."
          actionLabel="عرض كل الموضوعات"
          onAction={() => onNavigate('/articles')}
        />
      ) : (
        <div className="space-y-12">
          {/* Articles */}
          {(activeTab === 'all' || activeTab === 'articles') && results.articles.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#E7E2D8]">
                <BookOpen className="w-5 h-5 text-[#36533D]" />
                <h3 className="font-heading font-bold text-lg text-stone-900">الموضوعات والمقالات</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.articles.map((art) => (
                  <ArticleCard key={art.id} article={art} onNavigate={onNavigate} />
                ))}
              </div>
            </section>
          )}

          {/* Videos */}
          {(activeTab === 'all' || activeTab === 'videos') && results.videos.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#E7E2D8]">
                <VideoIcon className="w-5 h-5 text-[#36533D]" />
                <h3 className="font-heading font-bold text-lg text-stone-900">الفيديوهات</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.videos.map((vid) => (
                  <VideoCard key={vid.id} video={vid} onNavigate={onNavigate} />
                ))}
              </div>
            </section>
          )}

          {/* Messages */}
          {(activeTab === 'all' || activeTab === 'messages') && results.messages.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#E7E2D8]">
                <Quote className="w-5 h-5 text-[#36533D]" />
                <h3 className="font-heading font-bold text-lg text-stone-900">رسائل لسه في نور</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.messages.map((msg) => (
                  <MessageCard key={msg.id} message={msg} onNavigate={onNavigate} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
