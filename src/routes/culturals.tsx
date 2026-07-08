import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Sparkles, ChevronLeft, ChevronRight, Lock, Eye, X, Music2, Star } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { getPublicCulturalsSettings, type PublicCulturalsSettings, type CulturalsArtist } from '@/api/admin/settings'

export const Route = createFileRoute('/culturals')({
  head: () => ({
    meta: [
      { title: 'Meet the Artists — SIMMAM 2026' },
      { name: 'description', content: 'Cultural Night at SIMMAM 2026 — artist reveals, games, and the grandest celebration at SIMATS Engineering.' },
    ],
  }),
  component: CulturalsPage,
})

/* ─── SVG Golden Branch Background ─────────────────────────────────── */
function GoldenBranchBackground() {
  return (
    <div className="gb-root" aria-hidden="true">
      {/* Top-left branch */}
      <svg className="gb-svg gb-svg--tl" viewBox="0 0 500 700" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFD54A" stopOpacity="0.9"/>
            <stop offset="100%" stopColor="#8B6914" stopOpacity="0.2"/>
          </linearGradient>
          <linearGradient id="g1l" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FFD54A" stopOpacity="0.6"/>
            <stop offset="100%" stopColor="#E0A810" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {/* Main stem */}
        <path d="M 20 700 C 50 600 80 500 120 400 C 160 300 200 250 240 160 C 260 120 270 80 260 20" stroke="url(#g1)" strokeWidth="2.5" fill="none"/>
        {/* Branch 1 */}
        <path d="M 80 580 C 120 550 170 530 220 510 C 260 495 290 485 320 470" stroke="url(#g1l)" strokeWidth="1.5" fill="none"/>
        {/* Branch 2 */}
        <path d="M 130 470 C 160 440 200 415 240 395 C 280 375 310 360 330 345" stroke="url(#g1l)" strokeWidth="1.5" fill="none"/>
        {/* Branch 3 */}
        <path d="M 170 370 C 195 345 225 320 255 305 C 275 295 295 288 310 278" stroke="url(#g1l)" strokeWidth="1.2" fill="none"/>
        {/* Branch 4 upper */}
        <path d="M 210 270 C 230 250 255 235 278 220 C 298 207 312 198 322 188" stroke="url(#g1l)" strokeWidth="1" fill="none"/>
        {/* Leaves - cluster 1 */}
        <ellipse cx="220" cy="510" rx="18" ry="9" transform="rotate(-30 220 510)" fill="#FFD54A" fillOpacity="0.25"/>
        <ellipse cx="240" cy="502" rx="14" ry="7" transform="rotate(-20 240 502)" fill="#FFD54A" fillOpacity="0.18"/>
        <ellipse cx="320" cy="470" rx="16" ry="8" transform="rotate(-45 320 470)" fill="#E0A810" fillOpacity="0.22"/>
        {/* Leaves - cluster 2 */}
        <ellipse cx="255" cy="395" rx="15" ry="7" transform="rotate(-25 255 395)" fill="#FFD54A" fillOpacity="0.2"/>
        <ellipse cx="330" cy="345" rx="18" ry="9" transform="rotate(-50 330 345)" fill="#FFD54A" fillOpacity="0.25"/>
        <ellipse cx="310" cy="355" rx="12" ry="6" transform="rotate(-15 310 355)" fill="#E0A810" fillOpacity="0.18"/>
        {/* Leaves - cluster 3 */}
        <ellipse cx="278" cy="220" rx="14" ry="7" transform="rotate(-35 278 220)" fill="#FFD54A" fillOpacity="0.22"/>
        <ellipse cx="322" cy="188" rx="16" ry="8" transform="rotate(-55 322 188)" fill="#FFD54A" fillOpacity="0.2"/>
        {/* Small decorative dots */}
        <circle cx="160" cy="430" r="2" fill="#FFD54A" fillOpacity="0.4"/>
        <circle cx="200" cy="320" r="1.5" fill="#FFD54A" fillOpacity="0.35"/>
        <circle cx="245" cy="230" r="2" fill="#FFD54A" fillOpacity="0.3"/>
        <circle cx="275" cy="150" r="1.5" fill="#FFD54A" fillOpacity="0.25"/>
      </svg>

      {/* Top-right branch (mirrored) */}
      <svg className="gb-svg gb-svg--tr" viewBox="0 0 500 700" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g2" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFD54A" stopOpacity="0.9"/>
            <stop offset="100%" stopColor="#8B6914" stopOpacity="0.2"/>
          </linearGradient>
          <linearGradient id="g2l" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stopColor="#FFD54A" stopOpacity="0.6"/>
            <stop offset="100%" stopColor="#E0A810" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d="M 480 700 C 450 600 420 500 380 400 C 340 300 300 250 260 160 C 240 120 230 80 240 20" stroke="url(#g2)" strokeWidth="2.5" fill="none"/>
        <path d="M 420 580 C 380 550 330 530 280 510 C 240 495 210 485 180 470" stroke="url(#g2l)" strokeWidth="1.5" fill="none"/>
        <path d="M 370 470 C 340 440 300 415 260 395 C 220 375 190 360 170 345" stroke="url(#g2l)" strokeWidth="1.5" fill="none"/>
        <path d="M 330 370 C 305 345 275 320 245 305 C 225 295 205 288 190 278" stroke="url(#g2l)" strokeWidth="1.2" fill="none"/>
        <path d="M 290 270 C 270 250 245 235 222 220 C 202 207 188 198 178 188" stroke="url(#g2l)" strokeWidth="1" fill="none"/>
        <ellipse cx="280" cy="510" rx="18" ry="9" transform="rotate(30 280 510)" fill="#FFD54A" fillOpacity="0.25"/>
        <ellipse cx="260" cy="502" rx="14" ry="7" transform="rotate(20 260 502)" fill="#FFD54A" fillOpacity="0.18"/>
        <ellipse cx="180" cy="470" rx="16" ry="8" transform="rotate(45 180 470)" fill="#E0A810" fillOpacity="0.22"/>
        <ellipse cx="245" cy="395" rx="15" ry="7" transform="rotate(25 245 395)" fill="#FFD54A" fillOpacity="0.2"/>
        <ellipse cx="170" cy="345" rx="18" ry="9" transform="rotate(50 170 345)" fill="#FFD54A" fillOpacity="0.25"/>
        <ellipse cx="190" cy="355" rx="12" ry="6" transform="rotate(15 190 355)" fill="#E0A810" fillOpacity="0.18"/>
        <ellipse cx="222" cy="220" rx="14" ry="7" transform="rotate(35 222 220)" fill="#FFD54A" fillOpacity="0.22"/>
        <ellipse cx="178" cy="188" rx="16" ry="8" transform="rotate(55 178 188)" fill="#FFD54A" fillOpacity="0.2"/>
        <circle cx="340" cy="430" r="2" fill="#FFD54A" fillOpacity="0.4"/>
        <circle cx="300" cy="320" r="1.5" fill="#FFD54A" fillOpacity="0.35"/>
        <circle cx="255" cy="230" r="2" fill="#FFD54A" fillOpacity="0.3"/>
        <circle cx="225" cy="150" r="1.5" fill="#FFD54A" fillOpacity="0.25"/>
      </svg>

      {/* Bottom decorative ribbon arcs */}
      <svg className="gb-svg gb-svg--bottom" viewBox="0 0 1200 200" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g3" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FFD54A" stopOpacity="0"/>
            <stop offset="30%" stopColor="#FFD54A" stopOpacity="0.15"/>
            <stop offset="50%" stopColor="#E0A810" stopOpacity="0.25"/>
            <stop offset="70%" stopColor="#FFD54A" stopOpacity="0.15"/>
            <stop offset="100%" stopColor="#FFD54A" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d="M 0 150 C 200 80 400 40 600 60 C 800 80 1000 120 1200 100" stroke="url(#g3)" strokeWidth="1.5" fill="none"/>
        <path d="M 0 170 C 200 100 400 60 600 80 C 800 100 1000 140 1200 120" stroke="url(#g3)" strokeWidth="1" fill="none" opacity="0.6"/>
      </svg>

      {/* Ambient glow orbs */}
      <div className="gb-orb gb-orb--tl"/>
      <div className="gb-orb gb-orb--tr"/>
      <div className="gb-orb gb-orb--center"/>
    </div>
  )
}

/* ─── 3D Carousel ───────────────────────────────────────────────────── */
function CinematicCarousel({ artists, title }: { artists: CulturalsArtist[]; title?: string }) {
  const TWO_HOURS_MS = 2 * 60 * 60 * 1000
  const sorted = [...artists].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set())
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightbox, setLightbox] = useState<CulturalsArtist | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const isPermanentlyRevealed = (a: CulturalsArtist) =>
    !!a.uploadedAt && Date.now() - a.uploadedAt > TWO_HOURS_MS
  const isRevealed = (a: CulturalsArtist) =>
    isPermanentlyRevealed(a) || !!a.revealed || revealedIds.has(a.id)

  const goTo = (idx: number) => {
    if (isTransitioning) return
    const clamped = Math.max(0, Math.min(idx, sorted.length - 1))
    if (clamped === activeIndex) return
    setIsTransitioning(true)
    setActiveIndex(clamped)
    setTimeout(() => setIsTransitioning(false), 600)
  }

  const handleCardClick = (artist: CulturalsArtist, i: number) => {
    if (i !== activeIndex) { goTo(i); return }
    if (isRevealed(artist)) {
      if (artist.imageUrl) setLightbox(artist)
    } else {
      setRevealedIds(prev => new Set([...prev, artist.id]))
      if (artist.imageUrl) setTimeout(() => setLightbox(artist), 500)
    }
  }

  // 3D position helper
  const getCardStyle = (i: number): React.CSSProperties => {
    const offset = i - activeIndex
    const absOffset = Math.abs(offset)
    const maxVisible = 2

    if (absOffset > maxVisible) return { display: 'none' }

    const rotateY = offset * 38
    const translateX = offset * 220
    const translateZ = -absOffset * 120
    const scale = 1 - absOffset * 0.12
    const opacity = 1 - absOffset * 0.35
    const zIndex = 10 - absOffset

    return {
      transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
      opacity,
      zIndex,
      pointerEvents: absOffset > 0 ? 'auto' : 'auto',
    }
  }

  if (sorted.length === 0) {
    return (
      <div className="gc-empty">
        <div className="gc-empty-icon"><Music2 size={36}/></div>
        <p className="gc-empty-txt">Artists will be announced soon…</p>
        <div className="gc-empty-sub">Stay tuned for the grand reveal</div>
      </div>
    )
  }

  return (
    <>
      <div className="gc-stage-wrap">
        {/* Arrow buttons */}
        {sorted.length > 1 && (
          <>
            <button
              className="gc-arr gc-arr--l"
              onClick={() => goTo(activeIndex - 1)}
              disabled={activeIndex === 0 || isTransitioning}
              aria-label="Previous artist"
            >
              <ChevronLeft size={22}/>
            </button>
            <button
              className="gc-arr gc-arr--r"
              onClick={() => goTo(activeIndex + 1)}
              disabled={activeIndex === sorted.length - 1 || isTransitioning}
              aria-label="Next artist"
            >
              <ChevronRight size={22}/>
            </button>
          </>
        )}

        {/* 3D stage */}
        <div className="gc-stage">
          <div className="gc-perspective">
            {sorted.map((artist, i) => {
              const rev = isRevealed(artist)
              const isActive = i === activeIndex
              return (
                <div
                  key={artist.id}
                  className={`gc-card ${isActive ? 'gc-card--active' : ''} ${rev ? 'gc-card--revealed' : ''}`}
                  style={getCardStyle(i)}
                  onClick={() => handleCardClick(artist, i)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && handleCardClick(artist, i)}
                  aria-label={rev ? `View ${artist.name}` : `Reveal artist ${i + 1}`}
                >
                  {/* Gold frame border removed */}

                  {/* Card inner */}
                  <div className="gc-card-inner">
                    {/* Background image */}
                    {artist.imageUrl && (
                      <div
                        className={`gc-card-bg ${rev ? 'gc-bg--visible' : 'gc-bg--hidden'}`}
                        style={{ backgroundImage: `url(${artist.imageUrl})` }}
                      />
                    )}

                    {/* Film strip holes decoration */}
                    <div className="gc-filmstrip gc-filmstrip--l">
                      {Array.from({length: 7}).map((_, j) => <div key={j} className="gc-hole"/>)}
                    </div>
                    <div className="gc-filmstrip gc-filmstrip--r">
                      {Array.from({length: 7}).map((_, j) => <div key={j} className="gc-hole"/>)}
                    </div>

                    {rev ? (
                      // ── REVEALED STATE ──
                      <div className="gc-revealed">
                        <div className="gc-grad-reveal"/>
                        {!isPermanentlyRevealed(artist) && (
                          <div className="gc-badge">
                            <Sparkles size={9}/> REVEALED
                          </div>
                        )}
                        <div className="gc-info">
                          {artist.name && <h3 className="gc-name">{artist.name}</h3>}
                          {artist.description && <p className="gc-desc">{artist.description}</p>}
                          {artist.imageUrl && isActive && (
                            <div className="gc-view-hint">
                              <Eye size={11}/> Click to view full
                            </div>
                          )}
                        </div>
                        {/* Gold shimmer sweep */}
                        <div className="gc-shimmer"/>
                      </div>
                    ) : (
                      // ── MYSTERY STATE ──
                      <div className="gc-mystery">
                        <div className="gc-grad-mystery"/>
                        <div className="gc-mystery-orb">
                          <Lock size={20} className="gc-lock-icon"/>
                          <div className="gc-pulse-ring gc-pulse-ring--1"/>
                          <div className="gc-pulse-ring gc-pulse-ring--2"/>
                          <div className="gc-pulse-ring gc-pulse-ring--3"/>
                        </div>
                        <span className="gc-mystery-num">#{String(i + 1).padStart(2, '0')}</span>
                        <span className="gc-mystery-label">ARTIST</span>
                        {isActive && (
                          <span className="gc-mystery-hint">
                            <Eye size={10}/> Tap to reveal
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Active card spotlight */}
                  {isActive && <div className="gc-spotlight"/>}
                </div>
              )
            })}
          </div>
        </div>

        {/* Film reel decorations */}
        <div className="gc-reel gc-reel--l" aria-hidden="true">
          <div className="gc-reel-circle">
            {Array.from({length: 8}).map((_, i) => (
              <div key={i} className="gc-reel-spoke" style={{ transform: `rotate(${i * 45}deg)` }}/>
            ))}
            <div className="gc-reel-hub"/>
          </div>
        </div>
        <div className="gc-reel gc-reel--r" aria-hidden="true">
          <div className="gc-reel-circle">
            {Array.from({length: 8}).map((_, i) => (
              <div key={i} className="gc-reel-spoke" style={{ transform: `rotate(${i * 45}deg)` }}/>
            ))}
            <div className="gc-reel-hub"/>
          </div>
        </div>
      </div>

      {/* Dot navigation */}
      {sorted.length > 1 && (
        <div className="gc-dots">
          {sorted.map((_, i) => (
            <button
              key={i}
              className={`gc-dot ${i === activeIndex ? 'gc-dot--active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Go to artist ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightbox && (
        <div className="gc-lb-backdrop" onClick={() => setLightbox(null)} role="dialog" aria-modal="true" aria-label="Artist image">
          <div className="gc-lb-panel" onClick={e => e.stopPropagation()}>
            <button className="gc-lb-close" onClick={() => setLightbox(null)} aria-label="Close">
              <X size={18}/>
            </button>

            <div className="gc-lb-glow"/>
            {/* Decorative corners */}
            <div className="gc-lb-corner gc-lb-corner--tl"/>
            <div className="gc-lb-corner gc-lb-corner--tr"/>
            <div className="gc-lb-corner gc-lb-corner--bl"/>
            <div className="gc-lb-corner gc-lb-corner--br"/>

            <div className="gc-lb-inner">
              <div className="gc-lb-header">
                <div className="gc-lb-eyebrow">
                  <Star size={10} className="gc-lb-star"/>
                  <span>{title || 'CULTURAL NIGHT 2026'}</span>
                  <Star size={10} className="gc-lb-star"/>
                </div>
                {lightbox.name && <h2 className="gc-lb-name">{lightbox.name}</h2>}
                {lightbox.description && <p className="gc-lb-desc">{lightbox.description}</p>}
              </div>

              {lightbox.imageUrl && (
                <div className="gc-lb-img-wrap">
                  <img src={lightbox.imageUrl} alt={lightbox.name} className="gc-lb-img" loading="lazy"/>
                  <div className="gc-lb-img-glow"/>
                </div>
              )}

              {/* Thumbnail strip */}
              {sorted.length > 1 && (
                <div className="gc-lb-strip">
                  {sorted.map(a => {
                    const rev = isRevealed(a)
                    return (
                      <button
                        key={a.id}
                        className={`gc-lb-thumb ${lightbox.id === a.id ? 'thumb--active' : ''} ${!rev ? 'thumb--locked' : ''}`}
                        onClick={() => rev && a.imageUrl && setLightbox(a)}
                        aria-label={rev ? `View ${a.name}` : 'Locked'}
                      >
                        {a.imageUrl && rev
                          ? <img src={a.imageUrl} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                          : <Lock size={10}/>
                        }
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ─── Intersection Observer Hook ─────────────────────────────────────── */
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

function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView()
  return (
    <div ref={ref} className={`c-fadein ${inView ? 'c-fadein--visible' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────────── */
function CulturalsPage() {
  const [settings, setSettings] = useState<PublicCulturalsSettings>({})
  const [loading, setLoading] = useState(true)
  const mouseGlowRef = useRef<HTMLDivElement>(null)

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!mouseGlowRef.current) return
    mouseGlowRef.current.style.transform = `translate(${e.clientX - 300}px, ${e.clientY - 300}px)`
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [onMouseMove])

  useEffect(() => {
    getPublicCulturalsSettings()
      .then(setSettings)
      .catch(() => setSettings({}))
      .finally(() => setLoading(false))
  }, [])

  const pageTitle = settings.culturalsTitle || 'Cultural Night 2026'
  const artists = settings.culturalsArtists || []

  return (
    <div className="cp-root">
      {/* Cinematic background layers */}
      <GoldenBranchBackground/>
      <div ref={mouseGlowRef} className="cp-mouse-glow" aria-hidden="true"/>
      <div className="cp-vignette" aria-hidden="true"/>
      <div className="cp-noise" aria-hidden="true"/>

      {/* Scanlines for cinematic effect */}
      <div className="cp-scanlines" aria-hidden="true"/>

      <Navbar/>

      <main className="cp-main">
        {/* ── Hero Header ── */}
        <section className="cp-hero">
          <div className="cp-hero-bg-strip"/>
          <div className="cp-hero-content">
              {/* Eyebrow removed */}
            <FadeIn delay={100}>
              <h1 className="cp-h1">
                <span className="cp-h1-line">Meet</span>
                <span className="cp-h1-line cp-h1-line--gold">The Artists</span>
              </h1>
            </FadeIn>
            <FadeIn delay={200}>
              <p className="cp-sub">
                Each card conceals a star. Click to unveil — but once the curtain rises,
                <br/>the magic is forever real.
              </p>
            </FadeIn>
            {/* Decorative film strip removed */}
          </div>
          {/* Hero bottom gradient fade */}
          <div className="cp-hero-fade"/>
        </section>

        {/* ── Artist Carousel Section ── */}
        <section className="cp-artists">
          <div className="cp-artists-inner">
            {/* Section glow */}
            <div className="cp-section-glow"/>

            {loading ? (
              <div className="cp-loading">
                <div className="cp-loading-reel">
                  {Array.from({length: 8}).map((_,i) => (
                    <div key={i} className="cp-loading-spoke" style={{ transform: `rotate(${i*45}deg)` }}/>
                  ))}
                </div>
                <p className="cp-loading-txt">Loading artists…</p>
              </div>
            ) : (
              <FadeIn delay={80}>
                <CinematicCarousel artists={artists} title={pageTitle}/>
              </FadeIn>
            )}
          </div>
        </section>
      </main>

      <Footer/>

      {/* ════════════ ALL STYLES ════════════ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Outfit:wght@300;400;500;600;700&display=swap');

        /* ── Root ────────────────────────────── */
        .cp-root {
          position: relative;
          min-height: 100vh;
          overflow-x: hidden;
          background: #060608;
          color: #f5f0e8;
          font-family: 'Outfit', system-ui, sans-serif;
        }

        /* ── Fixed atmosphere layers ─────────── */
        .cp-mouse-glow {
          position: fixed; top: 0; left: 0;
          width: 600px; height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,213,74,0.05) 0%, transparent 70%);
          pointer-events: none; z-index: 0;
          transition: transform 0.15s linear;
          will-change: transform;
        }
        .cp-vignette {
          position: fixed; inset: 0;
          background: radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.85) 100%);
          pointer-events: none; z-index: 1;
        }
        .cp-noise {
          position: fixed; inset: 0;
          pointer-events: none; z-index: 2; opacity: 0.03; mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 150px 150px;
        }
        .cp-scanlines {
          position: fixed; inset: 0;
          pointer-events: none; z-index: 3;
          background: repeating-linear-gradient(
            0deg, transparent, transparent 2px,
            rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px
          );
        }

        /* ── Golden Branch Background ─────────── */
        .gb-root {
          position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden;
        }
        .gb-svg {
          position: absolute;
          filter: drop-shadow(0 0 8px rgba(255,213,74,0.15));
        }
        .gb-svg--tl {
          top: -40px; left: -40px;
          width: clamp(180px, 28vw, 380px);
          height: auto;
          animation: branch-sway 12s ease-in-out infinite;
          transform-origin: bottom left;
        }
        .gb-svg--tr {
          top: -40px; right: -40px;
          width: clamp(180px, 28vw, 380px);
          height: auto;
          animation: branch-sway 14s ease-in-out infinite reverse;
          transform-origin: bottom right;
        }
        .gb-svg--bottom {
          bottom: 60px; left: 0; right: 0;
          width: 100%; height: 200px;
          opacity: 0.4;
        }
        @keyframes branch-sway {
          0%, 100% { transform: rotate(0deg) scale(1); }
          30% { transform: rotate(1.5deg) scale(1.01); }
          70% { transform: rotate(-1deg) scale(0.99); }
        }
        .gb-orb {
          position: absolute; border-radius: 50%;
          filter: blur(80px); pointer-events: none;
        }
        .gb-orb--tl {
          top: -100px; left: -100px;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(255,213,74,0.06) 0%, transparent 70%);
          animation: orb-breathe 10s ease-in-out infinite;
        }
        .gb-orb--tr {
          top: -100px; right: -100px;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(255,213,74,0.06) 0%, transparent 70%);
          animation: orb-breathe 12s ease-in-out infinite reverse;
        }
        .gb-orb--center {
          top: 30%; left: 50%; transform: translateX(-50%);
          width: 600px; height: 300px;
          background: radial-gradient(ellipse, rgba(180,120,20,0.04) 0%, transparent 70%);
          animation: orb-breathe 16s ease-in-out infinite 2s;
        }
        @keyframes orb-breathe {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }

        /* ── Main ────────────────────────────── */
        .cp-main { position: relative; z-index: 10; }

        /* ── Hero Section ─────────────────────── */
        .cp-hero {
          position: relative; overflow: hidden;
          min-height: 40vh; display: flex; flex-direction: column;
          align-items: center; justify-content: flex-end;
          padding: 160px 24px 60px;
          text-align: center;
        }
        .cp-hero-bg-strip {
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(255,213,74,0.02) 0%, transparent 60%);
          pointer-events: none;
        }
        .cp-hero-fade {
          position: absolute; bottom: 0; left: 0; right: 0; height: 80px;
          background: linear-gradient(transparent, #060608);
          pointer-events: none;
        }
        .cp-hero-content { position: relative; z-index: 5; }

        .cp-eyebrow {
          display: inline-flex; align-items: center; gap: 10px;
          font-size: 0.6rem; font-weight: 700; letter-spacing: 0.4em;
          text-transform: uppercase; color: rgba(255,213,74,0.7);
          margin-bottom: 20px;
        }
        .cp-eyebrow-dot {
          width: 4px; height: 4px; border-radius: 50%;
          background: #FFD54A;
          animation: dot-pulse 2s ease-in-out infinite;
        }
        @keyframes dot-pulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
        .cp-eyebrow-divider { width: 30px; height: 1px; background: rgba(255,213,74,0.3); }

        .cp-h1 {
          display: flex; flex-direction: column;
          font-family: 'Cinzel', serif;
          font-size: 24px;
          font-weight: 900; line-height: 0.95;
          letter-spacing: 0.02em;
          margin-bottom: 20px;
        }
        .cp-h1-line {
          color: #f5f0e8;
          animation: word-rise 0.8s cubic-bezier(0.2,0.8,0.2,1) both;
        }
        .cp-h1-line--gold {
          color: transparent;
          background: linear-gradient(135deg, #fff8e6 0%, #FFD54A 35%, #e0a810 60%, #FFD54A 80%, #fffaed 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text; background-clip: text;
          animation: word-rise 0.8s cubic-bezier(0.2,0.8,0.2,1) 0.15s both, shimmer-text 4s linear infinite 1s;
          filter: drop-shadow(0 0 40px rgba(255,213,74,0.3));
        }
        @keyframes word-rise {
          from { opacity: 0; transform: translateY(40px); filter: blur(8px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes shimmer-text {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }

        .cp-sub {
          font-size: clamp(0.85rem, 1.8vw, 1rem);
          line-height: 1.8; color: rgba(245,240,232,0.45);
          max-width: 500px; margin: 0 auto 32px;
          animation: fade-up 0.8s cubic-bezier(0.2,0.8,0.2,1) 0.3s both;
        }
        @keyframes fade-up { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }

        /* Film strip decoration */
        .cp-hero-filmstrip {
          display: flex; gap: 3px; justify-content: center;
          margin-top: 8px; opacity: 0.15;
        }
        .cp-film-frame {
          width: 18px; height: 12px;
          border: 1px solid #FFD54A; border-radius: 1px;
          flex-shrink: 0;
        }

        /* ── Artists Section ─────────────────── */
        .cp-artists {
          position: relative;
          padding: 20px 0 100px;
        }
        .cp-artists-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          position: relative;
        }
        .cp-section-glow {
          position: absolute; top: -80px; left: 50%; transform: translateX(-50%);
          width: 700px; height: 350px;
          background: radial-gradient(ellipse, rgba(255,213,74,0.06) 0%, transparent 70%);
          pointer-events: none; filter: blur(40px);
        }

        /* ── Loading spinner ─────────────────── */
        .cp-loading {
          display: flex; flex-direction: column; align-items: center;
          gap: 20px; padding: 80px 0;
        }
        .cp-loading-reel {
          position: relative; width: 60px; height: 60px;
          border: 2px solid rgba(255,213,74,0.1);
          border-radius: 50%;
          animation: reel-spin 2s linear infinite;
        }
        .cp-loading-spoke {
          position: absolute; top: 50%; left: 50%;
          width: 1px; height: 24px;
          background: rgba(255,213,74,0.3);
          transform-origin: 0 0;
        }
        @keyframes reel-spin { to { transform: rotate(360deg); } }
        .cp-loading-txt { font-size: 0.75rem; letter-spacing: 0.2em; color: rgba(255,213,74,0.5); }

        /* ── FadeIn ──────────────────────────── */
        .c-fadein { opacity: 0; transform: translateY(28px); filter: blur(4px);
          transition: opacity 0.8s cubic-bezier(0.2,0.8,0.2,1), transform 0.8s cubic-bezier(0.2,0.8,0.2,1), filter 0.8s cubic-bezier(0.2,0.8,0.2,1);
        }
        .c-fadein--visible { opacity: 1; transform: translateY(0); filter: blur(0); }

        /* ═══════════ 3D CAROUSEL ═══════════════ */
        .gc-stage-wrap {
          position: relative;
          width: 100%;
          padding: 20px 0 60px;
        }

        .gc-stage {
          position: relative;
          height: clamp(400px, 60vh, 550px);
          display: flex; align-items: center; justify-content: center;
          overflow: visible;
        }

        .gc-perspective {
          position: relative;
          width: clamp(240px, 32vw, 310px);
          height: 100%;
          transform-style: preserve-3d;
          perspective: 1200px;
        }

        /* ── Card ────────────────────────────── */
        .gc-card {
          position: absolute;
          top: 0; left: 0;
          width: clamp(240px, 32vw, 310px);
          height: 100%;
          border-radius: 20px;
          cursor: pointer;
          transition:
            transform 0.6s cubic-bezier(0.34, 1.4, 0.64, 1),
            opacity 0.5s ease,
            box-shadow 0.4s ease;
          transform-style: preserve-3d;
          will-change: transform, opacity;
          outline: none;
        }
        .gc-card:focus-visible { outline: 2px solid rgba(255,213,74,0.6); outline-offset: 4px; }

        .gc-card-frame {
          position: absolute; inset: -2px;
          border-radius: 22px; z-index: 0;
          transition: opacity 0.5s ease;
        }
        .frame--mystery {
          background: conic-gradient(from 0deg, rgba(255,213,74,0.4) 0%, rgba(120,60,180,0.3) 30%, rgba(80,10,10,0.3) 60%, rgba(255,213,74,0.4) 100%);
          animation: frame-spin 6s linear infinite;
          opacity: 0.5;
        }
        .gc-card--active .frame--mystery { opacity: 0.9; }
        .frame--gold {
          background: conic-gradient(from 0deg, #FFD54A, #fff8d0, #e0a810, #FFD54A);
          animation: frame-spin 8s linear infinite;
          opacity: 0.9;
          box-shadow: 0 0 30px rgba(255,213,74,0.3);
        }
        @keyframes frame-spin { to { transform: rotate(360deg); } }

        .gc-card-inner {
          position: absolute; inset: 2px;
          border-radius: 18px; overflow: hidden;
          background: #0a0a0c;
          z-index: 1;
          box-shadow:
            inset 0 0 40px rgba(0,0,0,0.8),
            0 20px 60px rgba(0,0,0,0.7);
        }

        /* Film strip holes */
        .gc-filmstrip {
          position: absolute; top: 0; bottom: 0;
          width: 18px; z-index: 5;
          display: flex; flex-direction: column;
          justify-content: space-around; align-items: center;
          padding: 12px 0;
          background: rgba(0,0,0,0.5);
        }
        .gc-filmstrip--l { left: 0; }
        .gc-filmstrip--r { right: 0; }
        .gc-hole {
          width: 8px; height: 10px;
          border-radius: 2px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
        }

        /* BG image */
        .gc-card-bg {
          position: absolute; inset: 0;
          background-size: cover; background-position: center top;
          transition: filter 1.2s ease, transform 0.6s ease;
        }
        .gc-bg--hidden { filter: blur(28px) brightness(0.15) saturate(0.2); }
        .gc-bg--visible { filter: none; }
        .gc-card--active .gc-bg--visible { transform: scale(1.03); }

        /* Gradient overlays */
        .gc-grad-reveal {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(6,6,8,0.95) 0%, rgba(6,6,8,0.3) 40%, transparent 65%);
        }
        .gc-grad-mystery {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at center, rgba(15,12,5,0.7), rgba(6,6,8,0.95));
        }

        /* Gold shimmer sweep on revealed cards */
        .gc-shimmer {
          position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(105deg, transparent 40%, rgba(255,213,74,0.06) 50%, transparent 60%);
          background-size: 200% 100%;
          animation: shimmer-sweep 3s linear infinite;
        }
        @keyframes shimmer-sweep {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        /* Revealed info */
        .gc-revealed {
          position: absolute; inset: 0; z-index: 2;
          display: flex; flex-direction: column;
        }
        .gc-badge {
          position: absolute; top: 10px; right: 24px;
          display: inline-flex; align-items: center; gap: 4px;
          background: rgba(6,6,8,0.85); border: 1px solid rgba(255,213,74,0.4);
          border-radius: 20px; padding: 3px 9px;
          font-size: 0.45rem; font-family: 'Cinzel', serif;
          letter-spacing: 0.25em; color: #FFD54A; font-weight: 700;
          backdrop-filter: blur(8px);
          animation: badge-appear 0.4s ease both;
        }
        @keyframes badge-appear { from { opacity:0; transform:scale(0.8); } to { opacity:1; transform:scale(1); } }
        .gc-info {
          position: absolute; bottom: 0; left: 20px; right: 20px; padding: 32px 0 16px;
        }
        .gc-name {
          font-family: 'Cinzel', serif;
          font-size: clamp(0.85rem, 2.2vw, 1.1rem);
          font-weight: 700; color: #fff;
          text-shadow: 0 2px 20px rgba(0,0,0,0.9);
          letter-spacing: 0.04em; line-height: 1.2;
          margin-bottom: 4px;
        }
        .gc-desc {
          font-size: 0.67rem; color: rgba(255,213,74,0.75);
          line-height: 1.4; margin-bottom: 8px;
        }
        .gc-view-hint {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 0.58rem; color: rgba(255,255,255,0.45);
          letter-spacing: 0.08em;
          animation: hint-blink 2.5s ease-in-out infinite;
        }
        @keyframes hint-blink { 0%,100%{opacity:0.45;} 50%{opacity:1;} }

        /* Mystery state */
        .gc-mystery {
          position: absolute; inset: 0; z-index: 2;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 8px;
        }
        .gc-mystery-orb {
          position: relative; width: 64px; height: 64px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 50%;
          background: rgba(255,213,74,0.07);
          border: 1px solid rgba(255,213,74,0.25);
          margin-bottom: 4px;
        }
        .gc-lock-icon { color: #FFD54A; }
        .gc-pulse-ring {
          position: absolute; border-radius: 50%;
          border: 1px solid rgba(255,213,74,0.2);
          animation: pulse-out 2.5s ease-out infinite;
        }
        .gc-pulse-ring--1 { inset: -8px; animation-delay: 0s; }
        .gc-pulse-ring--2 { inset: -18px; animation-delay: 0.5s; }
        .gc-pulse-ring--3 { inset: -28px; animation-delay: 1s; }
        @keyframes pulse-out {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.3); opacity: 0; }
        }
        .gc-mystery-num {
          font-family: 'Cinzel', serif;
          font-size: 1.4rem; font-weight: 900;
          color: rgba(255,213,74,0.2); letter-spacing: 0.05em;
        }
        .gc-mystery-label {
          font-family: 'Cinzel', serif;
          font-size: 0.5rem; letter-spacing: 0.4em;
          color: rgba(255,213,74,0.5); font-weight: 700;
        }
        .gc-mystery-hint {
          display: flex; align-items: center; gap: 4px;
          font-size: 0.6rem; color: rgba(255,213,74,0.5);
          margin-top: 6px;
          animation: hint-blink 2.5s ease-in-out infinite;
        }

        /* Active spotlight */
        .gc-spotlight {
          position: absolute; inset: -4px;
          border-radius: 24px; pointer-events: none;
          box-shadow: 0 0 80px rgba(255,213,74,0.15), 0 0 200px rgba(255,213,74,0.05);
          z-index: -1;
        }

        /* ── Arrow buttons ───────────────────── */
        .gc-arr {
          position: absolute; top: 50%; transform: translateY(-55%);
          z-index: 30; width: 48px; height: 48px;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          background: rgba(6,6,8,0.8);
          border: 1px solid rgba(255,213,74,0.2);
          color: #FFD54A; cursor: pointer;
          backdrop-filter: blur(12px);
          transition: background 0.2s, border-color 0.2s, box-shadow 0.2s, transform 0.2s;
        }
        .gc-arr:hover {
          background: rgba(30,25,10,0.95);
          border-color: rgba(255,213,74,0.6);
          box-shadow: 0 0 24px rgba(255,213,74,0.2);
          transform: translateY(-55%) scale(1.08);
        }
        .gc-arr:active { transform: translateY(-55%) scale(0.95); }
        .gc-arr:disabled { opacity: 0.2; pointer-events: none; }
        .gc-arr--l { left: 0; }
        .gc-arr--r { right: 0; }
        @media (max-width: 640px) {
          .gc-arr--l { left: 4px; }
          .gc-arr--r { right: 4px; }
        }

        /* ── Film reels ──────────────────────── */
        .gc-reel {
          position: absolute; top: 50%; transform: translateY(-50%);
          opacity: 0.08; pointer-events: none;
        }
        .gc-reel--l { left: -60px; }
        .gc-reel--r { right: -60px; }
        @media (max-width: 900px) { .gc-reel { display: none; } }
        .gc-reel-circle {
          position: relative; width: 80px; height: 80px;
          border-radius: 50%;
          border: 2px solid #FFD54A;
          animation: reel-spin 6s linear infinite;
        }
        .gc-reel-spoke {
          position: absolute; top: 50%; left: 50%;
          width: 1.5px; height: 30px;
          background: #FFD54A;
          transform-origin: 0 0;
        }
        .gc-reel-hub {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 14px; height: 14px;
          border-radius: 50%; border: 2px solid #FFD54A;
          background: rgba(255,213,74,0.2);
        }

        /* ── Dot navigation ──────────────────── */
        .gc-dots {
          display: flex; justify-content: center;
          gap: 8px; padding-top: 4px; flex-wrap: wrap;
        }
        .gc-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: rgba(255,213,74,0.2); border: none; cursor: pointer;
          padding: 0; transition: all 0.3s ease;
        }
        .gc-dot:hover { background: rgba(255,213,74,0.5); transform: scale(1.3); }
        .gc-dot--active { background: #FFD54A; transform: scale(1.5); box-shadow: 0 0 8px rgba(255,213,74,0.5); }

        /* ── Empty state ─────────────────────── */
        .gc-empty {
          display: flex; flex-direction: column; align-items: center;
          gap: 12px; padding: 80px 24px; text-align: center;
        }
        .gc-empty-icon { color: rgba(255,213,74,0.3); }
        .gc-empty-txt { font-family: 'Cinzel', serif; font-size: 1.1rem; color: rgba(255,213,74,0.5); }
        .gc-empty-sub { font-size: 0.8rem; color: rgba(255,255,255,0.3); letter-spacing: 0.1em; }

        /* ── Lightbox ────────────────────────── */
        .gc-lb-backdrop {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.9);
          backdrop-filter: blur(16px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          animation: lb-in 0.35s cubic-bezier(0.2,0.8,0.2,1) both;
        }
        @keyframes lb-in { from { opacity:0; } to { opacity:1; } }

        .gc-lb-panel {
          position: relative;
          max-width: 480px; width: 100%;
          background: linear-gradient(160deg, #0e0c08 0%, #0a0907 50%, #0c0a06 100%);
          border: 1px solid rgba(255,213,74,0.15);
          border-radius: 20px; overflow: hidden;
          box-shadow: 0 0 100px rgba(255,213,74,0.08), 0 40px 80px rgba(0,0,0,0.8);
          animation: panel-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        @keyframes panel-pop { from { opacity:0; transform:scale(0.85); } to { opacity:1; transform:scale(1); } }

        .gc-lb-glow {
          position: absolute; top: -60px; left: 50%; transform: translateX(-50%);
          width: 300px; height: 200px;
          background: radial-gradient(ellipse, rgba(255,213,74,0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        /* Decorative corners */
        .gc-lb-corner {
          position: absolute; width: 20px; height: 20px;
          border-color: rgba(255,213,74,0.35); border-style: solid; z-index: 10;
        }
        .gc-lb-corner--tl { top: 12px; left: 12px; border-width: 1.5px 0 0 1.5px; border-radius: 4px 0 0 0; }
        .gc-lb-corner--tr { top: 12px; right: 12px; border-width: 1.5px 1.5px 0 0; border-radius: 0 4px 0 0; }
        .gc-lb-corner--bl { bottom: 12px; left: 12px; border-width: 0 0 1.5px 1.5px; border-radius: 0 0 0 4px; }
        .gc-lb-corner--br { bottom: 12px; right: 12px; border-width: 0 1.5px 1.5px 0; border-radius: 0 0 4px 0; }

        .gc-lb-close {
          position: absolute; top: 14px; right: 14px; z-index: 20;
          width: 32px; height: 32px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.5); cursor: pointer;
          transition: all 0.2s ease;
        }
        .gc-lb-close:hover { color: #FFD54A; border-color: rgba(255,213,74,0.4); background: rgba(255,213,74,0.08); transform: rotate(90deg); }

        .gc-lb-inner { padding: 28px; }
        .gc-lb-header { text-align: center; margin-bottom: 20px; }
        .gc-lb-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 0.55rem; letter-spacing: 0.35em; text-transform: uppercase;
          color: rgba(255,213,74,0.6); margin-bottom: 10px;
        }
        .gc-lb-star { color: rgba(255,213,74,0.5); }
        .gc-lb-name {
          font-family: 'Cinzel', serif;
          font-size: clamp(1.3rem, 4vw, 1.8rem);
          font-weight: 800; color: transparent;
          background: linear-gradient(135deg, #fff8e6, #FFD54A 50%, #e0a810);
          -webkit-background-clip: text; background-clip: text;
          margin-bottom: 6px; letter-spacing: 0.04em;
        }
        .gc-lb-desc { font-size: 0.8rem; color: rgba(255,213,74,0.6); line-height: 1.6; }

        .gc-lb-img-wrap {
          position: relative; border-radius: 12px; overflow: hidden;
          border: 1px solid rgba(255,213,74,0.12);
          box-shadow: 0 0 40px rgba(0,0,0,0.6);
          margin-bottom: 16px;
        }
        .gc-lb-img {
          width: 100%; display: block;
          max-height: 55vh; object-fit: contain;
          background: #050505;
        }
        .gc-lb-img-glow {
          position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(to top, rgba(255,213,74,0.04) 0%, transparent 40%);
        }

        .gc-lb-strip {
          display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;
        }
        .gc-lb-thumb {
          width: 44px; height: 44px; border-radius: 8px; overflow: hidden;
          border: 1.5px solid rgba(255,213,74,0.15);
          background: rgba(255,255,255,0.04); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.25);
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
          flex-shrink: 0;
        }
        .gc-lb-thumb:hover { border-color: rgba(255,213,74,0.45); transform: scale(1.08); }
        .thumb--active { border-color: #FFD54A; box-shadow: 0 0 12px rgba(255,213,74,0.3); }
        .thumb--locked { cursor: default; opacity: 0.4; }
        .thumb--locked:hover { transform: none; border-color: rgba(255,213,74,0.15); }

        /* ── Responsive ──────────────────────── */
        @media (max-width: 768px) {
          .cp-hero { padding: 140px 16px 50px; }
          .gc-stage { height: clamp(360px, 55vh, 480px); }
          .gc-lb-panel { border-radius: 16px; }
          .gc-lb-inner { padding: 20px; }
        }
        @media (max-width: 480px) {
          .gc-stage { height: clamp(320px, 65vw, 420px); }
          .gc-arr { width: 38px; height: 38px; }
        }
      `}</style>
    </div>
  )
}
