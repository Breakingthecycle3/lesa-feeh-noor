import React, { useState, useEffect } from 'react';

export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
          if (totalHeight <= 0) {
            setProgress(0);
          } else {
            const currentScroll = window.scrollY || document.documentElement.scrollTop;
            const percentage = Math.min(Math.max((currentScroll / totalHeight) * 100, 0), 100);
            setProgress(percentage);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    // Calculate initial progress on mount
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return (
    <div
      id="reading-progress-track"
      className="fixed top-0 left-0 right-0 h-[3.5px] bg-stone-200/50 z-50 pointer-events-none overflow-hidden"
      role="progressbar"
      aria-label="مؤشر تقدم القراءة"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        id="reading-progress-bar"
        className="h-full bg-gradient-to-l from-[#36533D] via-[#4A6F52] to-[#D4AF37] transition-[width] duration-100 ease-out shadow-[0_1px_6px_rgba(54,83,61,0.35)]"
        style={{
          width: `${progress}%`,
          float: 'right', // Aligns to right in RTL reading orientation
        }}
      />
    </div>
  );
}
