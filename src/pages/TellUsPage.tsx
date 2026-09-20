import React, { useState, useEffect } from 'react';
import {
  MessageSquareHeart,
  ShieldCheck,
  Lock,
  Send,
  Sparkles,
  Heart,
  CheckCircle2
} from 'lucide-react';
import { Submission } from '../types';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { Breadcrumbs, SEOHead } from '../components/Common';

export function TellUsPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { showToast } = useToast();
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('فضفضة عامة');
  const [ageRange, setAgeRange] = useState('25-34');
  const [consent, setConsent] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Published community submissions
  const [communityStories, setCommunityStories] = useState<Submission[]>([]);

  useEffect(() => {
    api.getPublishedSubmissions()
      .then((res) => setCommunityStories(res.submissions || []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    try {
      const res = await api.submitStory({
        message,
        category,
        age_range: ageRange,
        consent
      });
      setSubmitted(true);
      setMessage('');
      showToast(res.message, 'success');
    } catch (err: any) {
      showToast(err.message || 'فشل إرسال الفضفضة', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 text-right" dir="rtl">
      <SEOHead
        title="احكي لنا | مساحة آمنة للفضفضة وسماع صوتك"
        description="مساحة سرية ومحمية تماماً لتكتبي ما يثقل قلبكِ دون اسم أو حكم مسبق."
      />

      <Breadcrumbs
        items={[
          { label: 'الرئيسية', path: '/' },
          { label: 'احكي لنا' }
        ]}
        onNavigate={onNavigate}
      />

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <MessageSquareHeart className="w-6 h-6" />
        </div>
        <h1 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-stone-900 mb-3">
          احكي لنا.. قلبكِ في أمان
        </h1>
        <p className="font-body text-sm sm:text-base text-stone-600 leading-relaxed">
          أحياناً مجرد إخراج الكلمات من صدركِ ووضعها على الورق هو أول خطوة حقيقية نحو التعافي. هنا لا أحد يحكم عليكِ، ولا أحد يعرف هويتك.
        </p>
      </div>

      {/* Confidentiality Pledge Card */}
      <div className="p-5 bg-white border border-[#E7E2D8] rounded-2xl mb-8 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-xs sm:text-sm text-stone-900 mb-1">
            ميثاق السرية التامة والأمان
          </h4>
          <p className="text-xs text-stone-500 leading-relaxed">
            لا نطلب اسمكِ، لا نطلب بريدكِ، ولا نسجل أي معلومات تكشف عن هويتك. ما تكتبينه هنا يقرأه فريق الإشراف النفسي بكل أمانة ورعاية.
          </p>
        </div>
      </div>

      {/* Submission Box */}
      <div className="bg-white border border-[#E7E2D8] rounded-3xl p-6 sm:p-10 shadow-sm mb-16">
        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-heading font-bold text-xl text-stone-900">
              وصلتنا كلماتكِ بكل حب وتقدير 🤍
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
              شكراً لشجاعتكِ في البوح. نحن فخورون بكِ، ونتمنى لقلبكِ خفة وسلاماً ونوراً يغمر كل زاوية.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="px-5 py-2.5 bg-[#36533D] text-white text-xs font-bold rounded-xl hover:bg-[#2A4230] transition-colors cursor-pointer"
            >
              كتابة فضفضة أخرى
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-2">
                ما الذي تودين البوح به اليوم؟
              </label>
              <textarea
                required
                rows={7}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="اكتبي بحرية تامة.. احكي عن وجعك، مخاوفك، تجربتك مع علاقة مرهقة، أو ما يمنعكِ من النوم..."
                className="w-full p-4 bg-[#FAF7F2] border border-[#E7E2D8] rounded-2xl text-xs sm:text-sm text-stone-800 leading-relaxed focus:outline-none focus:border-[#36533D]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  طبيعة الموضوع أو التجربة:
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs font-medium text-stone-800 focus:outline-none"
                >
                  <option value="علاقات مؤذية">علاقات مؤذية وتلاعب نفسي</option>
                  <option value="انفصال وطلاق">انفصال / طلاق وبداية جديدة</option>
                  <option value="حدود شخصية">صعوبة في رسم الحدود وقول (لا)</option>
                  <option value="فقد وخيبة أمل">فقدان وخيبة أمل</option>
                  <option value="قلق واحتراق نفسي">قلق وتوتر واحتراق نفسي</option>
                  <option value="فضفضة عامة">فضفضة عامة من القلب</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  الفئة العمرية التقريبية (اختياري لمساعدتنا في فهم السياق):
                </label>
                <select
                  value={ageRange}
                  onChange={(e) => setAgeRange(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs font-medium text-stone-800 focus:outline-none"
                >
                  <option value="أقل من 20">أقل من 20 سنة</option>
                  <option value="20-24">20 - 24 سنة</option>
                  <option value="25-34">25 - 34 سنة</option>
                  <option value="35-44">35 - 44 سنة</option>
                  <option value="45 فما فوق">45 سنة فما فوق</option>
                </select>
              </div>
            </div>

            {/* Consent check */}
            <label className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 rounded text-[#36533D] focus:ring-[#36533D]"
              />
              <span className="text-xs text-stone-600 leading-relaxed select-none">
                أوافق على إمكانية نشر هذه الكلمات في المنصة <span className="font-bold text-stone-800">(دون أي اسم أو بيانات شخصية إطلاقاً)</span> لتكون بمثابة طمأنينة وأمل لأرواح أخرى تمر بنفس التجربة.
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#36533D] hover:bg-[#2A4230] text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {submitting ? 'جارٍ الإرسال بأمان...' : 'إرسال الفضفضة بأمان'}
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

      {/* Community Shared Stories */}
      {communityStories.length > 0 && (
        <section className="pt-8 border-t border-[#E7E2D8]">
          <div className="flex items-center gap-2 mb-6">
            <Heart className="w-5 h-5 text-rose-500" />
            <h3 className="font-heading font-bold text-xl text-stone-900">
              أصوات منكن.. لستِ وحدكِ في هذا الطريق
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {communityStories.map((story) => (
              <div key={story.id} className="p-6 bg-white border border-[#E7E2D8] rounded-2xl relative">
                <div className="flex items-center justify-between mb-3 text-xs text-stone-400">
                  <span className="px-2.5 py-0.5 bg-[#FAF7F2] rounded text-[#36533D] font-bold">
                    {story.category || 'فضفضة سرية'}
                  </span>
                  <span>{story.created_at?.slice(0, 10)}</span>
                </div>
                <p className="font-body text-xs sm:text-sm text-stone-700 leading-relaxed italic">
                  "{story.message}"
                </p>
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                  <span>من إحدى صديقات المنصة</span>
                  <span>🤍 لسه في نور</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
