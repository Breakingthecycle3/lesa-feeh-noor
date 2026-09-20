import React from 'react';
import { Sparkles, Heart, Shield, Compass, Sun, Users, ArrowLeft } from 'lucide-react';
import { Breadcrumbs, SEOHead } from '../components/Common';

export function AboutPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16 text-right" dir="rtl">
      <SEOHead
        title="من نحن | حكاية لسه في نور"
        description="تعرفي على رسالة منصة لسه في نور وفريق العمل ورؤيتنا لمرافقة القلوب نحو التعافي والسلام."
      />

      <Breadcrumbs
        items={[
          { label: 'الرئيسية', path: '/' },
          { label: 'من نحن' }
        ]}
        onNavigate={onNavigate}
      />

      {/* Hero Banner */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="w-12 h-12 rounded-2xl bg-[#36533D]/10 text-[#36533D] flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-6 h-6 text-amber-500" />
        </div>
        <h1 className="font-heading font-black text-3xl sm:text-4xl text-stone-900 mb-4 leading-tight">
          مهما كان اللي عديت بيه... لسه في نور
        </h1>
        <p className="font-body text-base text-stone-600 leading-relaxed">
          لسه في نور ليست مجرد منصة محتوى؛ إنها مساحة مأمونة، ملاذ هادئ، ورفيق صادق لكل روح تبحث عن طريقها بعد خيبة أو صدمة أو علاقة استنزفت طاقتها.
        </p>
      </div>

      {/* Story & Philosophy */}
      <div className="space-y-12 mb-16">
        <div className="p-8 md:p-10 bg-white border border-[#E7E2D8] rounded-3xl space-y-4 shadow-sm">
          <h2 className="font-heading font-bold text-xl text-stone-900 flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-500" />
            <span>لماذا بدأنا؟</span>
          </h2>
          <p className="text-stone-700 leading-relaxed text-sm sm:text-base font-body">
            بدأت فكرة "لسه في نور" من ملاحظة بسيطة ومؤلمة: في عالمنا العربي، الكثيرون يعانون في صمت داخل علاقات منهكة أو بعد انفصال مؤلم، ويجدون صعوبة في العثور على محتوى نفسي يجمع بين الدفء الإنساني والرصانة العلمية، دون تنظير جاف أو لوم للضحية.
          </p>
          <p className="text-stone-700 leading-relaxed text-sm sm:text-base font-body">
            أردنا أن نصنع مساحة تتحدث بلسانكِ، تفهم أوجاعكِ الدفينة، وتخبركِ دائماً: <span className="font-bold text-[#36533D]">أنتِ لستِ مجنونة، وأنتِ لستِ وحدكِ، وما مررتِ به كان حقيقياً، لكن الأمل بالشفاء حقيقي أيضاً.</span>
          </p>
        </div>

        {/* Our 4 Core Pillars */}
        <div>
          <h2 className="font-heading font-bold text-2xl text-stone-900 mb-6 text-center">
            قيمنا ومبادئنا التحريرية
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 bg-white border border-[#E7E2D8] rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold mb-3">
                <Heart className="w-5 h-5 text-rose-500" />
              </div>
              <h3 className="font-heading font-bold text-base text-stone-900 mb-2">الرفق والتعاطف غير المشروط</h3>
              <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
                لا نلوم من تأذى ولا نستعجل شفاء أحد. كل مرحلة من حزنكِ لها احترامها وحقها الكامل في الوجود.
              </p>
            </div>

            <div className="p-6 bg-white border border-[#E7E2D8] rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center font-bold mb-3">
                <Compass className="w-5 h-5 text-[#36533D]" />
              </div>
              <h3 className="font-heading font-bold text-base text-stone-900 mb-2">الرصانة والوعي النفسي</h3>
              <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
                مفاهيم التعافي لدينا مستندة إلى مبادئ علم النفس الإكلينيكي والعلاج المعرفي السلوكي ونظريات التعلق والتروما، مُصاغة بلغة عربية مبسطة.
              </p>
            </div>

            <div className="p-6 bg-white border border-[#E7E2D8] rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold mb-3">
                <Shield className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-heading font-bold text-base text-stone-900 mb-2">السرية والأمان المطلق</h3>
              <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
                مساحتكِ في "احكي لنا" محمية بالكامل؛ لا نشارك معلوماتكِ ولا نسأل عن هويتك. مساحتكِ مقدسة.
              </p>
            </div>

            <div className="p-6 bg-white border border-[#E7E2D8] rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center font-bold mb-3">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-heading font-bold text-base text-stone-900 mb-2">الأمل الواقعي القابل للتطبيق</h3>
              <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
                لا نبيع إيجابية سامة أو وعوداً وردية ساذجة، بل نقدم أدوات عملية حقيقية للتعامل مع الألم خطوة بخطوة.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Box */}
      <div className="p-8 bg-[#FAF7F2] border border-[#E7E2D8] rounded-3xl text-center">
        <h3 className="font-heading font-bold text-lg sm:text-xl text-stone-900 mb-2">
          هل تودين أن تبدأي رحلتكِ معنا الآن؟
        </h3>
        <p className="text-xs sm:text-sm text-stone-600 mb-6 max-w-md mx-auto leading-relaxed">
          تصفحي رحلات التعافي الممنهجة أو اقرأي رسائل النور اليومية لتستعيدي سكينتك.
        </p>
        <button
          onClick={() => onNavigate('/journeys')}
          className="px-6 py-3 bg-[#36533D] hover:bg-[#2A4230] text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center gap-2 mx-auto cursor-pointer"
        >
          <span>ابدأي رحلة التعافي</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
