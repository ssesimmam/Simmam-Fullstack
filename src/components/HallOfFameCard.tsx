import { useState, useEffect, useRef } from 'react';
import { type Award } from '@/api/admin/settings';
import { Sparkles, Trophy } from 'lucide-react';

interface HallOfFameCardProps {
  entry: Award;
}

export function HallOfFameCard({ entry }: HallOfFameCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  
  const cardRef = useRef<HTMLDivElement>(null);
  
  // DOM Refs for Layers
  const wrapperRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);
  const foilRef = useRef<HTMLDivElement>(null);
  const borderRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const rafId = useRef<number | null>(null);

  // Physics State
  const mouseX = useRef({ val: 50, vel: 0, target: 50 });
  const mouseY = useRef({ val: 50, vel: 0, target: 50 });
  const hoverState = useRef({ val: 0, vel: 0, target: 0 }); // 0 to 1

  useEffect(() => {
    setIsRevealed(false);
    setTimeLeft('');

    if (!entry.revealAt) {
      setIsRevealed(false);
      setTimeLeft('');
      return;
    }

    const targetTime = new Date(entry.revealAt).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = targetTime - now;

      if (distance <= 0) {
        setIsRevealed(true);
        setTimeLeft('');
      } else {
        setIsRevealed(false);
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0 || days > 0) parts.push(`${hours}h`);
        parts.push(`${minutes}m`);
        parts.push(`${seconds}s`);
        setTimeLeft(parts.join(' '));
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [entry.id, entry.revealAt]);

  const updateSpring = (spring: { val: number, vel: number, target: number }, stiffness = 0.06, damping = 0.75) => {
    const force = (spring.target - spring.val) * stiffness;
    spring.vel += force;
    spring.vel *= damping;
    spring.val += spring.vel;
  };

  const renderFrame = () => {
    updateSpring(mouseX.current, 0.04, 0.8);
    updateSpring(mouseY.current, 0.04, 0.8);
    updateSpring(hoverState.current, 0.05, 0.75);

    const mx = mouseX.current.val; // 0 to 100
    const my = mouseY.current.val; // 0 to 100
    const h = hoverState.current.val; // 0 to 1

    // Normalize -1 to 1 for rotations
    const nx = (mx - 50) / 50; 
    const ny = (my - 50) / 50;

    // Base Rotation (max 18 degrees)
    const rotX = ny * -18 * h;
    const rotY = nx * 18 * h;

    if (wrapperRef.current) {
      wrapperRef.current.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    }

    // Layer 1: Shadow
    if (shadowRef.current) {
      // Shadow drops down and opposite to rotation
      shadowRef.current.style.transform = `translateZ(-80px) translateX(${nx * -20 * h}px) translateY(${ny * -20 * h + (h * 20)}px)`;
      shadowRef.current.style.opacity = `${0.3 + (h * 0.4)}`;
      shadowRef.current.style.filter = `blur(${20 + (h * 20)}px)`;
    }

    // Layer 2: Background (Static black backplate)
    if (bgRef.current) {
      bgRef.current.style.transform = `translateZ(-61px)`;
    }

    // Layer 3: Portrait (Base layer of the card)
    if (portraitRef.current) {
      portraitRef.current.style.transform = `translateZ(0px)`;
    }

    // Layer 4: Glass Overlay (Slightly elevated)
    if (glassRef.current) {
      glassRef.current.style.transform = `translateZ(10px)`;
      const opX = 100 - mx;
      const opY = 100 - my;
      glassRef.current.style.background = `
        radial-gradient(
          circle at ${opX}% ${opY}%, 
          rgba(255,255,255, ${0.15 * h}) 0%, 
          rgba(255,255,255, ${0.05 * h}) 25%, 
          transparent 50%
        )
      `;
    }

    // Layer 5: Foil Reflection (Elevated above glass)
    if (foilRef.current) {
      foilRef.current.style.transform = `translateZ(20px) rotateX(${rotX * 0.2}deg) rotateY(${rotY * 0.2}deg)`;
      
      foilRef.current.style.background = `
        conic-gradient(
          from ${mx * 2 + my}deg at ${mx}% ${my}%,
          transparent 0deg,
          rgba(255, 255, 255, ${0.15 * h}) 45deg,
          transparent 90deg,
          rgba(218, 165, 32, ${0.1 * h}) 135deg,
          transparent 180deg,
          rgba(176, 224, 230, ${0.1 * h}) 225deg,
          transparent 270deg,
          rgba(238, 130, 238, ${0.1 * h}) 315deg,
          transparent 360deg
        ),
        radial-gradient(
          farthest-corner circle at ${mx}% ${my}%,
          rgba(255, 255, 255, ${0.1 * h}) 0%,
          rgba(218, 165, 32, ${0.05 * h}) 40%,
          transparent 70%
        )
      `;
    }

    // Layer 6: Border (Empty layer now, acting as a structural anchor if needed)
    if (borderRef.current) {
      borderRef.current.style.transform = `translateZ(30px)`;
    }

    // Layer 7: Text (Elevated highest)
    if (textRef.current) {
      textRef.current.style.transform = `translateZ(50px)`;
    }

    rafId.current = requestAnimationFrame(renderFrame);
  };

  useEffect(() => {
    rafId.current = requestAnimationFrame(renderFrame);
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    mouseX.current.target = (x / rect.width) * 100;
    mouseY.current.target = (y / rect.height) * 100;
    hoverState.current.target = 1;
  };

  const handleMouseLeave = () => {
    mouseX.current.target = 50;
    mouseY.current.target = 50;
    hoverState.current.target = 0;
  };

  const handleManualReveal = () => {
    if (!entry.revealAt && !isRevealed) {
      setIsRevealed(true);
    }
  };

  const clickProps = !entry.revealAt && !isRevealed ? { onClick: handleManualReveal, style: { cursor: 'pointer' } } : {};

  return (
    <div
      ref={cardRef}
      className={`relative w-full max-w-[360px] aspect-[4/5] mx-auto z-10 ${!entry.revealAt && !isRevealed ? 'cursor-pointer' : ''}`}
      style={{ perspective: '1200px', ...clickProps.style }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={clickProps.onClick}
    >
      {/* 3D Scene Wrapper */}
      <div 
        ref={wrapperRef}
        className="w-full h-full relative"
        style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
      >
        
        {/* Layer 1: Shadow */}
        <div 
          ref={shadowRef}
          className="absolute inset-4 bg-black rounded-[20px] pointer-events-none"
          style={{ willChange: 'transform, opacity, filter' }}
        />

        {/* The Card Bounds (Everything inside here is clipped to the card shape visually by the border/bg) */}
        {/* Note: We avoid overflow: hidden on preserve-3d containers, so we clip layers individually using border-radius */}
        
        {/* Layer 2: Background Base */}
        <div 
          ref={bgRef}
          className="absolute inset-0 bg-[#050505] rounded-[20px] pointer-events-none"
          style={{ willChange: 'transform' }}
        />

        {/* Layer 3: Portrait (Deep Parallax) */}
        <div 
          ref={portraitRef}
          className="absolute inset-0 rounded-[20px] overflow-hidden pointer-events-none bg-[#0a0a0a]"
          style={{ willChange: 'transform' }}
        >
          {entry.posterSrc ? (
            <img 
              src={entry.posterSrc} 
              alt={entry.winnerName}
              loading="lazy"
              className={`w-full h-full object-cover transition-all duration-1000 ${!isRevealed ? 'blur-3xl opacity-30' : 'opacity-90'}`}
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br from-[#1a1a1a] to-black transition-opacity duration-1000 ${!isRevealed ? 'opacity-50' : 'opacity-100'}`} />
          )}
          {/* Base gradient for text readability always fixed to portrait */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent opacity-90" />
        </div>

        {/* Layer 4: Glass Overlay */}
        <div 
          ref={glassRef}
          className="absolute inset-0 rounded-[20px] pointer-events-none mix-blend-screen"
          style={{ willChange: 'transform, background' }}
        />

        {/* Layer 5: Foil Reflection */}
        <div 
          ref={foilRef}
          className="absolute inset-0 rounded-[20px] pointer-events-none mix-blend-color-dodge"
          style={{ willChange: 'transform, background' }}
        />

        {/* Layer 6: Border Frame (Hidden but structural) */}
        <div 
          ref={borderRef}
          className="absolute inset-0 rounded-[20px] pointer-events-none"
          style={{ willChange: 'transform' }}
        />

        {/* Layer 7: Text Content */}
        <div 
          ref={textRef}
          className="absolute inset-0 flex flex-col justify-end p-6 pointer-events-none"
          style={{ willChange: 'transform' }}
        >
          {/* Revealed State Content */}
          <div 
            className="flex flex-col gap-1.5 transition-all duration-700 ease-out"
            style={{ 
              opacity: isRevealed ? 1 : 0, 
              transform: isRevealed ? 'translateY(0)' : 'translateY(20px)',
              pointerEvents: isRevealed ? 'auto' : 'none',
            }}
          >
            {entry.awardTitle && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-2 rounded-full bg-black/60 border border-[#D4AF37]/30 backdrop-blur-md w-fit shadow-lg shadow-black/50">
                <Trophy className="w-3 h-3 text-[#D4AF37]" />
                <span className="text-[#D4AF37] text-[10px] tracking-widest uppercase font-bold drop-shadow-md">
                  {entry.awardTitle}
                </span>
              </div>
            )}
            
            <h2 className="font-display text-2xl sm:text-3xl text-white drop-shadow-lg leading-tight mb-1">
              {entry.winnerName}
            </h2>
            
            {entry.category && (
              <p className="text-[#D4AF37] text-sm font-medium tracking-wide drop-shadow-md">
                {entry.category}
              </p>
            )}
            
            {entry.department && (
              <p className="text-white/70 text-[11px] tracking-wider uppercase mt-1 drop-shadow-md font-semibold">
                {entry.department}
              </p>
            )}
          </div>
          
          {/* Unrevealed State Content */}
          {!isRevealed && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 pointer-events-auto">
              <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center mb-6 text-4xl shadow-[0_0_30px_rgba(218,165,32,0.15)] backdrop-blur-sm">
                {entry.mysteryIcon || '🏆'}
              </div>
              <h3 className="font-display text-xl text-[#D4AF37] px-2 mb-8 drop-shadow-md">
                {entry.category || 'Mystery Award'}
              </h3>
              
              <div className="mt-auto flex flex-col items-center gap-2 text-[#D4AF37]/80 text-sm tracking-widest uppercase">
                {entry.revealAt ? (
                  timeLeft ? (
                    <>
                      <span className="text-[10px] opacity-70 mb-1">Revealing in</span>
                      <span className="font-mono text-[#D4AF37] font-bold text-xl drop-shadow-[0_0_15px_rgba(218,165,32,0.4)] tracking-normal">{timeLeft}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span className="animate-pulse">Revealed</span>
                    </>
                  )
                ) : (
                  <div className="flex items-center gap-2 hover:text-[#D4AF37] transition-colors bg-black/60 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
                    <Sparkles size={14} />
                    <span className="text-[10px] font-bold">Click to Reveal</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
