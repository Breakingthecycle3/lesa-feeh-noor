import React, { useState } from 'react';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Eye,
  Edit3,
  Minus
} from 'lucide-react';

export function ContentEditor({
  value,
  onChange,
  placeholder = 'اكتبي أو الصقي محتوى الموضوع هنا...'
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

  const insertTag = (before: string, after: string = '') => {
    const textarea = document.getElementById('editorial-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selection = value.substring(start, end);
    const replacement = before + (selection || 'نص هنا') + after;

    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + replacement.length - after.length);
    }, 50);
  };

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="border border-[#E7E2D8] rounded-2xl overflow-hidden bg-white shadow-sm" dir="rtl">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between p-2.5 bg-[#FAF7F2] border-b border-[#E7E2D8] flex-wrap gap-2">
        <div className="flex items-center gap-1 flex-wrap">
          <button
            type="button"
            onClick={() => insertTag('<b>', '</b>')}
            className="p-1.5 hover:bg-stone-200/70 rounded-lg text-stone-700 transition-colors cursor-pointer"
            title="عريض (Bold)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertTag('<i>', '</i>')}
            className="p-1.5 hover:bg-stone-200/70 rounded-lg text-stone-700 transition-colors cursor-pointer"
            title="مائل (Italic)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <span className="w-px h-5 bg-stone-300 mx-1"></span>
          <button
            type="button"
            onClick={() => insertTag('<h2>', '</h2>\n')}
            className="p-1.5 hover:bg-stone-200/70 rounded-lg text-stone-700 transition-colors cursor-pointer"
            title="عنوان فرعي رئيسي H2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertTag('<h3>', '</h3>\n')}
            className="p-1.5 hover:bg-stone-200/70 rounded-lg text-stone-700 transition-colors cursor-pointer"
            title="عنوان فرعي ثانوي H3"
          >
            <Heading3 className="w-4 h-4" />
          </button>
          <span className="w-px h-5 bg-stone-300 mx-1"></span>
          <button
            type="button"
            onClick={() => insertTag('<blockquote>\n', '\n</blockquote>\n')}
            className="p-1.5 hover:bg-stone-200/70 rounded-lg text-stone-700 transition-colors cursor-pointer"
            title="اقتباس متميز"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertTag('<ul>\n  <li>', '</li>\n</ul>\n')}
            className="p-1.5 hover:bg-stone-200/70 rounded-lg text-stone-700 transition-colors cursor-pointer"
            title="قائمة نقطية"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertTag('<ol>\n  <li>', '</li>\n</ol>\n')}
            className="p-1.5 hover:bg-stone-200/70 rounded-lg text-stone-700 transition-colors cursor-pointer"
            title="قائمة مرقمة"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertTag('<hr className="my-6" />\n')}
            className="p-1.5 hover:bg-stone-200/70 rounded-lg text-stone-700 transition-colors cursor-pointer"
            title="فاصل أفقي"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              const url = prompt('أدخل رابط الصورة (URL):', 'https://images.unsplash.com/...');
              if (url) insertTag(`<img src="${url}" alt="وصف الصورة" class="rounded-2xl my-6 w-full object-cover" />\n`);
            }}
            className="p-1.5 hover:bg-stone-200/70 rounded-lg text-stone-700 transition-colors cursor-pointer"
            title="إدراج صورة"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              const url = prompt('أدخل الرابط (URL):', 'https://');
              if (url) insertTag(`<a href="${url}" class="text-[#36533D] underline">`, '</a>');
            }}
            className="p-1.5 hover:bg-stone-200/70 rounded-lg text-stone-700 transition-colors cursor-pointer"
            title="إدراج رابط"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-stone-200/70 p-0.5 rounded-lg text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'write' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            تحرير
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'preview' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            معاينة حية
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      {activeTab === 'write' ? (
        <textarea
          id="editorial-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={14}
          className="w-full p-4 font-body text-sm md:text-base text-stone-900 leading-relaxed focus:outline-none resize-y min-h-[300px]"
        />
      ) : (
        <div
          className="p-6 prose-editorial min-h-[300px] max-w-none text-stone-800"
          dangerouslySetInnerHTML={{ __html: value || '<p class="text-stone-400 italic">لا يوجد محتوى للمعاينة بعد...</p>' }}
        />
      )}

      {/* Bottom stats bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#FAF7F2] border-t border-[#E7E2D8] text-xs text-stone-500 font-medium">
        <div className="flex items-center gap-4">
          <span>{wordCount} كلمة</span>
          <span>•</span>
          <span>حوالي {readTime} دقائق قراءة</span>
        </div>
        <span className="text-[11px] text-stone-400">يدعم HTML كامل وتنسيقات المقالات التحريرية</span>
      </div>
    </div>
  );
}
