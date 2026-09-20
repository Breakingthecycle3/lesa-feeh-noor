import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, Timer, Wind, Volume2, VolumeX, Sparkles } from 'lucide-react';

type TimerState = 'idle' | 'running' | 'paused' | 'finished';

const PRESET_DURATIONS = [
  { label: 'دقيقة واحدة', value: 60 },
  { label: '3 دقائق', value: 180 },
  { label: '5 دقائق', value: 300 },
  { label: '10 دقائق', value: 600 }
];

export function MindfulnessTimer() {
  const [duration, setDuration] = useState(180); // 3 minutes default
  const [timeLeft, setTimeLeft] = useState(180);
  const [state, setState] = useState<TimerState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Breathing cycle animation (roughly 4-4-4 technique)
  useEffect(() => {
    if (state !== 'running') return;

    const interval = setInterval(() => {
      setBreathPhase(prev => {
        if (prev === 'inhale') return 'hold';
        if (prev === 'hold') return 'exhale';
        return 'inhale';
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [state]);

  useEffect(() => {
    if (state === 'running' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && state === 'running') {
      setState('finished');
      if (timerRef.current) clearInterval(timerRef.current);
      // Play soft chime if not muted (mocking audio for now or using a small beep if possible)
      // Since we don't have a specific asset, we just handle the UI state
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state, timeLeft]);

  const toggleTimer = () => {
    if (state === 'running') setState('paused');
    else setState('running');
  };

  const resetTimer = () => {
    setState('idle');
    setTimeLeft(duration);
    setBreathPhase('inhale');
  };

  const changeDuration = (val: number) => {
    setDuration(val);
    setTimeLeft(val);
    setState('idle');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((duration - timeLeft) / duration) * 100;

  return (
    <div className="bg-white rounded-3xl border border-[#E7E2D8] p-6 shadow-sm overflow-hidden relative group" dir="rtl">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-48 h-48 bg-[#36533D]/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#36533D]/10 rounded-xl text-[#36533D]">
              <Timer className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-lg text-stone-900">مؤقت التأمل</h3>
          </div>
          
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 hover:bg-stone-100 rounded-lg text-stone-400 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Preset Selector */}
        {state === 'idle' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
            {PRESET_DURATIONS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => changeDuration(preset.value)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  duration === preset.value
                    ? 'bg-[#36533D] text-white border-[#36533D]'
                    : 'bg-[#FAF7F2] text-stone-600 border-[#E7E2D8] hover:border-[#36533D]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}

        {/* Timer Display & Animation */}
        <div className="flex flex-col items-center justify-center py-4">
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* Background Circle */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="88"
                fill="none"
                stroke="#E7E2D8"
                strokeWidth="4"
              />
              <motion.circle
                cx="96"
                cy="96"
                r="88"
                fill="none"
                stroke="#36533D"
                strokeWidth="4"
                strokeDasharray="552.92"
                animate={{ strokeDashoffset: 552.92 * (1 - progress / 100) }}
                transition={{ duration: 1, ease: 'linear' }}
              />
            </svg>

            {/* Breathing Animation Circle */}
            <AnimatePresence>
              {state === 'running' && (
                <motion.div
                  key="breathing"
                  initial={{ scale: 0.8, opacity: 0.3 }}
                  animate={{ 
                    scale: breathPhase === 'inhale' ? 1.2 : breathPhase === 'hold' ? 1.2 : 0.8,
                    opacity: breathPhase === 'inhale' ? 0.2 : breathPhase === 'hold' ? 0.3 : 0.1
                  }}
                  transition={{ duration: 4, ease: "easeInOut" }}
                  className="absolute w-32 h-32 bg-[#36533D] rounded-full"
                />
              )}
            </AnimatePresence>

            <div className="relative z-10 flex flex-col items-center">
              <span className="text-4xl font-black text-stone-900 font-mono tracking-tighter">
                {formatTime(timeLeft)}
              </span>
              <AnimatePresence mode="wait">
                {state === 'running' && (
                  <motion.div
                    key={breathPhase}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-center gap-1.5 mt-2 text-[#36533D]"
                  >
                    <Wind className="w-3 h-3" />
                    <span className="text-xs font-bold">
                      {breathPhase === 'inhale' ? 'شهيق...' : breathPhase === 'hold' ? 'ثبات...' : 'زفير...'}
                    </span>
                  </motion.div>
                )}
                {state === 'finished' && (
                  <motion.div
                    key="done"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1.5 mt-2 text-emerald-600"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span className="text-xs font-bold">تم بنجاح</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={resetTimer}
            className="p-3 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-2xl transition-all active:scale-95"
            title="إعادة ضبط"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          
          <button
            onClick={toggleTimer}
            disabled={state === 'finished'}
            className={`w-16 h-16 flex items-center justify-center rounded-3xl transition-all shadow-lg active:scale-95 ${
              state === 'finished'
                ? 'bg-stone-100 text-stone-300'
                : 'bg-[#36533D] text-white shadow-[#36533D]/20 hover:bg-[#2a4230]'
            }`}
          >
            {state === 'running' ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
          </button>

          <div className="w-11 h-11" /> {/* Spacer for symmetry if needed */}
        </div>

        {/* Tip */}
        <div className="mt-8 p-3 bg-[#FAF7F2] rounded-2xl flex items-start gap-3 border border-[#E7E2D8]">
          <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 border border-[#E7E2D8] text-[#36533D]">
            <Wind className="w-4 h-4" />
          </div>
          <p className="text-[11px] text-stone-600 leading-relaxed italic">
            "خذ نفساً عميقاً، اترك كل ما يثقل كاهلك مع الزفير، وابقَ هنا في اللحظة الراهنة.. فكل لحظة هدوء هي خطوة نحو النور."
          </p>
        </div>
      </div>
    </div>
  );
}
