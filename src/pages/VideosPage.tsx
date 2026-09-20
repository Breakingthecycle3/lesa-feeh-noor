import React, { useState, useEffect } from 'react';
import { Play, Sparkles, Search, Filter } from 'lucide-react';
import { Video, Category } from '../types';
import { api } from '../lib/api';
import { VideoCard } from '../components/Cards';
import { Breadcrumbs, Pagination, LoadingState, EmptyState, SEOHead } from '../components/Common';

export function VideosPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [featuredVideo, setFeaturedVideo] = useState<Video | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCategories().then((res) => setCategories(res.categories || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    api.getVideos({
      category: selectedCategory || undefined,
      search: searchQuery || undefined,
      page,
      limit: 8
    })
      .then((res) => {
        setVideos(res.videos || []);
        if (res.featuredVideo) setFeaturedVideo(res.featuredVideo);
        else if (res.videos?.length > 0 && !featuredVideo) setFeaturedVideo(res.videos[0]);
        setTotalPages(res.pagination?.totalPages || 1);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedCategory, searchQuery, page]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 text-right" dir="rtl">
      <SEOHead
        title="مكتبة الفيديوهات الإرشادية"
        description="مقاطع مرئية نفسية وإرشادية قصيرة ترشدكِ في فهم المشاعر والتعافي وبناء الذات."
      />

      <Breadcrumbs
        items={[
          { label: 'الرئيسية', path: '/' },
          { label: 'الفيديوهات الإرشادية' }
        ]}
        onNavigate={onNavigate}
      />

      {/* Header */}
      <div className="max-w-3xl mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#36533D]/10 text-[#36533D] font-bold text-xs mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>المرئيات الإرشادية</span>
        </div>
        <h1 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-stone-900 mb-3">
          فيديوهات تعافي ورؤى مكثفة
        </h1>
        <p className="font-body text-sm sm:text-base text-stone-600 leading-relaxed">
          شروحات هادئة ومكثفة لفك شيفرات العلاقات الصعبة، تجاوز القلق، واكتساب مهارات الوعي الذاتي.
        </p>
      </div>

      {/* Featured Video Spotlight Banner */}
      {featuredVideo && !searchQuery && !selectedCategory && page === 1 && (
        <div
          onClick={() => onNavigate(`/videos/${featuredVideo.slug}`)}
          className="group relative mb-12 rounded-3xl overflow-hidden border border-[#E7E2D8] bg-stone-900 cursor-pointer shadow-lg"
        >
          <div className="relative aspect-[16/8] md:aspect-[21/9] w-full overflow-hidden">
            <img
              src={featuredVideo.thumbnail}
              alt={featuredVideo.title}
              className="w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-90 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent"></div>

            {/* Big Play Button Center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#36533D]/90 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                <Play className="w-7 h-7 md:w-8 md:h-8 fill-current mr-1" />
              </div>
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-6 right-6 left-6 text-white max-w-3xl">
              <span className="px-3 py-1 bg-[#36533D] text-xs font-bold rounded-full mb-3 inline-block">
                فيديو مميز مختار
              </span>
              <h2 className="font-heading font-bold text-xl sm:text-2xl md:text-3xl mb-2 leading-tight">
                {featuredVideo.title}
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 line-clamp-2 leading-relaxed">
                {featuredVideo.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="space-y-4 mb-8">
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

        <div className="relative max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="ابحث في عناوين الفيديوهات..."
            className="w-full pl-4 pr-10 py-2.5 bg-white border border-[#E7E2D8] rounded-xl text-xs focus:outline-none focus:border-[#36533D]"
          />
          <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-3" />
        </div>
      </div>

      {/* Videos Grid */}
      {loading ? (
        <LoadingState message="جارٍ استحضار الفيديوهات..." />
      ) : videos.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {videos.map((vid) => (
              <VideoCard key={vid.id} video={vid} onNavigate={onNavigate} />
            ))}
          </div>

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      ) : (
        <EmptyState
          title="لم نجد فيديوهات مطابقة"
          description="جربي البحث بكلمات أخرى أو تصفح كل الأقسام."
          actionLabel="عرض كل الفيديوهات"
          onAction={() => {
            setSelectedCategory('');
            setSearchQuery('');
          }}
        />
      )}
    </div>
  );
}
