import { GoogleGenAI, Modality } from '@google/genai';

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

/**
 * Prepend a 44-byte standard RIFF/WAV header to raw 16-bit linear PCM audio.
 * Default Gemini TTS output is 24000Hz, 1 channel (mono), 16-bit.
 */
function pcmToWav(
  pcmBuffer: Buffer,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): Buffer {
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const wavHeader = Buffer.alloc(44);

  // "RIFF" chunk descriptor
  wavHeader.write('RIFF', 0);
  wavHeader.writeUInt32LE(36 + pcmBuffer.length, 4);
  wavHeader.write('WAVE', 8);

  // "fmt " sub-chunk
  wavHeader.write('fmt ', 12);
  wavHeader.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  wavHeader.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  wavHeader.writeUInt16LE(numChannels, 22);
  wavHeader.writeUInt32LE(sampleRate, 24);
  wavHeader.writeUInt32LE(byteRate, 28);
  wavHeader.writeUInt16LE(blockAlign, 32);
  wavHeader.writeUInt16LE(bitsPerSample, 34);

  // "data" sub-chunk
  wavHeader.write('data', 36);
  wavHeader.writeUInt32LE(pcmBuffer.length, 40);

  return Buffer.concat([wavHeader, pcmBuffer]);
}

/**
 * Generates an audio representation of Arabic text using Gemini TTS.
 */
export async function generateSpeechFromText(text: string): Promise<{
  audioUrl?: string;
  fallbackToNative: boolean;
  source: 'gemini' | 'native';
  error?: string;
}> {
  const cleanText = text
    .replace(/<[^>]*>/g, ' ') // Strip HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanText) {
    return { fallbackToNative: true, source: 'native', error: 'النص فارغ' };
  }

  const ai = getAiClient();
  if (!ai) {
    return {
      fallbackToNative: true,
      source: 'native',
      error: 'GEMINI_API_KEY غير متاح حالياً، سيتم استخدام القارئ الصوتي المباشر',
    };
  }

  try {
    // Provide a clear Arabic delivery instruction for Gemini TTS
    // Truncate to reasonable speech segment (up to 3000 chars for a single audio pass)
    const promptText = cleanText.slice(0, 3000);

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [
        {
          parts: [
            {
              text: `اقرأ النص العربي التالي بصوت هادئ، واضح، مطمئن، ومريح للأذن بروية:\n\n${promptText}`,
            },
          ],
        },
      ],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            // 'Kore' is a warm, calm, clear voice suited for mindfulness & editorial reading
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Pcm =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Pcm) {
      return {
        fallbackToNative: true,
        source: 'native',
        error: 'لم يتم استلام مخرجات صوتية من النموذج',
      };
    }

    const pcmBuffer = Buffer.from(base64Pcm, 'base64');
    const wavBuffer = pcmToWav(pcmBuffer, 24000, 1, 16);
    const audioDataUri = `data:audio/wav;base64,${wavBuffer.toString('base64')}`;

    return {
      audioUrl: audioDataUri,
      fallbackToNative: false,
      source: 'gemini',
    };
  } catch (err: any) {
    console.warn('Gemini TTS error, falling back to client-side speech synthesis:', err?.message || err);
    return {
      fallbackToNative: true,
      source: 'native',
      error: err?.message || 'حدث خطأ أثناء توليد الصوت بالذكاء الاصطناعي',
    };
  }
}
