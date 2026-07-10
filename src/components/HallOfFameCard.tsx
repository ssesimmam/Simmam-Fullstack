import { useState, useEffect } from 'react';
import { type Award } from '@/api/admin/settings';
import { Sparkles, ArrowRight } from 'lucide-react';

interface HallOfFameCardProps {
  entry: Award;
  isActive: boolean;
}

export function HallOfFameCard({ entry, isActive }: HallOfFameCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [tiltStyle, setTiltStyle] = useState({ transform: 'rotateX(0deg) rotateY(0deg)' });

  // Reset state when entry changes or card becomes inactive
  useEffect(() => {
    setIsRevealed(false);
  }, [entry.id, isActive]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isActive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8; // max 8deg tilt
    const rotateY = ((x - centerX) / centerX) * 8;
    setTiltStyle({ transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)` });
  };

  const handleMouseLeave = () => {
    setTiltStyle({ transform: 'rotateX(0deg) rotateY(0deg)' });
  };

  const handleReveal = () => {
    if (!isRevealed && isActive) {
      setIsRevealed(true);
    }
  };

  return (
    <div
      className="relative w-full max-w-[400px] aspect-[3/4] mx-auto cursor-pointer group"
      style={{ perspective: '1200px' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleReveal}
    >
      {/* 3D Container */}
      <div
        className="w-full h-full relative transition-all duration-[1500ms]"
        style={{
          transformStyle: 'preserve-3d',
          transform: `${tiltStyle.transform} ${isRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)'}`,
          transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)', // elegant ease-out
        }}
      >
        {/* === FRONT FACING (Unrevealed) === */}
        <div
          className="absolute inset-0 w-full h-full glass rounded-[1.5rem] p-8 flex flex-col items-center justify-center text-center backface-hidden overflow-hidden"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          {/* Subtle inner grid/texture */}
          <div className="absolute inset-0 grid-bg opacity-30" />
          
          <div className="relative z-10 flex flex-col items-center justify-center gap-6 h-full w-full">
            <span className="font-display text-sm tracking-[0.2em] text-gold/70 uppercase">
              Mystery Category
            </span>
            <div className="text-6xl my-4 animate-float-slow">
              {entry.mysteryIcon}
            </div>
            <h3 className="font-display text-2xl text-gradient-gold px-4">
              {entry.category}
            </h3>
            
            <div className="mt-auto pt-8 flex items-center gap-2 text-gold/80 text-sm tracking-widest uppercase hover:text-gold transition-colors">
              <Sparkles size={16} />
              <span>Click to Reveal</span>
              <ArrowRight size={16} />
            </div>
          </div>
          
          {/* Hover Glow Effect */}
          <div className="absolute inset-0 rounded-[1.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none shadow-[inset_0_0_40px_rgba(218,165,32,0.2)]" />
        </div>

        {/* === BACK FACING (Revealed) === */}
        <div
          className="absolute inset-0 w-full h-full glass rounded-[1.5rem] overflow-hidden backface-hidden neon-border"
          style={{ 
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          {/* Poster Image */}
          <div className="absolute inset-0 w-full h-full">
            <img 
              src={entry.posterSrc || ''} 
              alt={entry.winnerName}
              loading="lazy"
              className="w-full h-full object-cover opacity-60 mix-blend-luminosity scale-[1.15] transition-transform duration-[2000ms] ease-out"
              style={{ transform: isRevealed ? 'scale(1)' : 'scale(1.15)' }}
            />
            {/* Gradient overlay to make text readable */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          </div>

          {/* Winner Information */}
          <div className="absolute inset-0 flex flex-col justify-end p-8 z-10">
            <div 
              className="flex flex-col gap-2 transform transition-all duration-[1200ms] delay-500 ease-out"
              style={{ 
                opacity: isRevealed ? 1 : 0, 
                transform: isRevealed ? 'translateY(0)' : 'translateY(30px)' 
              }}
            >
              <div className="inline-block px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs tracking-widest uppercase w-fit mb-2 backdrop-blur-md">
                {entry.awardTitle}
              </div>
              <h2 className="font-display text-3xl text-white drop-shadow-lg leading-tight">
                {entry.winnerName}
              </h2>
              {entry.department && (
                <p className="text-white/70 text-sm tracking-wide">
                  {entry.department}
                </p>
              )}
              {entry.achievement && (
                <p className="text-gold/90 text-sm mt-3 font-medium border-l-2 border-gold pl-3">
                  {entry.achievement}
                </p>
              )}
            </div>
          </div>
          
          {/* Spotlight Effect after reveal */}
          <div className="absolute inset-0 spotlight opacity-0 mix-blend-overlay transition-opacity duration-[2000ms] delay-700" style={{ opacity: isRevealed ? 0.8 : 0 }} />
        </div>
      </div>
      
      {/* Outer Shadow/Glow transition */}
      <div 
        className="absolute inset-[-20px] -z-10 rounded-[2rem] blur-xl opacity-0 transition-opacity duration-[1500ms] pointer-events-none"
        style={{ 
          background: 'radial-gradient(circle, oklch(0.82 0.17 82 / 0.4) 0%, transparent 70%)',
          opacity: (isActive && isRevealed) ? 1 : 0 
        }}
      />
    </div>
  );
}
