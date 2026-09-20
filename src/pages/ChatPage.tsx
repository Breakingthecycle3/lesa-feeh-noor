import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import {
  Sparkles,
  Send,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Heart,
  Zap,
  Brain,
  ShieldAlert,
  ArrowRight,
  Info,
  ChevronDown
} from 'lucide-react';
import { api } from '../lib/api';
import { ChatRole, ChatRoleId, ChatMessage } from '../types';
import { useToast } from '../context/ToastContext';

const DEFAULT_ROLES: ChatRole[] = [
  {
    id: 'general',
    name: 'رفيق النور الوجداني',
    badge: 'دعم عام ومواساة',
    tagline: 'مساحة آمنة للإصغاء والاحتواء والمواساة واستعادة التوازن النفسي.',
    model: 'gemini-3.5-flash',
    suggestedPrompts: [
      'أشعر بثقل غير مفهوم في قلبي اليوم ولا أعرف من أين أبدأ..',
      'كيف أتجاوز شعور الخذلان بعد انتهاء علاقة كنت أراها كل شيء؟',
      'أحتاج كلمات مواساة تُعيد لي الأمل في أن القادم أفضل..',
      'كيف أتعامل مع تأنيب الضمير المستمر وجلد الذات؟'
    ]
  },
  {
    id: 'fast',
    name: 'نبض النور السريع',
    badge: 'تهدئة وتمارين فورية',
    tagline: 'إرشادات سريعة وموجزة لخفض التوتر ونوبات القلق وتمارين تنفس فورية.',
    model: 'gemini-3.1-flash-lite',
    suggestedPrompts: [
      'أشعر بتسارع ضربات قلبي وقلق حاد الآن.. ساعدني أهدأ فوراً!',
      'تمرين تنفس سريع مدته دقيقة واحدة لخفض التوتر.',
      'أنا مشتت وعقلي لا يتوقف عن التفكير، ماذا أفعل في هذه اللحظة؟',
      'توكيد إيجابي سريع يعيد لي ثقتي بنفسي الآن.'
    ]
  },
  {
    id: 'complex',
    name: 'المستشار التحليلي المعمق',
    badge: 'تحليل علاقات معقدة',
    tagline: 'تفكيك ديناميكيات العلاقات السامة، التعلق المرضي، وروابط الصدمة وخطة تعافي مرحلية.',
    model: 'gemini-3.1-pro-preview',
    suggestedPrompts: [
      'كيف أميز بين الحب الحقيقي وبين الوقوع في رابطة صدمة (Trauma Bond)؟',
      'شريكي يمارس التجاهل واللوم المستمر ويجعلني أشكك في عقلي.. كيف أتعامل؟',
      'أعاني من نمط التعلق القلق وأخاف دائماً من الهجر.. كيف أتحرر منه؟',
      'خطة منهجية للتعافي خطوة بخطوة بعد الخروج من علاقة استنزافية.'
    ]
  }
];

const WELCOME_MESSAGES: Record<ChatRoleId, string> = {
  general: `أهلاً بك يا رفيقي.. أنا **رفيق النور الوجداني**.
هنا مساحتك الآمنة تماماً، خذ نفساً عميقاً واكتب كل ما يثقل روحك.. أنا هنا لأصغي إليك بدون أحكام، وأرافقك خطوة بخطوة نحو السلام الداخلي.

*مهما كان اللي عديت بيه... لسه في نور.*`,
  fast: `مرحباً بك.. أنا **نبض النور السريع**.
إذا كنت تشعر بضغط أو تسارع في الأفكار أو نبضات القلب، أنا جاهز لمساعدتك فوراً بتمارين سريعة وموجزة للتهدئة والتنفس. بم ترغب أن نبدأ الآن؟`,
  complex: `أهلاً بك.. أنا **المستشار التحليلي لتعافي العلاقات والوعي الذاتي**.
أنا هنا لمساعدتك في تفكيك أنماط العلاقات المعقدة، التلاعب العاطفي، التعلق، وبناء حدود صحية متينة تليق بكرامتك. كيف أستطيع مساندتك اليوم؟`
};

export function ChatPage({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const { showToast } = useToast();
  const [roles, setRoles] = useState<ChatRole[]>(DEFAULT_ROLES);
  const [selectedRoleId, setSelectedRoleId] = useState<ChatRoleId>('general');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Storage key per role to preserve multi-turn history
  const [chatHistories, setChatHistories] = useState<Record<ChatRoleId, ChatMessage[]>>(() => {
    try {
      const saved = localStorage.getItem('lesanour_chat_histories_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved chat history:', e);
    }
    return {
      general: [],
      fast: [],
      complex: []
    };
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Load roles from backend
  useEffect(() => {
    api.getChatRoles()
      .then((res) => {
        if (res?.roles && res.roles.length > 0) {
          setRoles(res.roles as ChatRole[]);
        }
      })
      .catch((err) => {
        console.warn('Using default roles due to fetch failure:', err);
      });
  }, []);

  // Save histories to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('lesanour_chat_histories_v1', JSON.stringify(chatHistories));
    } catch (e) {
      console.error('Failed to save chat history:', e);
    }
  }, [chatHistories]);

  // Current active role
  const currentRole = roles.find((r) => r.id === selectedRoleId) || roles[0] || DEFAULT_ROLES[0];
  const activeMessages = chatHistories[selectedRoleId] || [];

  // Scroll to bottom when messages change or while loading
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [activeMessages.length, isLoading, selectedRoleId]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const message = (textToSend || inputMessage).trim();
    if (!message || isLoading) return;

    const userMessageId = `msg_user_${Date.now()}`;
    const userTimestamp = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    const newUserMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: message,
      timestamp: userTimestamp,
      roleId: selectedRoleId
    };

    // Update state with user message
    const updatedMessages = [...activeMessages, newUserMessage];
    setChatHistories((prev) => ({
      ...prev,
      [selectedRoleId]: updatedMessages
    }));

    setInputMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsLoading(true);

    try {
      // Build history payload for server (only user and model turns)
      const historyPayload = activeMessages.map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await api.sendChatMessage({
        message,
        history: historyPayload,
        roleId: selectedRoleId
      });

      const botMessageId = `msg_bot_${Date.now()}`;
      const botTimestamp = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

      const newBotMessage: ChatMessage = {
        id: botMessageId,
        role: 'model',
        content: res.reply || 'عذراً، لم أتلق رداً من المساعد الذكي.',
        timestamp: botTimestamp,
        modelUsed: res.modelUsed,
        roleId: selectedRoleId
      };

      setChatHistories((prev) => ({
        ...prev,
        [selectedRoleId]: [...(prev[selectedRoleId] || []), newBotMessage]
      }));
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessageId = `msg_err_${Date.now()}`;
      const errorTimestamp = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

      const errorBotMessage: ChatMessage = {
        id: errorMessageId,
        role: 'model',
        content: `عذراً، حدث تعذر مؤقت في الاتصال مع رفيق النور: ${err?.message || 'يرجى المحاولة بعد قليل.'}\n\n*مهما كان، خذ نفساً هادئاً، ونحن هنا دائماً معك.*`,
        timestamp: errorTimestamp,
        roleId: selectedRoleId
      };

      setChatHistories((prev) => ({
        ...prev,
        [selectedRoleId]: [...(prev[selectedRoleId] || []), errorBotMessage]
      }));

      showToast('تعذر الرد مؤقتاً، يرجى التحقق من اتصال الإنترنت وإعادة المحاولة.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('هل تريد بدء محادثة جديدة ومسح سجل هذا القسم؟')) {
      setChatHistories((prev) => ({
        ...prev,
        [selectedRoleId]: []
      }));
      showToast('تم بدء محادثة جديدة في مساحة نظيفة.', 'info');
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('تم نسخ نص الرسالة إلى الحافظة.', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#FAF7F2] py-4 md:py-8 px-3 sm:px-6 lg:px-8 flex flex-col font-['Tajawal',sans-serif]" dir="rtl">
      <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col bg-white rounded-3xl border border-[#E7E2D8] shadow-sm overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-[#FAF7F2]/80 backdrop-blur-sm border-b border-[#E7E2D8] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#36533D] text-white flex items-center justify-center shadow-md shadow-[#36533D]/20">
                <Sparkles className="w-6 h-6 text-amber-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold font-heading text-stone-900">
                    رفيق النور الذكي
                  </h1>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#36533D]/10 text-[#36533D]">
                    Gemini AI
                  </span>
                </div>
                <p className="text-xs text-stone-600 mt-0.5">
                  محادثة تفاعلية متعددة الجولات للدعم النفسي، التهدئة، وتحليل العلاقات
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 mr-auto">
              <button
                type="button"
                onClick={handleClearHistory}
                disabled={activeMessages.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all disabled:opacity-40 disabled:pointer-events-none"
                title="بدء محادثة جديدة"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">محادثة جديدة</span>
              </button>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('/')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-all"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">الرئيسية</span>
                </button>
              )}
            </div>
          </div>

          {/* Role Tabs Selector */}
          <div className="mt-4 pt-3 border-t border-[#E7E2D8]/80">
            <div className="text-xs font-bold text-stone-700 mb-2 flex items-center gap-1.5">
              <span>اختر تخصص رفيقك الآن:</span>
              <span className="text-[11px] font-normal text-stone-500">(يتكيف الذكاء الاصطناعي مع كل دور بدقة)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {roles.map((role) => {
                const isActive = selectedRoleId === role.id;
                const Icon = role.id === 'general' ? Heart : role.id === 'fast' ? Zap : Brain;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRoleId(role.id)}
                    className={`flex items-start gap-2.5 p-2.5 sm:p-3 rounded-2xl text-right transition-all border ${
                      isActive
                        ? 'bg-[#36533D] text-white border-[#36533D] shadow-md shadow-[#36533D]/15 scale-[1.01]'
                        : 'bg-white text-stone-800 border-[#E7E2D8] hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center mt-0.5 ${
                        isActive ? 'bg-white/20 text-amber-200' : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-stone-900'}`}>
                          {role.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                          isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                        }`}>
                          {role.badge}
                        </span>
                        <span className={`text-[9px] font-mono opacity-80 ${isActive ? 'text-amber-100' : 'text-stone-400'}`}>
                          {role.model.replace('-preview', '')}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-stone-500 mt-2 px-1">
              ✨ {currentRole.tagline}
            </p>
          </div>
        </div>

        {/* Scrollable Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 min-h-[350px] max-h-[58vh]">
          {/* Welcome Intro Card */}
          <div className="bg-[#FAF7F2] border border-[#E7E2D8] rounded-2xl p-4 text-stone-800 text-xs sm:text-sm leading-relaxed">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#36533D] text-amber-200 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="font-bold text-[#36533D] flex items-center gap-2">
                  <span>رسالة ترحيبية من {currentRole.name}</span>
                  <span className="text-[10px] bg-stone-200/70 text-stone-700 px-1.5 py-0.5 rounded font-mono">
                    {currentRole.model}
                  </span>
                </div>
                <div className="markdown-body prose prose-stone prose-xs max-w-none">
                  <Markdown>{WELCOME_MESSAGES[selectedRoleId]}</Markdown>
                </div>
              </div>
            </div>
          </div>

          {/* Render Active Messages */}
          {activeMessages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-2.5 sm:gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold shadow-sm mt-1 ${
                    isUser
                      ? 'bg-amber-600 text-white'
                      : 'bg-[#36533D] text-amber-200'
                  }`}
                >
                  {isUser ? 'أنت' : <Sparkles className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div className={`max-w-[85%] sm:max-w-[75%] space-y-1 ${isUser ? 'items-end text-right' : 'items-start text-right'}`}>
                  <div className="flex items-center gap-2 px-1 text-[11px] text-stone-500">
                    <span>{isUser ? 'أنت' : currentRole.name}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                    {msg.modelUsed && (
                      <span className="text-[9px] font-mono bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded border border-stone-200">
                        {msg.modelUsed}
                      </span>
                    )}
                  </div>

                  <div
                    className={`rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed relative group shadow-sm ${
                      isUser
                        ? 'bg-[#36533D] text-white rounded-tr-none'
                        : 'bg-[#FAF7F2] text-stone-900 border border-[#E7E2D8] rounded-tl-none'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="markdown-body prose prose-stone prose-xs sm:prose-sm max-w-none text-stone-900">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    )}

                    {/* Copy Button */}
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      className={`absolute top-2 left-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity ${
                        isUser ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                      }`}
                      title="نسخ الرسالة"
                    >
                      {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Loading Typing Indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-xl bg-[#36533D] text-amber-200 flex items-center justify-center shrink-0 mt-1">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div className="bg-[#FAF7F2] border border-[#E7E2D8] rounded-2xl rounded-tl-none p-4 text-xs text-stone-600 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#36533D] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="inline-block w-2 h-2 rounded-full bg-[#36533D] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="inline-block w-2 h-2 rounded-full bg-[#36533D] animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-stone-500 font-medium mr-1.5">
                  {currentRole.name} يفكر ويكتب لك باهتمام...
                </span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Bar */}
        {currentRole.suggestedPrompts && currentRole.suggestedPrompts.length > 0 && (
          <div className="px-4 py-2 bg-[#FAF7F2]/50 border-t border-[#E7E2D8]/70">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[11px] font-bold text-stone-500 whitespace-nowrap pl-1">
                اقتراحات سريعة:
              </span>
              {currentRole.suggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  disabled={isLoading}
                  className="px-2.5 py-1 text-xs bg-white hover:bg-[#36533D] hover:text-white text-stone-700 border border-[#E7E2D8] rounded-full whitespace-nowrap transition-all shrink-0 disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Input Form */}
        <div className="p-3 sm:p-4 bg-white border-t border-[#E7E2D8]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2"
          >
            <div className="flex-1 relative bg-[#FAF7F2] rounded-2xl border border-[#E7E2D8] focus-within:border-[#36533D] focus-within:bg-white transition-all">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={`تحدث مع ${currentRole.name}.. (اضغط Enter للإرسال، Shift+Enter لسطر جديد)`}
                rows={1}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-transparent resize-none text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none min-h-[44px] max-h-[180px]"
              />
            </div>

            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="w-11 h-11 rounded-2xl bg-[#36533D] hover:bg-[#283f2e] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#36533D]/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
              title="إرسال"
            >
              <Send className="w-5 h-5 -rotate-90" />
            </button>
          </form>

          {/* Emotional Safety Disclaimer */}
          <div className="flex items-center justify-between mt-2 px-2 text-[10px] text-stone-500">
            <div className="flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-amber-600 shrink-0" />
              <span>
                رفيق النور أداة دعم ووعي نفسي عبر تقنيات Gemini. لا تغني عن الاستشارة الطبية المتخصصة في الحالات الطارئة.
              </span>
            </div>
            <span className="hidden sm:inline font-mono text-[9px] text-stone-400">
              Multi-Turn Memory Active
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
