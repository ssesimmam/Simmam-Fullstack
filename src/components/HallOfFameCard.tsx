import { useState, useEffect, useRef } from 'react';
import { type Award } from '@/api/admin/settings';
import { Sparkles, Trophy } from 'lucide-react';

interface HallOfFameCardProps {
  entry: Award;
}

// Custom physics spring updater
const updateSpring = (spring: { val: number; vel: number }, target: number, stiffness = 0.04, damping = 0.8) => {
  const force = (target - spring.val) * stiffness;
  spring.vel += force;
  spring.vel *= damping;
  spring.val += spring.vel;
  // Snap to target if very close to prevent endless micro-jitter
  if (Math.abs(spring.vel) < 0.001 && Math.abs(target - spring.val) < 0.001) {
    spring.val = target;
    spring.vel = 0;
  }
};

export function HallOfFameCard({ entry }: HallOfFameCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  
  // Element Refs
  const cardWrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const borderRef = useRef<HTMLDivElement>(null);
  const foilRef = useRef<HTMLDivElement>(null);
  const specularRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  
  const rafId = useRef<number | null>(null);

  // Targets (mouse position / interaction state)
  const isHovered = useRef(false);
  const targetTilt = useRef({ x: 0, y: 0 });
  const targetPos = useRef({ x: 50, y: 50 });
  const targetLift = useRef(0);

  // Current (Interpolated) State
  const currentTilt = useRef({ x: 0, y: 0, velX: 0, velY: 0 });
  const currentPos = useRef({ x: 50, y: 50, velX: 0, velY: 0 });
  const currentLift = useRef({ val: 0, vel: 0 });

  // Handle countdown timer for mystery reveal
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

  // Main 60FPS render loop
  const updateFrame = () => {
    if (!containerRef.current) return;

    // Physics constants (tuned for premium weight)
    const stiffness = 0.05;
    const damping = 0.75;

    // Run spring physics
    const tiltSpringX = { val: currentTilt.current.x, vel: currentTilt.current.velX };
    const tiltSpringY = { val: currentTilt.current.y, vel: currentTilt.current.velY };
    updateSpring(tiltSpringX, targetTilt.current.x, stiffness, damping);
    updateSpring(tiltSpringY, targetTilt.current.y, stiffness, damping);
    currentTilt.current.x = tiltSpringX.val;
    currentTilt.current.velX = tiltSpringX.vel;
    currentTilt.current.y = tiltSpringY.val;
    currentTilt.current.velY = tiltSpringY.vel;

    const posSpringX = { val: currentPos.current.x, vel: currentPos.current.velX };
    const posSpringY = { val: currentPos.current.y, vel: currentPos.current.velY };
    updateSpring(posSpringX, targetPos.current.x, stiffness, damping);
    updateSpring(posSpringY, targetPos.current.y, stiffness, damping);
    currentPos.current.x = posSpringX.val;
    currentPos.current.velX = posSpringX.vel;
    currentPos.current.y = posSpringY.val;
    currentPos.current.velY = posSpringY.vel;

    updateSpring(currentLift.current, targetLift.current, 0.06, 0.75);

    const l = currentLift.current.val; // 0 to 1
    const tx = currentTilt.current.x; // max +/- 10
    const ty = currentTilt.current.y; // max +/- 10
    const px = currentPos.current.x; // 0 to 100
    const py = currentPos.current.y; // 0 to 100

    // 1. Container: 3D Rotation & Lift
    const translateY = l * -10;
    containerRef.current.style.transform = `translateY(${translateY}px) rotateX(${tx}deg) rotateY(${ty}deg)`;

    // 2. Image Layer: Deep Parallax (approx 8-12px)
    if (imageRef.current) {
      // Opposite to tilt for depth, scaled to about 10px max movement
      imageRef.current.style.transform = `translateX(${ty * -1.2}px) translateY(${tx * 1.2}px) scale(1.05)`;
    }

    // 3. Content Layer: Medium Parallax (approx 4px)
    if (contentRef.current) {
      contentRef.current.style.transform = `translateX(${ty * -0.4}px) translateY(${tx * 0.4}px)`;
    }

    // 4. Border & Foil Layer (Animated Iridescent Reflection)
    if (borderRef.current) {
      borderRef.current.style.transform = `translateX(${ty * -0.2}px) translateY(${tx * 0.2}px)`;
      // Mix of soft gold, cyan, violet depending on mouse X/Y
      borderRef.current.style.background = `radial-gradient(circle at ${px}% ${py}%, rgba(255,255,255,0.6) 0%, rgba(218,165,32,0.5) 15%, rgba(176,224,230,0.3) 30%, rgba(238,130,238,0.2) 45%, transparent 60%)`;
      borderRef.current.style.opacity = `${l}`;
    }

    // 5. Foil Layer (Holographic Sheen)
    if (foilRef.current) {
      // Subtle conic sweep
      foilRef.current.style.background = `conic-gradient(from ${px * 3.6}deg at ${px}% ${py}%, rgba(218,165,32,0.06) 0deg, rgba(176,224,230,0.04) 120deg, rgba(238,130,238,0.05) 240deg, rgba(218,165,32,0.06) 360deg)`;
      foilRef.current.style.opacity = `${l * 0.8}`;
    }

    // 6. Specular Highlight (Glossy laminated plastic)
    if (specularRef.current) {
      specularRef.current.style.background = `radial-gradient(circle at ${px}% ${py}%, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 45%)`;
      specularRef.current.style.opacity = `${l}`;
    }

    // 7. Dynamic Shadow (Stretches based on rotation and lift)
    if (shadowRef.current) {
      // Shadow moves opposite to the card's tilt
      const shadowX = ty * 2;
      const shadowY = (tx * -2) + (l * 15);
      shadowRef.current.style.transform = `translateX(${shadowX}px) translateY(${shadowY}px)`;
      shadowRef.current.style.opacity = `${(l * 0.4) + 0.1}`; // Base 0.1, up to 0.5
      shadowRef.current.style.filter = `blur(${15 + (l * 15)}px)`; // Blurs out as it lifts
    }

    rafId.current = requestAnimationFrame(updateFrame);
  };

  useEffect(() => {
    rafId.current = requestAnimationFrame(updateFrame);
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardWrapperRef.current) return;
    const rect = cardWrapperRef.current.getBoundingClientRect();
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Percentage 0-100
    const px = (x / rect.width) * 100;
    const py = (y / rect.height) * 100;
    
    // Center based coords (-1 to 1)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Max rotation 10 degrees. X tilt is based on Y mouse pos.
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;
    
    targetTilt.current = { x: rotateX, y: rotateY };
    targetPos.current = { x: px, y: py };
    targetLift.current = 1;
    isHovered.current = true;
  };

  const handleMouseLeave = () => {
    targetTilt.current = { x: 0, y: 0 };
    targetPos.current = { x: 50, y: 50 };
    targetLift.current = 0;
    isHovered.current = false;
  };

  const handleManualReveal = () => {
    if (!entry.revealAt && !isRevealed) {
      setIsRevealed(true);
    }
  };

  const clickProps = !entry.revealAt && !isRevealed ? { onClick: handleManualReveal, style: { cursor: 'pointer' } } : {};

  return (
    <div
      ref={cardWrapperRef}
      className={`relative w-full max-w-[360px] aspect-[4/5] mx-auto z-10 ${!entry.revealAt && !isRevealed ? 'cursor-pointer' : ''}`}
      style={{
        perspective: '1200px',
        transformStyle: 'preserve-3d',
        ...clickProps.style
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={clickProps.onClick}
    >
      {/* 7. Shadow Layer (Moves opposite to card tilt) */}
      <div
        ref={shadowRef}
        className="absolute inset-4 -z-20 rounded-[20px] bg-black"
        style={{
          willChange: 'transform, opacity, filter',
        }}
      />

      {/* Main 3D Transform Container */}
      <div
        ref={containerRef}
        className="relative w-full h-full rounded-[20px] bg-[#0a0a0a] overflow-hidden"
        style={{
          transformStyle: 'preserve-3d',
          willChange: 'transform',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
        }}
      >
        {/* 4. Border Layer (Animated Iridescent Reflection) */}
        <div 
          ref={borderRef}
          className="absolute inset-[-1px] rounded-[20px] pointer-events-none"
          style={{ willChange: 'transform, opacity, background' }}
        />
        
        {/* Inner clip for images to not spill over rounded border edge */}
        <div className="absolute inset-[1px] rounded-[19px] overflow-hidden bg-[#050505]">
          
          {/* 2. Image Layer (Deep Parallax) */}
          <div 
            ref={imageRef}
            className="absolute inset-[-15px] pointer-events-none"
            style={{ willChange: 'transform' }}
          >
            {entry.posterSrc ? (
              <img 
                src={entry.posterSrc} 
                alt={entry.winnerName}
                loading="lazy"
                className={`w-full h-full object-cover transition-all duration-[1500ms] ease-out ${!isRevealed ? 'blur-3xl opacity-20' : 'opacity-90'}`}
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#000] transition-all ${!isRevealed ? 'opacity-50' : 'opacity-100'}`} />
            )}
            
            {/* Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none opacity-90" />
          </div>

          {/* 5. Holographic Foil Layer */}
          <div 
            ref={foilRef}
            className="absolute inset-0 pointer-events-none mix-blend-color-dodge"
            style={{ willChange: 'opacity, background' }}
          />

          {/* 6. Specular Highlight Layer (Glossy laminate) */}
          <div 
            ref={specularRef}
            className="absolute inset-0 pointer-events-none mix-blend-screen"
            style={{ willChange: 'opacity, background' }}
          />

          {/* 3. Content Layer (Medium Parallax) */}
          <div 
            ref={contentRef}
            className="absolute inset-0 flex flex-col justify-end p-6 z-10 pointer-events-none"
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
              {/* Badge */}
              {entry.awardTitle && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-2 rounded-full bg-black/40 border border-[#D4AF37]/30 backdrop-blur-md w-fit shadow-lg shadow-black/50">
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
                    <div className="flex items-center gap-2 hover:text-[#D4AF37] transition-colors bg-black/40 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
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
    </div>
  );
}
