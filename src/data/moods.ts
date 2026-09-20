import { MoodConfig, MoodKey } from '../types';

export const MOODS: MoodConfig[] = [
  {
    id: 'calm',
    label: 'أحتاج للهدوء والسكينة',
    sublabel: 'تهدئة الأفكار المتسارعة، تخفيف القلق، والتقاط أنفاس هادئة',
    emoji: '🌿',
    color: 'text-emerald-800',
    accentBg: 'bg-emerald-50/80',
    borderColor: 'border-emerald-200',
    quote: {
      text: 'ليس عليك أن تحل كل شيء الآن.. أحياناً يكون أعظم إنجاز لك في هذا اليوم هو أن تستريح وتهدأ روحك.',
      author: 'لسه في نور'
    },
    categorySlugs: ['inner-peace', 'mental-awareness', 'faith-hope']
  },
  {
    id: 'motivation',
    label: 'أحتاج للتحفيز وبداية جديدة',
    sublabel: 'تجاوز الفتور والركود، إيقاد شعلة الأمل، واستعادة العزيمة',
    emoji: '⚡',
    color: 'text-amber-800',
    accentBg: 'bg-amber-50/80',
    borderColor: 'border-amber-200',
    quote: {
      text: 'أنت لست متأخراً عن قطار الحياة.. أنت فقط تسير في توقيتك الخاص. كل ما تحتاجه هو خطوة واحدة صغيرة اليوم.',
      author: 'لسه في نور'
    },
    categorySlugs: ['self-growth', 'self-esteem', 'faith-hope']
  },
  {
    id: 'healing',
    label: 'أشعر بالحزن وألم الفقد',
    sublabel: 'مساحة احتواء آمنة للبكاء، مداواة الجرح، والرفق بالنفس وقت الانكسار',
    emoji: '💔',
    color: 'text-rose-800',
    accentBg: 'bg-rose-50/80',
    borderColor: 'border-rose-200',
    quote: {
      text: 'التعافي لا يعني أن الجرح لم يكن موجوداً، بل يعني أنه لم يعد يتحكم في حاضرك. ابكِ إذا احتجت، ثم استند إلى لطف الله.',
      author: 'لسه في نور'
    },
    categorySlugs: ['healing', 'mental-awareness', 'inner-peace']
  },
  {
    id: 'clarity',
    label: 'تائه(ة) وأبحث عن وضوح',
    sublabel: 'ترتيب الأولويات، فهم المشاعر المتشابكة، ورسم بوصلة قراراتك',
    emoji: '🧭',
    color: 'text-indigo-800',
    accentBg: 'bg-indigo-50/80',
    borderColor: 'border-indigo-200',
    quote: {
      text: 'حين تشعر بالضياع، تذكر أن البذور تدفن أولاً في الظلام قبل أن تنبت نحو النور. ما تراه تيهاً قد يكون بداية وعي أعمق.',
      author: 'لسه في نور'
    },
    categorySlugs: ['mental-awareness', 'personal-boundaries', 'self-growth']
  },
  {
    id: 'exhausted',
    label: 'مستنزف(ة) من علاقة معقدة',
    sublabel: 'فك التعلق المؤذي، وقف استنزاف طاقتك، والتعافي من التلاعب',
    emoji: '🛡️',
    color: 'text-stone-800',
    accentBg: 'bg-stone-100/90',
    borderColor: 'border-stone-300',
    quote: {
      text: 'خسارتهم لم تكن نقصاً فيك، بل كانت دليلاً على أن كرمك فاق سعة إنائهم. حدودك هي قمة احترامك لذاتك.',
      author: 'لسه في نور'
    },
    categorySlugs: ['toxic-relationships', 'personal-boundaries', 'relationships', 'marriage']
  },
  {
    id: 'self-love',
    label: 'أرغب في احتواء نفسي والرفق بذاتي',
    sublabel: 'وقف جلد الذات، مسامحة النفس، وتضميد جراح الطفل الداخلي',
    emoji: '🌸',
    color: 'text-pink-800',
    accentBg: 'bg-pink-50/80',
    borderColor: 'border-pink-200',
    quote: {
      text: 'سامح نفسك على ما لم تكن تدركه حينها. كنت تفعل أفضل ما لديك بوعيك السابق. اليوم أنت أكثر حكمة واستحقاقاً للأمان.',
      author: 'لسه في نور'
    },
    categorySlugs: ['self-esteem', 'healing', 'inner-peace']
  }
];

export function getMoodById(id: string): MoodConfig | undefined {
  return MOODS.find((m) => m.id === id);
}
