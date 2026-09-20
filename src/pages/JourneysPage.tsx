import React, { useState, useEffect } from 'react';
import { Compass, Sparkles, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Journey } from '../types';
import { api } from '../lib/api';
import { JourneyCard } from '../components/Cards';
import { Breadcrumbs, LoadingState, SEOHead } from '../components/Common';
import { MindfulnessTimer } from '../components/MindfulnessTimer';

export function JourneysPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getJourneys()
      .then((res) => setJourneys(res.journeys || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 text-right" dir="rtl">
      <SEOHead
        title="رحلات التعافي الإرشادية"
        description="مسارات متكاملة بالخطوات العملية تأخذ بيدك من عمق الألم والارتباك إلى وضوح الرؤية والسلام الداخلي."
      />

      <Breadcrumbs
        items={[
          { label: 'الرئيسية', path: '/' },
          { label: 'رحلات التعافي' }
        ]}
        onNavigate={onNavigate}
      />

      {/* Header */}
      <div className="max-w-3xl mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#36533D]/10 text-[#36533D] font-bold text-xs mb-3">
          <Compass className="w-3.5 h-3.5" />
          <span>مسارات ممنهجة بالخطوات</span>
        </div>
        <h1 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-stone-900 mb-3">
          رحلات التعافي المتكاملة
        </h1>
        <p className="font-body text-sm sm:text-base text-stone-600 leading-relaxed">
          لأن التعافي ليس خطوة واحدة بل مسار مستمر، صممنا لكِ هذه الرحلات لتنتقلي فيها بين المحطات خطوة بخطوة بكل لطف ودون استعجال.
        </p>
      </div>

      {/* Mindfulness Tool Section */}
      <div className="mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4">
            <MindfulnessTimer />
          </div>
          <div className="lg:col-span-8 bg-[#36533D]/5 rounded-3xl p-6 sm:p-8 border border-[#36533D]/10">
            <h2 className="font-heading font-bold text-xl text-[#36533D] mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              كيف تبدأين رحلتكِ؟
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#36533D] text-white flex items-center justify-center shrink-0 font-bold text-sm">١</div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm mb-1">هدئي عقلكِ أولاً</h3>
                  <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">استخدمي مؤقت التأمل بالأعلى لمدة ٣ دقائق لتصفية ذهنكِ قبل اختيار المسار المناسب لكِ.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#36533D] text-white flex items-center justify-center shrink-0 font-bold text-sm">٢</div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm mb-1">اختاري الرحلة الأقرب لحالكِ</h3>
                  <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">كل مسار مصمم بعناية ليناسب مرحلة معينة من الألم أو البحث عن الذات.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#36533D] text-white flex items-center justify-center shrink-0 font-bold text-sm">٣</div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm mb-1">التزمي بخطوة واحدة يومياً</h3>
                  <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">لا تستعجلي النتائج، فالنور يظهر تدريجياً مع كل خطوة وعي جديدة.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <LoadingState message="نجهز لكِ مسارات التعافي..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {journeys.map((jrn) => (
            <JourneyCard key={jrn.id} journey={jrn} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}
