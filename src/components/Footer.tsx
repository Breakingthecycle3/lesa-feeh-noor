import React, { useState } from 'react';
import { Sparkles, Mail, Send, Heart, ArrowUp } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export function Footer({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { isAdmin, isEditor } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      const res = await api.subscribeNewsletter(email);
      showToast(res.message, 'success');
      setEmail('');
    } catch (err: any) {
      showToast(err.message || 'فشل الاشتراك في النشرة', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#F6F1EA] border-t border-[#E7E2D8] text-stone-700 pt-16 pb-12" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-[#E7E2D8]">
          {/* Brand & Purpose */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#36533D] text-white flex items-center justify-center shadow">
                <Sparkles className="w-5 h-5 text-amber-200" />
              </div>
              <span className="font-heading font-bold text-xl text-stone-900">لسه في نور</span>
            </div>
            <p className="text-xs md:text-sm text-stone-600 leading-relaxed font-body">
              منصة عربية رائدة للدعم النفسي، الوعي بالعلاقات، وتجاوز الصدمات. نؤمن بأن كل تجربة مؤلمة يمكن أن تكون بداية لربيع داخلي أكثر نضجاً وسلاماً.
            </p>
            <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E7E2D8] text-xs text-[#36533D] font-bold">
              "مهما كان اللي عديت بيه... لسه في نور."
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-bold text-stone-900 text-sm mb-4">أقسام المنصة</h4>
            <ul className="space-y-2.5 text-xs text-stone-600">
              <li>
                <button onClick={() => onNavigate('/articles')} className="hover:text-[#36533D] transition-colors cursor-pointer">
                  الموضوعات والمقالات
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/journeys')} className="hover:text-[#36533D] transition-colors cursor-pointer">
                  رحلات التعافي المتدرجة
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/videos')} className="hover:text-[#36533D] transition-colors cursor-pointer">
                  مكتبة الفيديوهات الإرشادية
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/messages')} className="hover:text-[#36533D] transition-colors cursor-pointer">
                  رسائل لسه في نور
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/podcast')} className="hover:text-[#36533D] transition-colors cursor-pointer">
                  بودكاست لسه في نور
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/tell-us')} className="hover:text-[#36533D] transition-colors cursor-pointer">
                  احكي لنا (مساحة فضفضة سرية)
                </button>
              </li>
              {(isAdmin || isEditor) && (
                <li>
                  <button onClick={() => onNavigate('/admin')} className="text-[#36533D] font-bold hover:underline transition-colors cursor-pointer flex items-center gap-1">
                    <span>لوحة التحكم والإدارة</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-heading font-bold text-stone-900 text-sm mb-4">تصنيفات رئيسية</h4>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                { name: 'التعافي', slug: 'healing' },
                { name: 'الوعي النفسي', slug: 'mental-awareness' },
                { name: 'العلاقات المؤذية', slug: 'toxic-relationships' },
                { name: 'الحدود الشخصية', slug: 'personal-boundaries' },
                { name: 'الثقة بالنفس', slug: 'self-esteem' },
                { name: 'السلام الداخلي', slug: 'inner-peace' },
                { name: 'الزواج', slug: 'marriage' },
                { name: 'الإيمان والأمل', slug: 'faith-hope' }
              ].map((c) => (
                <button
                  key={c.slug}
                  onClick={() => onNavigate(`/categories/${c.slug}`)}
                  className="px-2.5 py-1 bg-[#FAF7F2] hover:bg-[#36533D] hover:text-white rounded-lg border border-[#E7E2D8] text-stone-600 transition-colors cursor-pointer"
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-heading font-bold text-stone-900 text-sm mb-2">رسالة الأمل الأسبوعية</h4>
            <p className="text-xs text-stone-500 leading-relaxed mb-4">
              اشتركي لتصلكِ رسالة دافئة ومقال ملهم كل يوم جمعة في بريدك الإلكتروني.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="بريدك الإلكتروني"
                  className="w-full pl-3 pr-9 py-2.5 bg-white border border-[#E7E2D8] rounded-xl text-xs focus:outline-none focus:border-[#36533D] transition-colors"
                />
                <Mail className="w-4 h-4 text-stone-400 absolute right-3 top-3" />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-[#36533D] hover:bg-[#2A4230] text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-60"
              >
                {submitting ? 'جارٍ التسجيل...' : 'انضمي للنشرة'}
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-1">
            <span>صُنعت بكل محبة وإخلاص لدعم كل قلب يبحث عن النور</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('/about')} className="hover:text-stone-900 transition-colors cursor-pointer">
              عن المنصة
            </button>
            <button onClick={() => onNavigate('/contact')} className="hover:text-stone-900 transition-colors cursor-pointer">
              تواصل معنا
            </button>
            <button onClick={() => onNavigate('/tell-us')} className="hover:text-stone-900 transition-colors cursor-pointer">
              ميثاق السرية
            </button>
            {(isAdmin || isEditor) && (
              <button onClick={() => onNavigate('/admin')} className="text-[#36533D] font-bold hover:underline transition-colors cursor-pointer">
                لوحة التحكم
              </button>
            )}
            <button
              onClick={scrollToTop}
              className="p-2 rounded-xl bg-white border border-[#E7E2D8] text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors cursor-pointer flex items-center gap-1"
              title="العودة للأعلى"
            >
              <span>للأعلى</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
