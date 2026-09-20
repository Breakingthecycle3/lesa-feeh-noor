import React, { useState, useEffect } from 'react';
import { Headphones, Play, Pause, Clock, Sparkles } from 'lucide-react';
import { Podcast } from '../types';
import { api } from '../lib/api';
import { Breadcrumbs, ShareButtons, LoadingState, ErrorState, SEOHead } from '../components/Common';
import { PodcastCard } from '../components/Cards';

export function PodcastDetailPage({
  slug,
  onNavigate
}: {
  slug: string;
  onNavigate: (path: string) => void;
}) {
  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [otherEpisodes, setOtherEpisodes] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api.getPodcast(slug)
      .then((res) => {
        setPodcast(res.podcast);
        setOtherEpisodes(res.otherEpisodes || []);
      })
      .catch((err) => setError(err.message || 'تعذر تحميل الحلقة'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <LoadingState message="نستحضر الحلقة الصوتية..." />;
  if (error || !podcast) return <ErrorState message={error || 'الحلقة غير متوفرة'} onRetry={() => window.location.reload()} />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 text-right" dir="rtl">
      <SEOHead title={podcast.title} description={podcast.description} />

      <Breadcrumbs
        items={[
          { label: 'الرئيسية', path: '/' },
          { label: 'البودكاست', path: '/podcast' },
          { label: podcast.title }
        ]}
        onNavigate={onNavigate}
      />

      {/* Episode Player Card */}
      <div className="p-6 sm:p-10 bg-white border border-[#E7E2D8] rounded-3xl shadow-md mb-12">
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden bg-stone-100 shrink-0 shadow-md">
            <img
              src={podcast.cover_image}
              alt={podcast.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 text-center sm:text-right">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-[#36533D] font-bold mb-2">
              <Headphones className="w-3.5 h-3.5" />
              <span>الحلقة رقم {podcast.episode_number}</span>
              <span>•</span>
              <span className="text-stone-400 font-normal">المدة {podcast.duration}</span>
            </div>

            <h1 className="font-heading font-black text-xl sm:text-2xl md:text-3xl text-stone-900 mb-3 leading-snug">
              {podcast.title}
            </h1>

            <p className="text-xs sm:text-sm text-stone-500 leading-relaxed max-w-xl">
              {podcast.description}
            </p>
          </div>
        </div>

        {/* Real HTML5 Audio Player */}
        <div className="p-4 bg-[#FAF7F2] border border-[#E7E2D8] rounded-2xl">
          <audio controls className="w-full" src={podcast.audio_url}>
            متصفحك لا يدعم مشغل الصوتيات.
          </audio>
        </div>

        {/* Share and Info */}
        <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between flex-wrap gap-4">
          <span className="text-xs text-stone-400">منصة لسه في نور الصوتية</span>
          <ShareButtons title={podcast.title} />
        </div>
      </div>

      {/* Other Episodes */}
      {otherEpisodes.length > 0 && (
        <section className="pt-8 border-t border-[#E7E2D8]">
          <h3 className="font-heading font-bold text-xl text-stone-900 mb-6">حلقات أخرى من البودكاست</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {otherEpisodes.map((ep) => (
              <PodcastCard key={ep.id} podcast={ep} onNavigate={onNavigate} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
