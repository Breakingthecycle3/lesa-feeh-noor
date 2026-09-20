import React, { useState, useEffect } from 'react';
import { Sparkles, Quote, Shuffle, Shield } from 'lucide-react';
import { Message, Category } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { MessageCard } from '../components/Cards';
import { Breadcrumbs, Pagination, LoadingState, EmptyState, SEOHead } from '../components/Common';

export function MessagesPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { user, isAdmin, isEditor } = useAuth();
  const isAdminUser = Boolean(
    isAdmin ||
    user?.role === 'ADMIN' ||
    isEditor ||
    user?.email === 'fatmamohamed36699@gmail.com'
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCategories().then((res) => setCategories(res.categories || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    api.getMessages({
      category: selectedCategory || undefined,
      page,
      limit: 9
    })
      .then((res) => {
        setMessages(res.messages || []);
        setTotalPages(res.pagination?.totalPages || 1);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedCategory, page]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 text-right" dir="rtl">
      <SEOHead
        title="رسائل لسه في نور"
        description="كلمات دافئة وملهمة تمنحكِ الأمل والسكينة في لحظات التعب والحيرة."
      />

      <Breadcrumbs
        items={[
          { label: 'الرئيسية', path: '/' },
          { label: 'رسائل لسه في نور' }
        ]}
        onNavigate={onNavigate}
      />

      {/* 🛡️ Admin Message Management Bar */}
      {isAdminUser && (
        <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-emerald-50/50 border border-amber-300 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 text-xs text-stone-800">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span className="font-bold text-stone-900">صلاحيات إدارة الرسائل مفعلة (فاطمة محمد):</span>
            <span className="text-stone-600 hidden sm:inline">
              يمكنكِ النقر على زر «تعديل» على أي رسالة، أو فتح أي رسالة لتعديل نصها وخلفيتها مباشرة من داخل الصفحة.
            </span>
          </div>
          <button
            onClick={() => onNavigate('/admin')}
            className="px-3.5 py-1.5 bg-[#36533D] hover:bg-[#2A4230] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
          >
            <Shield className="w-3.5 h-3.5 text-amber-300" />
            <span>لوحة التحكم الرئيسية</span>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="max-w-3xl mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#36533D]/10 text-[#36533D] font-bold text-xs mb-3">
          <Quote className="w-3.5 h-3.5" />
          <span>همسات وسكينة</span>
        </div>
        <h1 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-stone-900 mb-3">
          رسائل لسه في نور
        </h1>
        <p className="font-body text-sm sm:text-base text-stone-600 leading-relaxed">
          كلمات موجزة كُتبت لتذكركِ بأنكِ أقوى مما تظنين، وأن في نهاية كل نفق مظلم ينتظركِ فجر جديد.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
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
          جميع الرسائل
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

      {/* Grid */}
      {loading ? (
        <LoadingState message="نستحضر لكِ رسائل النور..." />
      ) : messages.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {messages.map((msg) => (
              <MessageCard key={msg.id} message={msg} onNavigate={onNavigate} />
            ))}
          </div>

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      ) : (
        <EmptyState
          title="لم نجد رسائل في هذا القسم حالياً"
          description="تصفحي بقية الأقسام لتجدي ما يلامس قلبكِ."
          actionLabel="عرض جميع الرسائل"
          onAction={() => setSelectedCategory('')}
        />
      )}
    </div>
  );
}
