import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Sparkles, ChevronLeft, ChevronRight, Lock, Eye, X, Music2 } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { getPublicCulturalsSettings, type PublicCulturalsSettings, type CulturalsArtist } from '@/api/admin/settings'

export const Route = createFileRoute('/culturals')({
  head: () => ({
    meta: [
      { title: 'Culturals — SIMMAM 2026' },
      { name: 'description', content: 'Cultural Night at SIMMAM 2026 — artist reveals, games, and the grandest celebration at SIMATS Engineering.' },
    ],
  }),
  component: CulturalsPage,
})

/* ─── Floating Particle ─────────────────────────────── */
function Particle({ style }: { style: React.CSSProperties }) {
  return <div className="c-particle" style={style} />
}

/* ─── Intersection Observer Hook ────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

/* ─── Animated Section Wrapper ──────────────────────── */
function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      className={`c-fadein ${inView ? 'c-fadein--visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

/* ─── Artist Carousel ───────────────────────────────── */
function CinematicCarousel({ artists, title }: { artists: CulturalsArtist[]; title?: string }) {
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set())
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightbox, setLightbox] = useState<CulturalsArtist | null>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  const sorted = [...artists].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const isRevealed = (a: CulturalsArtist) => a.revealed || revealedIds.has(a.id)

  const scrollTo = (idx: number) => {
    const clamped = Math.max(0, Math.min(idx, sorted.length - 1))
    setActiveIndex(clamped)
    const card = trackRef.current?.children[clamped] as HTMLElement | undefined
    card?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }

  const handleCardClick = (artist: CulturalsArtist, i: number) => {
    setActiveIndex(i)
    if (isRevealed(artist)) {
      if (artist.imageUrl) setLightbox(artist)
    } else {
      setRevealedIds(prev => new Set([...prev, artist.id]))
      if (artist.imageUrl) setTimeout(() => setLightbox(artist), 400)
    }
  }

  if (sorted.length === 0) {
    return (
      <div className="c-empty-artists">
        <div className="c-empty-icon"><Music2 /></div>
        <p>Artists will be announced soon…</p>
      </div>
    )
  }

  return (
    <>
      <div className="c-carousel-wrap">
        {sorted.length > 1 && (
          <>
            <button className="c-arr c-arr--l" onClick={() => scrollTo(activeIndex - 1)} disabled={activeIndex === 0} aria-label="Previous">
              <ChevronLeft />
            </button>
            <button className="c-arr c-arr--r" onClick={() => scrollTo(activeIndex + 1)} disabled={activeIndex === sorted.length - 1} aria-label="Next">
              <ChevronRight />
            </button>
          </>
        )}

        <div className="c-track" ref={trackRef}>
          {sorted.map((artist, i) => {
            const rev = isRevealed(artist)
            return (
              <div
                key={artist.id}
                className={`c-acard ${i === activeIndex ? 'c-acard--active' : ''} ${rev ? 'c-acard--revealed' : ''}`}
                onClick={() => handleCardClick(artist, i)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && handleCardClick(artist, i)}
              >
                {/* Spinning gold border */}
                <div className={`c-acard-ring ${rev ? 'ring--gold' : 'ring--mystery'}`} />

                <div className="c-acard-inner">
                  {artist.imageUrl && (
                    <div
                      className={`c-acard-bg ${rev ? 'c-acard-bg--visible' : 'c-acard-bg--blur'}`}
                      style={{ backgroundImage: `url(${artist.imageUrl})` }}
                    />
                  )}

                  {/* Dark gradient */}
                  <div className={`c-acard-grad ${rev ? 'grad--reveal' : 'grad--mystery'}`} />

                  {rev ? (
                    <div className="c-acard-revealed">
                      <div className="c-revealed-badge"><Sparkles size={10} /> REVEALED</div>
                      <div className="c-acard-info">
                        {artist.name && <h3 className="c-acard-name">{artist.name}</h3>}
                        {artist.description && <p className="c-acard-desc">{artist.description}</p>}
                        {artist.imageUrl && (
                          <div className="c-view-hint"><Eye size={12} /> Click to view</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="c-acard-mystery">
                      <div className="c-mystery-orb">
                        <Lock size={22} className="c-mystery-icon" />
                        <div className="c-mystery-ring1" />
                        <div className="c-mystery-ring2" />
                      </div>
                      <span className="c-mystery-label">ARTIST #{String(i + 1).padStart(2, '0')}</span>
                      <span className="c-mystery-hint"><Eye size={11} /> Tap to reveal</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {sorted.length > 1 && (
          <div className="c-dots">
            {sorted.map((_, i) => (
              <button key={i} className={`c-dot ${i === activeIndex ? 'c-dot--active' : ''}`} onClick={() => scrollTo(i)} />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="c-lb-backdrop" onClick={() => setLightbox(null)} role="dialog" aria-modal="true">
          <div className="c-lb-panel" onClick={e => e.stopPropagation()}>
            <button className="c-lb-close" onClick={() => setLightbox(null)}><X size={18} /></button>
            <div className="c-lb-glow" />
            <div className="c-lb-header">
              <span className="c-lb-eye"><Sparkles size={12} />{title || 'CULTURAL NIGHT'}</span>
              {lightbox.name && <h2 className="c-lb-name">{lightbox.name}</h2>}
              {lightbox.description && <p className="c-lb-desc">{lightbox.description}</p>}
            </div>
            {lightbox.imageUrl && (
              <div className="c-lb-img-wrap">
                <img src={lightbox.imageUrl} alt={lightbox.name} className="c-lb-img" />
              </div>
            )}
            {sorted.length > 1 && (
              <div className="c-lb-thumbs">
                {sorted.map(a => {
                  const rev = isRevealed(a)
                  return (
                    <button
                      key={a.id}
                      className={`c-lb-thumb ${lightbox.id === a.id ? 'c-lb-thumb--active' : ''} ${!rev ? 'c-lb-thumb--locked' : ''}`}
                      onClick={() => rev && a.imageUrl && setLightbox(a)}
                    >
                      {a.imageUrl && rev
                        ? <img src={a.imageUrl} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <Lock size={11} />
                      }
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

/* ─── Main Page ─────────────────────────────────────── */
function CulturalsPage() {
  const [settings, setSettings] = useState<PublicCulturalsSettings>({})
  const [loading, setLoading] = useState(true)
  const mouseGlowRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])
  const rippleId = useRef(0)

  /* Mouse glow tracking */
  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!mouseGlowRef.current) return
    mouseGlowRef.current.style.transform = `translate(${e.clientX - 300}px, ${e.clientY - 300}px)`
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [onMouseMove])

  /* Parallax hero */
  useEffect(() => {
    const onScroll = () => {
      if (!heroRef.current) return
      const y = window.scrollY
      heroRef.current.style.transform = `translateY(${y * 0.28}px)`
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* Load settings */
  useEffect(() => {
    getPublicCulturalsSettings()
      .then(setSettings)
      .catch(() => setSettings({}))
      .finally(() => setLoading(false))
  }, [])

  /* CTA ripple */
  const handleCtaClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = ++rippleId.current
    setRipples(prev => [...prev, { id, x, y }])
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 700)
  }

  const pageTitle = settings.culturalsTitle || 'Cultural Night'
  const artists = settings.culturalsArtists || []

  /* Generate stable particles */
  const particles = Array.from({ length: 28 }, (_, i) => ({
    left: `${(i * 37.3 + 11) % 100}%`,
    top: `${(i * 53.7 + 7) % 100}%`,
    animationDelay: `${(i * 0.7) % 6}s`,
    animationDuration: `${6 + (i * 1.3) % 8}s`,
    width: `${2 + (i * 0.9) % 3}px`,
    height: `${2 + (i * 0.9) % 3}px`,
    opacity: 0.15 + (i * 0.03) % 0.35,
  }))

  return (
    <div className="c-root">
      {/* ── Mouse glow ── */}
      <div ref={mouseGlowRef} className="c-mouse-glow" aria-hidden="true" />

      {/* ── Vignette ── */}
      <div className="c-vignette" aria-hidden="true" />

      {/* ── Noise texture ── */}
      <div className="c-noise" aria-hidden="true" />

      <Navbar />

      <main>

        {/* ══════════════════════════════════
            HERO
        ══════════════════════════════════ */}
        <section className="c-hero">
          {/* Parallax layer */}
          <div ref={heroRef} className="c-hero-parallax" aria-hidden="true">
            {/* Ambient glows */}
            <div className="c-glow c-glow--gold-top" />
            <div className="c-glow c-glow--red-left" />
            <div className="c-glow c-glow--purple-right" />

            {/* Fog layers */}
            <div className="c-fog c-fog--1" />
            <div className="c-fog c-fog--2" />

            {/* Particles */}
            <div className="c-particles-layer">
              {particles.map((p, i) => (
                <Particle key={i} style={p} />
              ))}
            </div>
          </div>

          {/* Hero content */}
          <div className="c-hero-content">
            {/* Eyebrow */}
            <div className="c-hero-eyebrow">
              <span className="c-live-dot" />
              <span>SIMMAM 2026 · CULTURALS</span>
            </div>

            {/* Main heading */}
            <h1 className="c-hero-h1">
              {loading ? (
                <span className="c-skeleton-h1" />
              ) : (
                <>
                  {pageTitle.split(' ').map((word, i) => (
                    <span
                      key={i}
                      className="c-hero-word"
                      style={{ animationDelay: `${i * 120}ms` }}
                    >
                      {word}{' '}
                    </span>
                  ))}
                </>
              )}
            </h1>

            {/* Subtitle */}
            <p className="c-hero-sub">
              The grandest night of SIMMAM 2026. Music, culture,&nbsp;and the unforgettable reveal.
            </p>

            {/* CTA row */}
            <div className="c-hero-cta-row">
              <button className="c-cta-btn" onClick={handleCtaClick}>
                {ripples.map(r => (
                  <span key={r.id} className="c-ripple" style={{ left: r.x, top: r.y }} />
                ))}
                <span className="c-cta-glow" />
                <Sparkles size={16} />
                <span>Discover Artists</span>
              </button>

              <div className="c-hero-scroll-hint">
                <div className="c-scroll-mouse"><div className="c-scroll-wheel" /></div>
                <span>Scroll to explore</span>
              </div>
            </div>

            {/* Decorative divider */}
            <div className="c-hero-divider">
              <div className="c-divider-line" />
              <div className="c-divider-diamond" />
              <div className="c-divider-line" />
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════
            ARTIST REVEAL SECTION
        ══════════════════════════════════ */}
        <section className="c-section c-section--artists">
          <div className="c-section-glow c-section-glow--artists" />

          <div className="c-container">
            <FadeIn>
              <div className="c-section-header">
                <span className="c-section-eyebrow">
                  <Music2 size={12} />
                  HEADLINE ARTISTS
                </span>
                <h2 className="c-section-h2">Meet the Artists</h2>
                <p className="c-section-p">
                  Each card hides a star. Click to reveal — but remember,<br />
                  once unveiled, the magic is real.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={120}>
              {loading ? (
                <div className="c-skeleton-cards">
                  {[1, 2, 3].map(n => <div key={n} className="c-skeleton-card" />)}
                </div>
              ) : (
                <CinematicCarousel artists={artists} title={pageTitle} />
              )}
            </FadeIn>
          </div>
        </section>



      </main>

      <Footer />

      {/* ══ ALL SCOPED STYLES ══════════════════════════════════════ */}
      <style>{`
        /* ── Root & Background ──────────────────────────────────── */
        .c-root {
          position: relative;
          min-height: 100vh;
          overflow-x: hidden;
          background: #090909;
          color: #f5f0e8;
          font-family: 'Outfit', 'Inter', system-ui, sans-serif;
        }

        /* Mouse glow */
        .c-mouse-glow {
          position: fixed;
          top: 0; left: 0;
          width: 600px; height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,213,74,0.04) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
          transition: transform 0.12s linear;
          will-change: transform;
        }

        /* Vignette */
        .c-vignette {
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.75) 100%);
          pointer-events: none;
          z-index: 1;
        }

        /* Noise texture */
        .c-noise {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 2;
          opacity: 0.028;
          mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 128px 128px;
        }

        /* ── Hero ──────────────────────────────────────────────── */
        .c-hero {
          position: relative;
          min-height: 100svh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          overflow: hidden;
          padding: 120px 24px 80px;
        }

        /* Parallax background layer */
        .c-hero-parallax {
          position: absolute;
          inset: -20%;
          will-change: transform;
          pointer-events: none;
          z-index: 0;
        }

        /* Ambient glows */
        .c-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }
        .c-glow--gold-top {
          top: -10%;
          left: 50%;
          transform: translateX(-50%);
          width: 70%;
          height: 50%;
          background: radial-gradient(ellipse, rgba(255,213,74,0.14) 0%, transparent 70%);
          animation: glow-breathe 8s ease-in-out infinite;
        }
        .c-glow--red-left {
          bottom: 10%;
          left: -5%;
          width: 45%;
          height: 60%;
          background: radial-gradient(ellipse, rgba(180,30,30,0.18) 0%, transparent 70%);
          animation: glow-breathe 10s ease-in-out infinite reverse;
        }
        .c-glow--purple-right {
          top: 20%;
          right: -10%;
          width: 40%;
          height: 50%;
          background: radial-gradient(ellipse, rgba(120,40,160,0.12) 0%, transparent 70%);
          animation: glow-breathe 12s ease-in-out infinite 2s;
        }
        @keyframes glow-breathe {
          0%,100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.15); }
        }

        /* Fog layers */
        .c-fog {
          position: absolute;
          bottom: 0;
          left: -10%;
          right: -10%;
          height: 35%;
          border-radius: 50%;
          pointer-events: none;
        }
        .c-fog--1 {
          background: radial-gradient(ellipse at bottom, rgba(255,213,74,0.04) 0%, transparent 70%);
          animation: fog-drift 15s ease-in-out infinite;
        }
        .c-fog--2 {
          background: radial-gradient(ellipse at bottom, rgba(0,0,0,0.3) 0%, transparent 60%);
          animation: fog-drift 20s ease-in-out infinite reverse;
        }
        @keyframes fog-drift {
          0%,100% { transform: translateX(0) scaleX(1); }
          50% { transform: translateX(3%) scaleX(1.05); }
        }

        /* Particles layer */
        .c-particles-layer {
          position: absolute;
          inset: 0;
        }
        .c-particle {
          position: absolute;
          border-radius: 50%;
          background: #FFD54A;
          animation: particle-float 8s ease-in-out infinite;
        }
        @keyframes particle-float {
          0%,100% { transform: translateY(0) translateX(0); opacity: 0.15; }
          33% { transform: translateY(-30px) translateX(10px); opacity: 0.4; }
          66% { transform: translateY(-15px) translateX(-8px); opacity: 0.2; }
        }

        /* Hero content */
        .c-hero-content {
          position: relative;
          z-index: 10;
          max-width: 860px;
          width: 100%;
          margin: 0 auto;
        }

        .c-hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.45em;
          text-transform: uppercase;
          color: #FFD54A;
          margin-bottom: 28px;
          padding: 7px 18px;
          border: 1px solid rgba(255,213,74,0.2);
          border-radius: 100px;
          background: rgba(255,213,74,0.05);
          backdrop-filter: blur(8px);
          animation: fade-up 0.8s cubic-bezier(0.2,0.8,0.2,1) both;
        }
        .c-live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #ff4444;
          box-shadow: 0 0 6px #ff4444;
          animation: live-pulse 1.5s ease-in-out infinite;
          flex-shrink: 0;
        }
        @keyframes live-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

        .c-hero-h1 {
          font-family: 'Cinzel', 'Playfair Display', serif;
          font-size: clamp(3rem, 9vw, 7rem);
          font-weight: 900;
          line-height: 1.0;
          letter-spacing: 0.02em;
          color: transparent;
          background: linear-gradient(
            160deg,
            #fff8e6 0%,
            #FFD54A 30%,
            #e8b830 55%,
            #FFD54A 75%,
            #fffaed 100%
          );
          background-size: 200% 200%;
          -webkit-background-clip: text;
          background-clip: text;
          animation: shimmer-hero 5s linear infinite;
          margin-bottom: 28px;
          text-shadow: none;
          filter: drop-shadow(0 0 60px rgba(255,213,74,0.25));
        }
        @keyframes shimmer-hero {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        .c-hero-word {
          display: inline-block;
          animation: word-rise 0.7s cubic-bezier(0.2,0.8,0.2,1) both;
        }
        @keyframes word-rise {
          from { opacity: 0; transform: translateY(40px) blur(8px); filter: blur(8px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }

        .c-skeleton-h1 {
          display: block;
          height: clamp(3rem, 9vw, 7rem);
          border-radius: 12px;
          background: linear-gradient(90deg, rgba(255,213,74,0.06) 0%, rgba(255,213,74,0.12) 50%, rgba(255,213,74,0.06) 100%);
          background-size: 200% 100%;
          animation: skel-shimmer 1.5s linear infinite;
          max-width: 600px;
          margin: 0 auto;
        }
        @keyframes skel-shimmer { to { background-position: -200% 0; } }

        .c-hero-sub {
          font-size: clamp(0.95rem, 2vw, 1.15rem);
          line-height: 1.75;
          color: rgba(245,240,232,0.55);
          max-width: 520px;
          margin: 0 auto 40px;
          animation: fade-up 0.8s cubic-bezier(0.2,0.8,0.2,1) 0.2s both;
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .c-hero-cta-row {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          animation: fade-up 0.8s cubic-bezier(0.2,0.8,0.2,1) 0.35s both;
        }

        /* ── Premium CTA Button ───── */
        .c-cta-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 16px 44px;
          border-radius: 100px;
          font-family: 'Cinzel', serif;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #090909;
          background: linear-gradient(135deg, #FFD54A, #f0be1e, #FFD54A);
          background-size: 200% 100%;
          border: none;
          cursor: pointer;
          overflow: hidden;
          transition: transform 0.35s cubic-bezier(0.2,0.8,0.2,1), box-shadow 0.35s ease, background-position 0.6s ease;
          box-shadow:
            0 0 30px rgba(255,213,74,0.35),
            0 8px 32px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(255,255,255,0.25);
        }
        .c-cta-btn:hover {
          transform: translateY(-4px) scale(1.04);
          background-position: 100% 0;
          box-shadow:
            0 0 60px rgba(255,213,74,0.6),
            0 20px 48px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(255,255,255,0.3);
        }
        .c-cta-btn:active { transform: translateY(-1px) scale(0.98); }
        .c-cta-glow {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(circle at 50% 0%, rgba(255,255,255,0.35), transparent 65%);
          pointer-events: none;
        }
        /* Ripple */
        .c-ripple {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255,255,255,0.5);
          transform: translate(-50%, -50%) scale(0);
          animation: ripple-expand 0.7s cubic-bezier(0.2,0.8,0.2,1) forwards;
          pointer-events: none;
        }
        @keyframes ripple-expand {
          to { transform: translate(-50%, -50%) scale(80); opacity: 0; }
        }

        /* Scroll hint */
        .c-hero-scroll-hint {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          font-size: 0.6rem;
          letter-spacing: 0.2em;
          color: rgba(255,213,74,0.4);
          text-transform: uppercase;
        }
        .c-scroll-mouse {
          width: 22px;
          height: 34px;
          border: 1.5px solid rgba(255,213,74,0.25);
          border-radius: 11px;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 5px;
        }
        .c-scroll-wheel {
          width: 3px;
          height: 7px;
          background: #FFD54A;
          border-radius: 2px;
          animation: scroll-wheel 2s ease-in-out infinite;
          opacity: 0.6;
        }
        @keyframes scroll-wheel {
          0%,100% { transform: translateY(0); opacity: 0.6; }
          50% { transform: translateY(6px); opacity: 0.2; }
        }

        /* Decorative divider */
        .c-hero-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          max-width: 280px;
          margin: 40px auto 0;
          opacity: 0.25;
        }
        .c-divider-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, #FFD54A, transparent);
        }
        .c-divider-diamond {
          width: 6px;
          height: 6px;
          background: #FFD54A;
          transform: rotate(45deg);
          flex-shrink: 0;
        }

        /* ── FadeIn Transition ─────────────────────────────────── */
        .c-fadein {
          opacity: 0;
          transform: translateY(32px);
          filter: blur(4px);
          transition:
            opacity 0.75s cubic-bezier(0.2,0.8,0.2,1),
            transform 0.75s cubic-bezier(0.2,0.8,0.2,1),
            filter 0.75s cubic-bezier(0.2,0.8,0.2,1);
        }
        .c-fadein--visible {
          opacity: 1;
          transform: translateY(0);
          filter: blur(0);
        }

        /* ── Sections ──────────────────────────────────────────── */
        .c-section {
          position: relative;
          padding: 80px 0;
        }
        .c-section--artists { padding: 60px 0 80px; }

        .c-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 28px;
        }

        /* Section ambient glow */
        .c-section-glow {
          position: absolute;
          pointer-events: none;
          border-radius: 50%;
          filter: blur(120px);
        }
        .c-section-glow--artists {
          top: -100px;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          height: 300px;
          background: radial-gradient(ellipse, rgba(255,213,74,0.06) 0%, transparent 70%);
        }

        /* Section header */
        .c-section-header {
          text-align: center;
          margin-bottom: 52px;
        }
        .c-section-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.38em;
          text-transform: uppercase;
          color: #FFD54A;
          margin-bottom: 16px;
          opacity: 0.8;
        }
        .c-section-h2 {
          font-family: 'Cinzel', 'Playfair Display', serif;
          font-size: clamp(1.8rem, 4vw, 3rem);
          font-weight: 800;
          letter-spacing: 0.04em;
          color: transparent;
          background: linear-gradient(135deg, #fffaed, #FFD54A 50%, #e0a810);
          -webkit-background-clip: text;
          background-clip: text;
          margin-bottom: 14px;
          line-height: 1.15;
        }
        .c-section-p {
          font-size: 0.9rem;
          line-height: 1.75;
          color: rgba(245,240,232,0.45);
          max-width: 480px;
          margin: 0 auto;
        }

        /* ── Artist Carousel ───────────────────────────────────── */
        .c-carousel-wrap {
          position: relative;
          width: 100%;
        }

        .c-track {
          display: flex;
          gap: 20px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scroll-behavior: smooth;
          padding: 16px 4px 32px;
          scrollbar-width: none;
        }
        .c-track::-webkit-scrollbar { display: none; }

        /* Arrow buttons */
        .c-arr {
          position: absolute;
          top: 50%;
          transform: translateY(-60%);
          z-index: 20;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(9,9,9,0.85);
          border: 1px solid rgba(255,213,74,0.22);
          color: #FFD54A;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
          backdrop-filter: blur(12px);
          box-shadow: 0 0 0 0 rgba(255,213,74,0);
        }
        .c-arr:hover { background: rgba(30,28,20,0.9); border-color: rgba(255,213,74,0.5); box-shadow: 0 0 20px rgba(255,213,74,0.2); }
        .c-arr:disabled { opacity: 0.25; pointer-events: none; }
        .c-arr--l { left: -22px; }
        .c-arr--r { right: -22px; }
        @media (max-width: 640px) {
          .c-arr--l { left: 4px; }
          .c-arr--r { right: 4px; }
        }

        /* Artist card */
        .c-acard {
          flex-shrink: 0;
          width: clamp(210px, 28vw, 270px);
          aspect-ratio: 3/4;
          position: relative;
          border-radius: 22px;
          cursor: pointer;
          scroll-snap-align: center;
          outline: none;
          transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s;
          opacity: 0.55;
        }
        .c-acard:hover, .c-acard--active { transform: translateY(-8px) scale(1.05); opacity: 1; }
        .c-acard:active { transform: scale(0.97); }

        /* Spinning ring */
        .c-acard-ring {
          position: absolute;
          inset: -3px;
          border-radius: 25px;
          z-index: 0;
        }
        .ring--mystery {
          background: conic-gradient(from 0deg, #FFD54A 0%, #a855f7 40%, #8b1a1a 70%, #FFD54A 100%);
          animation: ring-spin 5s linear infinite;
          opacity: 0.5;
        }
        .c-acard:hover .ring--mystery, .c-acard--active .ring--mystery { opacity: 1; }
        .ring--gold {
          background: conic-gradient(from 0deg, #FFD54A, #fff8d0, #e0a810, #FFD54A);
          animation: ring-spin 7s linear infinite;
          opacity: 0.85;
          box-shadow: 0 0 20px rgba(255,213,74,0.4);
        }
        @keyframes ring-spin { to { transform: rotate(360deg); } }

        .c-acard-inner {
          position: absolute;
          inset: 2px;
          border-radius: 20px;
          overflow: hidden;
          background: #0d0c09;
          z-index: 1;
        }

        .c-acard-bg {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center top;
          transition: filter 1s ease, transform 0.5s ease;
        }
        .c-acard-bg--blur { filter: blur(22px) brightness(0.2) saturate(0.3); }
        .c-acard-bg--visible { filter: none; }
        .c-acard:hover .c-acard-bg--visible { transform: scale(1.04); }

        .c-acard-grad {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .grad--mystery { background: radial-gradient(ellipse at center, rgba(20,16,5,0.82), rgba(9,9,9,0.92)); }
        .grad--reveal { background: linear-gradient(to top, rgba(9,9,9,0.92) 0%, rgba(9,9,9,0.3) 45%, transparent 70%); }

        /* Mystery state */
        .c-acard-mystery {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          z-index: 2;
        }
        .c-mystery-orb {
          position: relative;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(255,213,74,0.08);
          border: 1.5px solid rgba(255,213,74,0.3);
        }
        .c-mystery-icon { color: #FFD54A; }
        .c-mystery-ring1 {
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          border: 1px solid rgba(255,213,74,0.2);
          animation: ping-out 2.5s ease-out infinite;
        }
        .c-mystery-ring2 {
          position: absolute;
          inset: -16px;
          border-radius: 50%;
          border: 1px solid rgba(255,213,74,0.1);
          animation: ping-out 2.5s ease-out infinite 0.6s;
        }
        @keyframes ping-out { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(1.4); opacity: 0; } }
        .c-mystery-label {
          font-family: 'Cinzel', serif;
          font-size: 0.55rem;
          letter-spacing: 0.35em;
          color: #FFD54A;
          font-weight: 700;
          text-transform: uppercase;
        }
        .c-mystery-hint {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.62rem;
          color: rgba(255,213,74,0.5);
          letter-spacing: 0.06em;
          animation: hint-blink 3s ease-in-out infinite;
          margin-top: 6px;
        }
        @keyframes hint-blink { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }

        /* Revealed state */
        .c-acard-revealed {
          position: absolute;
          inset: 0;
          z-index: 2;
          display: flex;
          flex-direction: column;
        }
        .c-revealed-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(9,9,9,0.82);
          border: 1px solid rgba(255,213,74,0.35);
          border-radius: 20px;
          padding: 3px 9px;
          font-size: 0.48rem;
          letter-spacing: 0.22em;
          color: #FFD54A;
          font-weight: 700;
          backdrop-filter: blur(8px);
          font-family: 'Cinzel', serif;
        }
        .c-acard-info {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 30px 14px 14px;
        }
        .c-acard-name {
          font-family: 'Cinzel', serif;
          font-size: clamp(0.8rem, 2vw, 0.95rem);
          font-weight: 700;
          color: #fff;
          text-shadow: 0 2px 12px rgba(0,0,0,0.8);
          line-height: 1.25;
          letter-spacing: 0.04em;
        }
        .c-acard-desc {
          font-size: 0.65rem;
          color: rgba(255,213,74,0.7);
          margin-top: 3px;
          line-height: 1.4;
        }
        .c-view-hint {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.58rem;
          color: rgba(255,255,255,0.5);
          letter-spacing: 0.08em;
          margin-top: 6px;
        }

        /* Dot nav */
        .c-dots {
          display: flex;
          justify-content: center;
          gap: 7px;
          padding-top: 4px;
        }
        .c-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: rgba(255,213,74,0.2);
          border: none;
          cursor: pointer;
          transition: width 0.35s ease, background 0.35s ease;
        }
        .c-dot--active {
          width: 22px;
          border-radius: 3px;
          background: #FFD54A;
        }

        /* Empty state */
        .c-empty-artists {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 64px 20px;
          gap: 14px;
          text-align: center;
        }
        .c-empty-icon {
          width: 64px;
          height: 64px;
          border-radius: 18px;
          border: 1px dashed rgba(255,213,74,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,213,74,0.3);
        }
        .c-empty-artists p {
          font-size: 0.85rem;
          color: rgba(245,240,232,0.3);
        }

        /* Skeleton cards */
        .c-skeleton-cards {
          display: flex;
          gap: 20px;
          padding: 16px 4px 32px;
          overflow: hidden;
        }
        .c-skeleton-card {
          flex-shrink: 0;
          width: clamp(210px, 28vw, 270px);
          aspect-ratio: 3/4;
          border-radius: 22px;
          background: linear-gradient(90deg, rgba(255,213,74,0.05) 0%, rgba(255,213,74,0.09) 50%, rgba(255,213,74,0.05) 100%);
          background-size: 200% 100%;
          animation: skel-shimmer 1.6s linear infinite;
          border: 1px solid rgba(255,213,74,0.06);
        }

        /* ── Lightbox ──────────────────────────────────────────── */
        .c-lb-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(5,4,3,0.94);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          backdrop-filter: blur(18px) saturate(140%);
          animation: fade-in-lb 0.3s ease;
        }
        @keyframes fade-in-lb { from { opacity: 0; } to { opacity: 1; } }

        .c-lb-panel {
          position: relative;
          max-width: 480px;
          width: 100%;
          max-height: 92vh;
          overflow-y: auto;
          background: #0f0e0b;
          border: 1px solid rgba(255,213,74,0.22);
          border-radius: 28px;
          box-shadow:
            0 0 100px rgba(255,213,74,0.18),
            0 0 250px rgba(255,213,74,0.07),
            0 40px 80px rgba(0,0,0,0.7);
          animation: panel-pop-lb 0.45s cubic-bezier(0.34,1.56,0.64,1);
          scrollbar-width: none;
        }
        .c-lb-panel::-webkit-scrollbar { display: none; }
        @keyframes panel-pop-lb {
          from { opacity: 0; transform: scale(0.83) translateY(24px); }
          to { opacity: 1; transform: none; }
        }
        .c-lb-glow {
          position: absolute;
          top: -60px;
          left: 50%;
          transform: translateX(-50%);
          width: 300px;
          height: 200px;
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(255,213,74,0.12), transparent 70%);
          pointer-events: none;
        }
        .c-lb-close {
          position: sticky;
          top: 14px;
          float: right;
          margin: 14px 14px 0 0;
          z-index: 10;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(20,18,12,0.9);
          border: 1px solid rgba(255,213,74,0.18);
          color: rgba(245,240,232,0.7);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s, transform 0.25s;
        }
        .c-lb-close:hover { color: #FFD54A; transform: rotate(90deg); }
        .c-lb-header {
          padding: 20px 24px 14px;
          clear: both;
          text-align: center;
        }
        .c-lb-eye {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.56rem;
          letter-spacing: 0.38em;
          color: #FFD54A;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 10px;
          font-family: 'Cinzel', serif;
          opacity: 0.8;
        }
        .c-lb-name {
          font-family: 'Cinzel', 'Playfair Display', serif;
          font-size: clamp(1.3rem, 4vw, 1.9rem);
          font-weight: 900;
          background: linear-gradient(135deg, #fffaed, #FFD54A 50%, #c89010);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          line-height: 1.2;
          letter-spacing: 0.05em;
          display: block;
        }
        .c-lb-desc {
          font-size: 0.82rem;
          color: rgba(255,213,74,0.55);
          margin-top: 7px;
          line-height: 1.6;
        }
        .c-lb-img-wrap { padding: 0 16px 14px; }
        .c-lb-img {
          width: 100%;
          border-radius: 18px;
          object-fit: cover;
          max-height: 56vh;
          display: block;
          box-shadow: 0 12px 50px rgba(0,0,0,0.65), 0 0 40px rgba(255,213,74,0.08);
        }
        .c-lb-thumbs {
          display: flex;
          gap: 8px;
          justify-content: center;
          padding: 0 16px 20px;
          flex-wrap: wrap;
        }
        .c-lb-thumb {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          overflow: hidden;
          border: 1.5px solid transparent;
          cursor: pointer;
          background: rgba(255,213,74,0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,213,74,0.3);
          transition: border-color 0.2s;
        }
        .c-lb-thumb--active { border-color: #FFD54A; }
        .c-lb-thumb--locked { opacity: 0.3; cursor: not-allowed; }



        /* ── Responsive ─────────────────────────────────────────── */
        @media (max-width: 768px) {
          .c-hero { padding: 100px 20px 60px; }
          .c-section { padding: 56px 0; }
          .c-container { padding: 0 20px; }
          .c-arr--l { left: 2px; }
          .c-arr--r { right: 2px; }
        }
      `}</style>
    </div>
  )
}
