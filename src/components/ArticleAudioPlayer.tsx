import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Loader2,
  FastForward
} from 'lucide-react';
import { api } from '../lib/api';

interface ArticleAudioPlayerProps {
  title: string;
  excerpt?: string;
  content: string;
}

export function ArticleAudioPlayer({ title, excerpt, content }: ArticleAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [speechEngine, setSpeechEngine] = useState<'gemini' | 'native'>('gemini');
  const [statusMessage, setStatusMessage] = useState<string>('');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioBlobUrlRef = useRef<string | null>(null);
  const nativeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const progressIntervalRef = useRef<number | null>(null);

  // Clean raw HTML to spoken text
  const getCleanSpeechText = () => {
    const raw = `${title}. ${excerpt || ''}. ${content}`;
    return raw
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Cleanup on unmount or article change
  useEffect(() => {
    return () => {
      stopAll();
      if (audioBlobUrlRef.current) {
        audioBlobUrlRef.current = null;
      }
    };
  }, [title, content]);

  const stopAll = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // ================= NATIVE BROWSER SPEECH SYNTHESIS FALLBACK =================
  const startNativeSpeech = (fullText: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setStatusMessage('متصفحك لا يدعم القراءة الصوتية المباشرة');
      setIsLoading(false);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = 'ar-SA';
    utterance.rate = playbackRate;

    // Pick best Arabic voice available in the system
    const voices = window.speechSynthesis.getVoices();
    const arabicVoice =
      voices.find((v) => v.lang.startsWith('ar')) ||
      voices.find((v) => v.name.toLowerCase().includes('arabic'));

    if (arabicVoice) {
      utterance.voice = arabicVoice;
    }

    // Estimate duration based on word count (approx. 130 words per minute in Arabic)
    const words = fullText.split(/\s+/).length;
    const estimatedSeconds = Math.max(Math.round((words / 130) * 60), 30);
    setDuration(estimatedSeconds);
    setSpeechEngine('native');
    setStatusMessage('قارئ النظام الصوتي المباشر');

    let elapsed = 0;
    utterance.onstart = () => {
      setIsLoading(false);
      setIsPlaying(true);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = window.setInterval(() => {
        elapsed += 1;
        setCurrentTime((prev) => Math.min(prev + 1, estimatedSeconds));
      }, 1000 / playbackRate);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };

    utterance.onerror = (e) => {
      console.warn('Native speech error:', e);
      setIsPlaying(false);
      setIsLoading(false);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };

    nativeUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // ================= GEMINI AI SPEECH OR FALLBACK =================
  const handlePlayToggle = async () => {
    // If currently playing, pause
    if (isPlaying) {
      if (speechEngine === 'gemini' && audioRef.current) {
        audioRef.current.pause();
      } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.pause();
      }
      setIsPlaying(false);
      return;
    }

    // If paused and has audio source, resume
    if (speechEngine === 'gemini' && audioRef.current && audioRef.current.src) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        return;
      } catch (err) {
        console.warn('Audio resume error:', err);
      }
    }

    if (speechEngine === 'native' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
        return;
      }
    }

    // Otherwise, generate audio from API or fallback
    setIsLoading(true);
    setStatusMessage('نستحضر الصوت الهادئ للمقال...');
    const speechText = getCleanSpeechText();

    try {
      const response = await api.generateSpeech(title, speechText);

      if (response.audioUrl && !response.fallbackToNative) {
        setSpeechEngine('gemini');
        setStatusMessage('صوت الذكاء الاصطناعي (Gemini)');
        audioBlobUrlRef.current = response.audioUrl;

        if (!audioRef.current) {
          audioRef.current = new Audio();
        }

        const audio = audioRef.current;
        audio.src = response.audioUrl;
        audio.playbackRate = playbackRate;
        audio.muted = isMuted;

        audio.onloadedmetadata = () => {
          setDuration(audio.duration || 60);
          setIsLoading(false);
          audio.play().then(() => setIsPlaying(true));
        };

        audio.ontimeupdate = () => {
          setCurrentTime(audio.currentTime);
        };

        audio.onended = () => {
          setIsPlaying(false);
          setCurrentTime(0);
        };

        audio.onerror = () => {
          console.warn('HTML5 Audio error, switching to native speech synthesis');
          startNativeSpeech(speechText);
        };
      } else {
        // Fallback to native Arabic speech synthesis
        startNativeSpeech(speechText);
      }
    } catch (err) {
      console.warn('TTS API error, falling back to native speech synthesis:', err);
      startNativeSpeech(speechText);
    }
  };

  const handleRestart = () => {
    setCurrentTime(0);
    if (speechEngine === 'gemini' && audioRef.current) {
      audioRef.current.currentTime = 0;
      if (!isPlaying) {
        audioRef.current.play().then(() => setIsPlaying(true));
      }
    } else {
      const speechText = getCleanSpeechText();
      startNativeSpeech(speechText);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (speechEngine === 'gemini' && audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const toggleRate = () => {
    const rates = [1, 1.25, 1.5, 0.85];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);

    if (speechEngine === 'gemini' && audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    } else if (isPlaying && nativeUtteranceRef.current) {
      // Re-trigger with new rate
      const speechText = getCleanSpeechText();
      startNativeSpeech(speechText);
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      id="article-audio-player"
      className="my-8 p-5 sm:p-6 rounded-2xl bg-[#F4EFE6] border border-[#E4DDD0] shadow-sm relative overflow-hidden text-right"
      dir="rtl"
    >
      {/* Decorative calm background accent */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-[#36533D]/5 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#36533D] text-white flex items-center justify-center shadow-sm">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-stone-900 text-sm sm:text-base flex items-center gap-2">
              <span>استمع إلى هذا المقال</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#36533D]/10 text-[#36533D]">
                <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                {speechEngine === 'gemini' ? 'صوت الذكاء الاصطناعي' : 'قارئ مباشر'}
              </span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              {statusMessage || 'ميزة القراءة الصوتية للاستماع أثناء التنقل براحة وسكينة'}
            </p>
          </div>
        </div>

        {/* Speed & Mute Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleRate}
            id="tts-speed-button"
            className="px-2.5 py-1 text-xs font-bold rounded-lg border border-[#DCD5C7] bg-white text-stone-700 hover:bg-stone-50 transition cursor-pointer flex items-center gap-1"
            title="تغيير سرعة القراءة"
          >
            <FastForward className="w-3.5 h-3.5 text-stone-400" />
            <span>{playbackRate}x</span>
          </button>

          {speechEngine === 'gemini' && (
            <button
              type="button"
              onClick={toggleMute}
              id="tts-mute-button"
              className="p-1.5 rounded-lg border border-[#DCD5C7] bg-white text-stone-700 hover:bg-stone-50 transition cursor-pointer"
              title={isMuted ? 'إلغاء الكتم' : 'كتم الصوت'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-rose-500" />
              ) : (
                <Volume2 className="w-4 h-4 text-stone-600" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar & Timestamps */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-stone-500 mb-1 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          disabled={duration === 0 || speechEngine === 'native'}
          id="tts-progress-slider"
          className="w-full h-1.5 bg-stone-300/80 rounded-lg appearance-none cursor-pointer accent-[#36533D] disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="مؤشر مدة الصوت"
        />
      </div>

      {/* Player Actions Bar */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          {/* Main Play / Pause Button */}
          <button
            type="button"
            onClick={handlePlayToggle}
            disabled={isLoading}
            id="tts-play-toggle"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#36533D] text-white font-bold text-sm shadow hover:bg-[#2C4332] active:scale-95 transition-all cursor-pointer disabled:opacity-75 disabled:cursor-wait"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>جاري التحضير...</span>
              </>
            ) : isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>إيقاف مؤقت</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>{currentTime > 0 ? 'استئناف الاستماع' : 'بدء الاستماع'}</span>
              </>
            )}
          </button>

          {/* Restart Button */}
          {(currentTime > 0 || isPlaying) && (
            <button
              type="button"
              onClick={handleRestart}
              id="tts-restart-button"
              className="p-2.5 rounded-xl border border-[#DCD5C7] bg-white text-stone-700 hover:bg-stone-50 active:scale-95 transition cursor-pointer"
              title="إعادة الاستماع من البداية"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Ambient soundwave pulses while playing */}
        {isPlaying && (
          <div className="flex items-center gap-1">
            <span className="w-1 h-3 bg-[#36533D] rounded-full animate-pulse" />
            <span className="w-1 h-5 bg-[#36533D] rounded-full animate-pulse [animation-delay:150ms]" />
            <span className="w-1 h-2 bg-[#D4AF37] rounded-full animate-pulse [animation-delay:300ms]" />
            <span className="w-1 h-4 bg-[#36533D] rounded-full animate-pulse [animation-delay:450ms]" />
            <span className="w-1 h-2 bg-[#36533D] rounded-full animate-pulse [animation-delay:200ms]" />
          </div>
        )}
      </div>
    </div>
  );
}
