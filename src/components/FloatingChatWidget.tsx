import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import {
  Sparkles,
  MessageCircle,
  X,
  Send,
  Maximize2,
  Minimize2,
  Trash2,
  Heart,
  Zap,
  Brain,
  ShieldCheck
} from 'lucide-react';
import { api } from '../lib/api';
import { ChatRole, ChatRoleId, ChatMessage } from '../types';

export function FloatingChatWidget({
  onNavigate,
  currentPath
}: {
  onNavigate: (path: string) => void;
  currentPath: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<ChatRoleId>('general');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load chat messages from localStorage
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('lesanour_chat_histories_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed['general'] || [];
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Do not show widget on full /chat page or /admin page
  if (currentPath === '/chat' || currentPath.startsWith('/admin')) {
    return null;
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages.length, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `float_user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      roleId: activeRole
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputMessage('');
    setIsLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await api.sendChatMessage({
        message: text,
        history: historyPayload,
        roleId: activeRole
      });

      const botMessage: ChatMessage = {
        id: `float_bot_${Date.now()}`,
        role: 'model',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        modelUsed: res.modelUsed,
        roleId: activeRole
      };

      const updatedHistory = [...newHistory, botMessage];
      setMessages(updatedHistory);

      // Also persist to localStorage
      try {
        const saved = localStorage.getItem('lesanour_chat_histories_v1');
        const parsed = saved ? JSON.parse(saved) : {};
        parsed[activeRole] = updatedHistory;
        localStorage.setItem('lesanour_chat_histories_v1', JSON.stringify(parsed));
      } catch (e) {
        console.error(e);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const errMessage: ChatMessage = {
        id: `float_err_${Date.now()}`,
        role: 'model',
        content: 'تعذر الاتصال مؤقتاً، يرجى المحاولة بعد قليل.',
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        roleId: activeRole
      };
      setMessages((prev) => [...prev, errMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const roleName =
    activeRole === 'general'
      ? 'رفيق النور (دعم عام)'
      : activeRole === 'fast'
      ? 'نبض سريع (تهدئة)'
      : 'تحليلي (علاقات)';

  const modelName =
    activeRole === 'general'
      ? 'gemini-3.5-flash'
      : activeRole === 'fast'
      ? 'gemini-3.1-flash-lite'
      : 'gemini-3.1-pro-preview';

  return (
    <div className="fixed bottom-5 left-5 z-50 font-['Tajawal',sans-serif]" dir="rtl">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-[92vw] sm:w-[380px] h-[520px] bg-white rounded-3xl border border-[#E7E2D8] shadow-2xl flex flex-col overflow-hidden mb-3"
          >
            {/* Header */}
            <div className="bg-[#36533D] text-white p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-amber-200">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-1.5">
                    <span>{roleName}</span>
                    <span className="text-[10px] font-mono bg-white/20 px-1.5 py-0.2 rounded text-amber-200">
                      AI
                    </span>
                  </h3>
                  <span className="text-[10px] text-stone-200 block">
                    محادثة آمنة لحفظ التوازن والسكينة
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Expand to full page */}
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate('/chat');
                  }}
                  className="p-1.5 text-stone-200 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  title="فتح الصفحة الكاملة"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                {/* Close */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-stone-200 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  title="إغلاق النافذة"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Role Switcher Pills */}
            <div className="flex items-center gap-1 p-2 bg-[#FAF7F2] border-b border-[#E7E2D8] text-[11px]">
              <button
                type="button"
                onClick={() => setActiveRole('general')}
                className={`flex-1 py-1 px-1.5 rounded-lg font-medium transition-all ${
                  activeRole === 'general'
                    ? 'bg-[#36533D] text-white shadow-xs'
                    : 'bg-white text-stone-700 hover:bg-stone-100'
                }`}
              >
                رفيق عام
              </button>
              <button
                type="button"
                onClick={() => setActiveRole('fast')}
                className={`flex-1 py-1 px-1.5 rounded-lg font-medium transition-all ${
                  activeRole === 'fast'
                    ? 'bg-[#36533D] text-white shadow-xs'
                    : 'bg-white text-stone-700 hover:bg-stone-100'
                }`}
              >
                تهدئة سريعة
              </button>
              <button
                type="button"
                onClick={() => setActiveRole('complex')}
                className={`flex-1 py-1 px-1.5 rounded-lg font-medium transition-all ${
                  activeRole === 'complex'
                    ? 'bg-[#36533D] text-white shadow-xs'
                    : 'bg-white text-stone-700 hover:bg-stone-100'
                }`}
              >
                تحليل عميق
              </button>
            </div>

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#FCFAF7]">
              {messages.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#36533D]/10 text-[#36533D] flex items-center justify-center mx-auto mb-3">
                    <Heart className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-stone-800">
                    أهلاً بك في مساحتك الآمنة
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
                    تحدث بحرية.. رفيق النور مدعوم بـ Gemini لتقديم الاستماع الدافئ، التهدئة الفورية، والتحليل النفسي.
                  </p>
                  <div className="mt-3 flex flex-col gap-1.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleSendMessage('أشعر بالضيق اليوم ولا أعرف كيف أهدأ..')}
                      className="text-[11px] p-2 bg-white hover:bg-stone-100 rounded-xl border border-[#E7E2D8] text-stone-700 transition-all text-right"
                    >
                      💬 أشعر بالضيق اليوم ولا أعرف كيف أهدأ..
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendMessage('تمرين تنفس سريع للتهدئة الفورية')}
                      className="text-[11px] p-2 bg-white hover:bg-stone-100 rounded-xl border border-[#E7E2D8] text-stone-700 transition-all text-right"
                    >
                      ⚡ تمرين تنفس سريع للتهدئة الفورية
                    </button>
                  </div>
                </div>
              ) : (
                messages.map((m) => {
                  const isUser = m.role === 'user';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[88%] p-3 rounded-2xl text-xs leading-relaxed ${
                          isUser
                            ? 'bg-[#36533D] text-white rounded-tr-none'
                            : 'bg-white text-stone-800 border border-[#E7E2D8] rounded-tl-none shadow-xs'
                        }`}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{m.content}</p>
                        ) : (
                          <div className="markdown-body prose prose-stone prose-xs max-w-none">
                            <Markdown>{m.content}</Markdown>
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] text-stone-400 mt-0.5 px-1">
                        {m.timestamp}
                      </span>
                    </div>
                  );
                })
              )}

              {isLoading && (
                <div className="flex items-center gap-2 p-2.5 bg-white border border-[#E7E2D8] rounded-2xl rounded-tl-none text-[11px] text-stone-500 w-fit">
                  <Sparkles className="w-3.5 h-3.5 text-[#36533D] animate-spin" />
                  <span>رفيق النور يفكر ويكتب...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-2.5 bg-white border-t border-[#E7E2D8] flex items-center gap-1.5"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="اكتب رسالتك لرفيق النور..."
                disabled={isLoading}
                className="flex-1 px-3 py-2 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs focus:outline-none focus:border-[#36533D]"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="w-8 h-8 rounded-xl bg-[#36533D] text-white flex items-center justify-center shrink-0 disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5 -rotate-90" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Launcher Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 bg-[#36533D] hover:bg-[#2a4230] text-white px-4 py-3 rounded-full shadow-lg shadow-[#36533D]/30 border border-white/20 transition-all cursor-pointer group"
      >
        <div className="relative">
          <Sparkles className="w-5 h-5 text-amber-200 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        </div>
        <div className="text-right">
          <span className="block text-xs font-bold leading-tight">
            {isOpen ? 'إغلاق المحادثة' : 'رفيق النور'}
          </span>
          <span className="text-[10px] text-amber-200/90 leading-none">
            Gemini AI
          </span>
        </div>
      </motion.button>
    </div>
  );
}
