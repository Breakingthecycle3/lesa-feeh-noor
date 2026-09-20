import React, { useState, useEffect } from 'react';
import { Headphones, Sparkles, Play, Pause } from 'lucide-react';
import { Podcast } from '../types';
import { api } from '../lib/api';
import { PodcastCard } from '../components/Cards';
import { Breadcrumbs, LoadingState, SEOHead } from '../components/Common';

export function PodcastPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPodcasts()
      .then((res) => setPodcasts(res.podcasts || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 text-right" dir="rtl">
      <SEOHead
        title="بودكاست لسه في نور"
        description="جلسات صوتية دافئة وحوارات ملهمة ترافقكِ في طريقك نحو الوعي والسكينة النفسية."
      />

      <Breadcrumbs
        items={[
          { label: 'الرئيسية', path: '/' },
          { label: 'البودكاست' }
        ]}
        onNavigate={onNavigate}
      />

      {/* Header */}
      <div className="max-w-3xl mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#36533D]/10 text-[#36533D] font-bold text-xs mb-3">
          <Headphones className="w-3.5 h-3.5" />
          <span>جلسات صوتية دافئة</span>
        </div>
        <h1 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-stone-900 mb-3">
          بودكاست لسه في نور
        </h1>
        <p className="font-body text-sm sm:text-base text-stone-600 leading-relaxed">
          استمعي إلينا وأنتِ في طريقك، في لحظات راحتكِ، أو قبل نومك. صوت هادئ يمنحكِ الأمل ويضيء لكِ زوايا التفكير.
        </p>
      </div>

      {/* Grid */}
      {loading ? (
        <LoadingState message="نستحضر حلقات البودكاست..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {podcasts.map((pod) => (
            <PodcastCard key={pod.id} podcast={pod} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}
