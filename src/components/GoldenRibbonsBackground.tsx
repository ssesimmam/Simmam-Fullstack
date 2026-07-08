import React, { useEffect, useRef } from 'react'

export function GoldenRibbonsBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    let animationFrameId: number

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
    }
    
    window.addEventListener('resize', resize)
    resize()

    // Configuration
    const ribbons = [
      { yOffset: 0, amplitude: 100, speed: 0.001, color: 'rgba(212, 175, 55, 0.1)', width: 40, phase: 0 },
      { yOffset: 50, amplitude: 150, speed: 0.0015, color: 'rgba(255, 215, 0, 0.05)', width: 80, phase: Math.PI / 4 },
      { yOffset: -50, amplitude: 80, speed: 0.002, color: 'rgba(255, 140, 0, 0.15)', width: 20, phase: Math.PI / 2 },
      { yOffset: 20, amplitude: 120, speed: 0.0012, color: 'rgba(255, 255, 255, 0.08)', width: 10, phase: Math.PI },
      { yOffset: -80, amplitude: 200, speed: 0.0008, color: 'rgba(218, 165, 32, 0.07)', width: 100, phase: Math.PI * 1.5 }
    ]

    const particles: { x: number, y: number, vx: number, vy: number, size: number, life: number, maxLife: number }[] = []
    
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5 - 0.5,
        size: Math.random() * 3 + 1,
        life: Math.random() * 100,
        maxLife: Math.random() * 100 + 50
      })
    }

    let time = 0

    const draw = () => {
      time += 1
      
      // Clear with dark cinematic background
      ctx.fillStyle = '#050505'
      ctx.fillRect(0, 0, width, height)

      // Add a subtle radial gradient for volumetric glow
      const cx = width / 2
      const cy = height / 2
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height))
      gradient.addColorStop(0, 'rgba(40, 30, 10, 0.6)')
      gradient.addColorStop(1, 'rgba(5, 5, 5, 1)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)

      ctx.globalCompositeOperation = 'screen'

      // Draw ribbons
      ribbons.forEach(ribbon => {
        ctx.beginPath()
        ctx.moveTo(0, height / 2 + ribbon.yOffset)
        
        for (let x = 0; x < width; x += 20) {
          const y = height / 2 + ribbon.yOffset + 
            Math.sin(x * 0.003 + time * ribbon.speed + ribbon.phase) * ribbon.amplitude +
            Math.sin(x * 0.001 - time * ribbon.speed * 0.5) * (ribbon.amplitude * 0.5)
          ctx.lineTo(x, y)
        }
        
        ctx.strokeStyle = ribbon.color
        ctx.lineWidth = ribbon.width
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        
        // Add glow to ribbons
        ctx.shadowColor = 'rgba(212, 175, 55, 0.5)'
        ctx.shadowBlur = 30
        
        ctx.stroke()
      })

      // Draw particles (magical spark effect)
      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        p.life += 1

        if (p.x < 0 || p.x > width || p.y < 0 || p.y > height || p.life >= p.maxLife) {
          p.x = Math.random() * width
          p.y = height + 10
          p.vx = (Math.random() - 0.5) * 1.5
          p.vy = -Math.random() * 2 - 0.5
          p.life = 0
          p.maxLife = Math.random() * 100 + 100
          p.size = Math.random() * 3 + 1
        }

        const opacity = Math.sin((p.life / p.maxLife) * Math.PI)
        
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, ${200 + Math.random() * 55}, ${100 + Math.random() * 50}, ${opacity * 0.8})`
        
        ctx.shadowColor = 'rgba(255, 215, 0, 0.8)'
        ctx.shadowBlur = 10
        
        ctx.fill()
      })

      ctx.globalCompositeOperation = 'source-over'
      ctx.shadowBlur = 0
      
      animationFrameId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-black">
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
      />
      {/* Overlay to ensure contrast with foreground elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 mix-blend-multiply" />
      {/* Soft vignette */}
      <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.9)]" />
    </div>
  )
}
