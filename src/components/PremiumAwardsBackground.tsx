import React, { useEffect, useRef } from 'react';

export function PremiumAwardsBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let animationFrameId: number;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    
    window.addEventListener('resize', resize);
    resize();

    // Configuration for premium slow-moving dust particles
    const particles: { x: number, y: number, radius: number, speedX: number, speedY: number, phase: number }[] = [];
    const particleCount = 150; // Dense but subtle

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.2, // very tiny ambient dust
        speedX: (Math.random() - 0.5) * 0.15,
        speedY: (Math.random() - 0.5) * 0.15 - 0.1, // slowly floating up
        phase: Math.random() * Math.PI * 2,
      });
    }

    const draw = () => {
      // 1. Very deep charcoal background
      ctx.fillStyle = '#060606';
      ctx.fillRect(0, 0, width, height);

      // 2. Luxurious warm gold radial glow in the center (ambient light)
      const cx = width / 2;
      const cy = height / 2;
      const maxRadius = Math.max(width, height) * 0.8;
      
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius);
      gradient.addColorStop(0, 'rgba(45, 38, 20, 0.5)'); // Deep warm gold core
      gradient.addColorStop(0.4, 'rgba(15, 12, 10, 0.8)'); // Quick falloff
      gradient.addColorStop(1, '#020202'); // Pure dark edges
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 3. Draw subtle ambient particles (gold dust)
      ctx.globalCompositeOperation = 'screen';

      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.phase += 0.01; // twinkle speed

        // Wrap around screen
        if (p.y < -20) p.y = height + 20;
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;

        // Smooth twinkle effect
        const currentAlpha = (Math.sin(p.phase) + 1) / 2 * 0.7 + 0.1; // Range: 0.1 to 0.8
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(218, 165, 32, ${currentAlpha})`;
        ctx.fill();
        
        // Add tiny optical glow to slightly larger particles (simulates out-of-focus bokeh)
        if (p.radius > 1.2) {
          const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 5);
          glow.addColorStop(0, `rgba(218, 165, 32, ${currentAlpha * 0.3})`);
          glow.addColorStop(1, 'rgba(218, 165, 32, 0)');
          ctx.fillStyle = glow;
          ctx.fill();
        }
      });

      ctx.globalCompositeOperation = 'source-over';
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
      />
      {/* Deep vignette to focus all attention on the center card */}
      <div className="absolute inset-0 shadow-[inset_0_0_250px_rgba(0,0,0,1)]" />
      
      {/* High-end cinematic noise overlay */}
      <div 
        className="absolute inset-0 opacity-[0.035] mix-blend-screen pointer-events-none"
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }} 
      />
    </div>
  );
}
