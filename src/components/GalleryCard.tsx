import { useEffect, useRef } from 'react';

export interface GalleryEntry {
  id: number;
  image: string;
}

interface GalleryCardProps {
  entry: GalleryEntry;
}

export function GalleryCard({ entry }: GalleryCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // DOM Refs for Layers
  const wrapperRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);
  const foilRef = useRef<HTMLDivElement>(null);
  const borderRef = useRef<HTMLDivElement>(null);

  const rafId = useRef<number | null>(null);

  // Physics State
  const mouseX = useRef({ val: 50, vel: 0, target: 50 });
  const mouseY = useRef({ val: 50, vel: 0, target: 50 });
  const hoverState = useRef({ val: 0, vel: 0, target: 0 }); // 0 to 1

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

  return (
    <div
      ref={cardRef}
      className="relative w-full max-w-[360px] aspect-[4/5] mx-auto z-10 cursor-pointer"
      style={{ perspective: '1200px' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
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
          <img 
            src={entry.image} 
            alt="Gallery item"
            loading="lazy"
            className="w-full h-full object-cover transition-all duration-1000 opacity-90"
          />
          {/* Base gradient for aesthetic enhancement */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/40 to-transparent opacity-90" />
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
          className="absolute inset-0 rounded-[20px] pointer-events-none border border-white/10"
          style={{ willChange: 'transform' }}
        />
      </div>
    </div>
  );
}
