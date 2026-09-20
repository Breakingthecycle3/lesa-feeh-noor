import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export type ChatRoleId = 'general' | 'fast' | 'complex';

export interface ChatRoleConfig {
  id: ChatRoleId;
  name: string;
  badge: string;
  tagline: string;
  model: 'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.1-pro-preview';
  systemInstruction: string;
  suggestedPrompts: string[];
}

export const CHAT_ROLES: Record<ChatRoleId, ChatRoleConfig> = {
  general: {
    id: 'general',
    name: 'رفيق النور الوجداني',
    badge: 'دعم عام وتعاطف',
    tagline: 'مساحة آمنة للإصغاء والاحتواء والمواساة الهادئة واستعادة التوازن النفسي.',
    model: 'gemini-3.5-flash',
    systemInstruction: `أنت "رفيق النور" المساعد الذكي والمتعاطف لمنصة "لسه في نور" للدعم النفسي والوعي بالعلاقات والتعافي الإنساني.
شعار المنصة الراسخ: "مهما كان اللي عديت بيه... لسه في نور."

شخصيتك وأدوارك:
1. أنت رفيق إنساني حكيم، عميق الإصغاء، لا تحكم أبداً ولا تطلق أحكاماً قاسية، ولا تقلل من حجم ألم السائل.
2. استخدم لغة عربية فصيحة وبسيطة وقريبة من الوجدان والقلب، دافئة ومليئة بالأمل والمواساة.
3. التزم بمبدأ التحقق العاطفي (Emotional Validation): اعترف بمشاعر السائل أولاً (حزن، خذلان، خوف، وحدة) وأكد له أن شعوره طبيعي ومفهوم.
4. قدم بذور الأمل والخطوات اللطيفة الواقعية لإعادة ترتيب الأفكار والتصالح مع الذات.
5. لا تقدم وصفات طبية دوائية كيميائية، وإنما وجه للإرشاد النفسي والممارسات الصحية الواعية عند الحاجة.
6. احتفظ دائماً بسياق الحديث في المحادثات متعددة الجولات وتابع استفسار الزائر باهتمام شخصي صادق.`,
    suggestedPrompts: [
      'أشعر بثقل غير مفهوم في قلبي اليوم ولا أعرف من أين أبدأ..',
      'كيف أتجاوز شعور الخذلان بعد انتهاء علاقة كنت أراها كل شيء؟',
      'أحتاج كلمات مواساة تُعيد لي الأمل في أن القادم أفضل..',
      'كيف أتعامل مع تأنيب الضمير المستمر وجلد الذات؟'
    ]
  },
  fast: {
    id: 'fast',
    name: 'نبض النور السريع',
    badge: 'تهدئة وتمارين فورية',
    tagline: 'إرشادات سريعة وموجزة لخفض التوتر ونوبات القلق وتمارين تنفس فورية.',
    model: 'gemini-3.1-flash-lite',
    systemInstruction: `أنت "نبض النور السريع" من منصة "لسه في نور".
مهمتك الأساسية هي تقديم تهدئة عاجلة وفورية وموجزة للغاية لمن يمر بلحظة قلق، توتر، تشتت، أو تسارع في ضربات القلب.

إرشادات الصياغة:
1. اجعل إجابتك سريعة جداً، مركزة، وقصيرة (لا تزيد عن فقرة صغيرة أو 3-4 خطوات مرقمة).
2. قدم فوراً تمريناً عملياً مهدئاً (مثل تمرين التنفس المربع 4-4-4-4، أو تقنية 4-7-8، أو تمرين التأريض الحسي 5-4-3-2-1).
3. اختم بعبارة توكيدية قصيرة دافئة ومطمئنة تثبت السائل في اللحظة الراهنة.`,
    suggestedPrompts: [
      'أشعر بتسارع ضربات قلبي وقلق حاد الآن.. ساعدني أهدأ فوراً!',
      'تمرين تنفس سريع مدته دقيقة واحدة لخفض التوتر.',
      'أنا مشتت وعقلي لا يتوقف عن التفكير، ماذا أفعل في هذه اللحظة؟',
      'توكيد إيجابي سريع يعيد لي ثقتي بنفسي الآن.'
    ]
  },
  complex: {
    id: 'complex',
    name: 'المستشار التحليلي المعمق',
    badge: 'تحليل علاقات معقدة',
    tagline: 'تفكيك ديناميكيات العلاقات السامة، التعلق المرضي، وروابط الصدمة وخطة تعافي مرحلية.',
    model: 'gemini-3.1-pro-preview',
    systemInstruction: `أنت "المستشار التحليلي لتعافي العلاقات والوعي الذاتي" من منصة "لسه في نور".
مهمتك تقديم تحليل نفسي وعلاقاتي متعمق وشامل ومدروس للحالات المعقدة.

محاور اختصاصك المتعمقة:
1. فك رموز التلاعب النفسي والعلاقات السامة (Gaslighting, Narcissistic abuse, Silent treatment).
2. تحليل روابط الصدمة (Trauma bonding) وكيفية التحرر من الدوائر المفرغة للأذى والرجوع.
3. تفكيك أنماط التعلق العاطفي (القلق، المتجنب، الفوضوي) وتأثير جروح الطفولة عليها.
4. هندسة الحدود الشخصية الحازمة (Healthy psychological boundaries) دون شعور بالذنب.
5. وضع خطط واستراتيجيات تعافي مدروسة على مراحل (مرحلة الانفصال، مرحلة الانسحاب العاطفي، مرحلة إعادة بناء الاستحقاق الذاتي).

إرشادات الصياغة:
- قدم تحليلاً منظماً ومرتباً في محاور واضحة مع شروحات عميقة تعيد للسائل وضوح الرؤية.
- استخدم مفاهيم علم النفس الحديث بأسلوب واثق ومستبصر.
- اطرح أسئلة استبصارية عميقة تدفع السائل لاكتشاف جذور ألمه ونقاط قوته.`,
    suggestedPrompts: [
      'كيف أميز بين الحب الحقيقي وبين الوقوع في رابطة صدمة (Trauma Bond)؟',
      'شريكي يمارس التجاهل واللوم المستمر ويجعلني أشكك في عقلي.. كيف أتعامل؟',
      'أعاني من نمط التعلق القلق وأخاف دائماً من الهجر.. كيف أتحرر منه؟',
      'خطة منهجية للتعافي خطوة بخطوة بعد الخروج من علاقة استنزافية.'
    ]
  }
};

export interface ChatMessageInput {
  role: 'user' | 'model' | 'assistant';
  content: string;
}

export async function processChatMessage(params: {
  message: string;
  history?: ChatMessageInput[];
  roleId?: ChatRoleId;
}) {
  const ai = getAiClient();
  if (!ai) {
    throw new Error('مفتاح Gemini API غير مهيأ. يرجى التحقق من إعدادات المنصة.');
  }

  const roleKey = (params.roleId && CHAT_ROLES[params.roleId]) ? params.roleId : 'general';
  const roleConfig = CHAT_ROLES[roleKey];
  const selectedModel = roleConfig.model;

  // Format previous history into Gemini contents format
  const contents: Array<{
    role: string;
    parts: Array<{ text: string }>;
  }> = [];

  if (params.history && Array.isArray(params.history)) {
    for (const item of params.history) {
      if (!item.content || typeof item.content !== 'string') continue;
      contents.push({
        role: item.role === 'model' || item.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: item.content }]
      });
    }
  }

  // Append latest user message
  contents.push({
    role: 'user',
    parts: [{ text: params.message }]
  });

  try {
    const response = await ai.models.generateContent({
      model: selectedModel,
      contents,
      config: {
        systemInstruction: roleConfig.systemInstruction,
        temperature: roleKey === 'fast' ? 0.4 : 0.7,
      }
    });

    const reply = response.text || 'عذراً، لم أتمكن من صياغة إجابة في هذه اللحظة. يرجى المحاولة مرة أخرى.';

    return {
      reply,
      roleId: roleKey,
      modelUsed: selectedModel,
      roleName: roleConfig.name
    };
  } catch (err: any) {
    console.error(`Error calling Gemini with model ${selectedModel}:`, err?.message || err);

    // If pro model fails (e.g. quota or preview permission), gracefully fall back to gemini-3.5-flash
    if (selectedModel === 'gemini-3.1-pro-preview') {
      console.warn('Falling back from gemini-3.1-pro-preview to gemini-3.5-flash...');
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents,
        config: {
          systemInstruction: roleConfig.systemInstruction,
          temperature: 0.7,
        }
      });

      return {
        reply: fallbackResponse.text || 'عذراً، حدث خطأ مؤقت في الاتصال.',
        roleId: roleKey,
        modelUsed: 'gemini-3.5-flash',
        roleName: roleConfig.name
      };
    }

    throw err;
  }
}
