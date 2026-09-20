import React, { useState } from 'react';
import { Mail, MessageSquare, Send, CheckCircle2, HelpCircle } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { Breadcrumbs, SEOHead } from '../components/Common';

export function ContactPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.sendContact({ name, email, subject, message });
      setSent(true);
      showToast(res.message, 'success');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      showToast(err.message || 'فشل إرسال الرسالة', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16 text-right" dir="rtl">
      <SEOHead
        title="اتصل بنا | تواصل مع فريق لسه في نور"
        description="نسعد بتواصلكِ معنا، سواء لمقترحات المحتوى، الشراكات، أو الاستفسارات العامة."
      />

      <Breadcrumbs
        items={[
          { label: 'الرئيسية', path: '/' },
          { label: 'اتصل بنا' }
        ]}
        onNavigate={onNavigate}
      />

      {/* Header */}
      <div className="max-w-2xl mb-12">
        <h1 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-stone-900 mb-3">
          يسعدنا تواصلكِ دائماً
        </h1>
        <p className="font-body text-sm sm:text-base text-stone-600 leading-relaxed">
          لديكِ اقتراح لموضوع جديد؟ ترغبين في الانضمام لفريق الكتابة؟ أو لديكِ استفسار عام؟ نحن هنا لنسمعك بكل ترحاب.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Form */}
        <div className="lg:col-span-7 bg-white border border-[#E7E2D8] rounded-3xl p-6 sm:p-8 shadow-sm">
          {sent ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-lg text-stone-900">
                وصلتنا رسالتكِ بنجاح!
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                سيتواصل معكِ أحد أعضاء الفريق عبر البريد الإلكتروني في أقرب فرصة.
              </p>
              <button
                onClick={() => setSent(false)}
                className="px-4 py-2 bg-[#36533D] text-white text-xs font-bold rounded-xl hover:bg-[#2A4230] transition-colors cursor-pointer"
              >
                إرسال رسالة أخرى
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">الاسم الكريم</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="اسمكِ الكريم"
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs focus:outline-none focus:border-[#36533D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">البريد الإلكتروني</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="بريدكِ للرد عليكِ"
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs focus:outline-none focus:border-[#36533D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">عنوان الرسالة</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="عن ماذا تودين الحديث؟"
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs focus:outline-none focus:border-[#36533D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">نص الرسالة</label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="اكتبي رسالتكِ بالتفصيل..."
                  className="w-full p-3.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs leading-relaxed focus:outline-none focus:border-[#36533D]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-[#36533D] hover:bg-[#2A4230] text-white font-bold rounded-xl text-xs shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {submitting ? 'جارٍ الإرسال...' : 'إرسال الرسالة'}
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>

        {/* Sidebar info */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 bg-[#FAF7F2] border border-[#E7E2D8] rounded-3xl">
            <h3 className="font-heading font-bold text-base text-stone-900 mb-3 flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#36533D]" />
              <span>معلومات التواصل</span>
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed mb-4">
              يمكنكِ أيضاً مراسلتنا مباشرة عبر البريد الإلكتروني الرسمي للمنصة:
            </p>
            <div className="p-3 bg-white rounded-xl border border-[#E7E2D8] text-xs font-mono text-stone-800 text-left" dir="ltr">
              contact@lesanour.com
            </div>
          </div>

          <div className="p-6 bg-white border border-[#E7E2D8] rounded-3xl space-y-4">
            <h3 className="font-heading font-bold text-sm text-stone-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-500" />
              <span>تنويه هام بشأن الطوارئ</span>
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              منصة "لسه في نور" هي منصة توعوية وتثقيفية ونفسية مساندة، ولا تقدم خدمات التدخل في الأزمات النفسية الحادة أو الطوارئ الطبية الفورية. في حال شعوركِ بالخطر على سلامتكِ، يرجى التوجه فوراً لأقرب مركز طبي أو الاتصال بالخطوط الساخنة الوطنية للدعم النفسي في بلدكِ.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
