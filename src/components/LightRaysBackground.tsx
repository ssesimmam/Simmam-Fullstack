import React, { useEffect, useRef } from 'react';

export interface LightRayOptions {
  rayCount: number;
  particleCount: number;
  brightness: number;
  spread: number;
  speed: number;
  originX: number; // 0 to 1 (percentage of screen width)
  originY: number; // 0 to 1 (percentage of screen height)
  rayLength: number; // multiplier of screen height
  ambientStrength: number;
  particleOpacity: number;
}

class Ray {
  angleBase: number;
  angleOffset: number = 0;
  width: number;
  length: number;
  opacityBase: number;
  color: string;
  speed: number;
  phase: number;

  constructor(options: LightRayOptions, canvasWidth: number, canvasHeight: number) {
    // Distribute angles evenly with some randomness within the spread
    const spreadRad = options.spread * (Math.PI / 180);
    this.angleBase = (Math.random() - 0.5) * spreadRad;
    
    // Width represents the X-scale of the radial gradient
    this.width = Math.random() * 120 + 40;
    
    // Length represents the Y-scale of the radial gradient
    this.length = (Math.random() * 0.5 + 1.0) * (canvasHeight * options.rayLength);
    
    this.opacityBase = (Math.random() * 0.04 + 0.02) * options.brightness;
    
    this.speed = (Math.random() * 0.003 + 0.001) * options.speed;
    this.phase = Math.random() * Math.PI * 2;
    
    const colors = [
      '255, 240, 190',
      '255, 225, 170',
      '255, 210, 140'
    ];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }

  update() {
    this.phase += this.speed;
    // Slow sway left and right
    this.angleOffset = Math.sin(this.phase) * (2 * Math.PI / 180);
  }

  draw(ctx: CanvasRenderingContext2D, originX: number, originY: number) {
    // Subtle breathing effect on opacity and width
    const currentOpacity = this.opacityBase * (0.7 + Math.sin(this.phase * 0.8) * 0.3);
    const currentWidth = this.width * (0.9 + Math.cos(this.phase * 0.5) * 0.1);
    
    ctx.save();
    ctx.translate(originX, originY);
    ctx.rotate(this.angleBase + this.angleOffset);
    // Stretch the coordinate space to form an elongated ellipse beam
    ctx.scale(currentWidth, this.length);
    
    // We create a standard radial gradient from center 0,0 with radius 1
    // Because of the scale(), this becomes a perfectly feathered long spotlight ray.
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    grad.addColorStop(0, `rgba(${this.color}, ${currentOpacity})`);
    grad.addColorStop(0.2, `rgba(${this.color}, ${currentOpacity * 0.7})`);
    grad.addColorStop(1, `rgba(${this.color}, 0)`);
    
    ctx.fillStyle = grad;
    // Draw only the bottom half where the ray shines downward
    ctx.fillRect(-1, 0, 2, 1);
    ctx.restore();
  }
}

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacityBase: number;
  phase: number;
  twinkleSpeed: number;

  constructor(width: number, height: number, options: LightRayOptions) {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.vx = (Math.random() - 0.5) * 0.2 * options.speed;
    this.vy = (Math.random() - 0.5) * 0.2 * options.speed - 0.1 * options.speed;
    this.size = Math.random() * 1.5 + 0.5;
    this.opacityBase = (Math.random() * 0.5 + 0.2) * options.particleOpacity;
    this.phase = Math.random() * Math.PI * 2;
    this.twinkleSpeed = (Math.random() * 0.02 + 0.01) * options.speed;
  }

  update(width: number, height: number) {
    this.x += this.vx;
    this.y += this.vy;
    this.phase += this.twinkleSpeed;

    // Seamless wrap around
    if (this.y < -20) this.y = height + 20;
    if (this.x < -20) this.x = width + 20;
    if (this.x > width + 20) this.x = -20;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const currentOpacity = this.opacityBase * (0.5 + Math.sin(this.phase) * 0.5);
    
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 235, 180, ${currentOpacity})`;
    ctx.fill();
    
    // Render soft bloom around larger particles
    if (this.size > 1.2) {
      const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 4);
      glow.addColorStop(0, `rgba(255, 235, 180, ${currentOpacity * 0.4})`);
      glow.addColorStop(1, 'rgba(255, 235, 180, 0)');
      ctx.fillStyle = glow;
      ctx.fill();
    }
  }
}

class LightRayEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  options: LightRayOptions;
  rays: Ray[] = [];
  particles: Particle[] = [];
  animationFrameId: number = 0;
  width: number = 0;
  height: number = 0;
  dpr: number = 1;

  constructor(canvas: HTMLCanvasElement, options: LightRayOptions) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!; // Optimize by disabling alpha on the base canvas
    this.options = options;
    
    this.resize = this.resize.bind(this);
    this.render = this.render.bind(this);
    
    window.addEventListener('resize', this.resize);
    this.resize();
    this.init();
    this.render();
  }

  init() {
    this.rays = [];
    for (let i = 0; i < this.options.rayCount; i++) {
      this.rays.push(new Ray(this.options, this.width, this.height));
    }
    
    this.particles = [];
    for (let i = 0; i < this.options.particleCount; i++) {
      this.particles.push(new Particle(this.width, this.height, this.options));
    }
  }

  resize() {
    this.dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    
    this.ctx.scale(this.dpr, this.dpr);
    
    // Re-calculate ray dimensions if the screen height changed dramatically
    if (this.rays.length > 0) {
      this.init();
    }
  }

  render() {
    // 1. Solid Deep Charcoal Background
    this.ctx.fillStyle = '#090909';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const originPxX = this.width * this.options.originX;
    const originPxY = this.height * this.options.originY;

    // 2. Ambient Haze / Bloom (Radial Gradient from origin)
    const haze = this.ctx.createRadialGradient(
      originPxX, originPxY, 0, 
      originPxX, originPxY, Math.max(this.width, this.height)
    );
    haze.addColorStop(0, `rgba(45, 35, 18, ${0.4 * this.options.ambientStrength})`);
    haze.addColorStop(0.5, `rgba(18, 14, 10, ${0.8 * this.options.ambientStrength})`);
    haze.addColorStop(1, '#090909');
    
    this.ctx.fillStyle = haze;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // 3. Render Light Rays with Additive Blending
    this.ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < this.rays.length; i++) {
      this.rays[i].update();
      this.rays[i].draw(this.ctx, originPxX, originPxY);
    }
    
    // 4. Render Dust Particles
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].update(this.width, this.height);
      this.particles[i].draw(this.ctx);
    }

    // Reset blend mode
    this.ctx.globalCompositeOperation = 'source-over';

    this.animationFrameId = requestAnimationFrame(this.render);
  }

  destroy() {
    window.removeEventListener('resize', this.resize);
    cancelAnimationFrame(this.animationFrameId);
  }
}

export function LightRaysBackground({ options }: { options?: Partial<LightRayOptions> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const defaultOptions: LightRayOptions = {
    rayCount: 35,
    particleCount: 100,
    brightness: 1.0,
    spread: 100, // Total angle spread in degrees
    speed: 1.0,
    originX: 0.5, // Center X
    originY: -0.1, // Slightly above the top of the screen
    rayLength: 1.3, // Reaches past the bottom of the screen
    ambientStrength: 1.0,
    particleOpacity: 1.0,
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const engine = new LightRayEngine(canvasRef.current, { ...defaultOptions, ...options });
    
    return () => {
      engine.destroy();
    };
  }, [options]);

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-[#090909]">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
