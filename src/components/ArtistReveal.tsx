import { useState, useRef } from 'react'
import { X, Sparkles, Eye, Music2, ChevronLeft, ChevronRight, Lock } from 'lucide-react'
import type { CulturalsArtist } from '@/api/admin/settings'
import { GoldenRibbonsBackground } from './GoldenRibbonsBackground'

interface ArtistCarouselProps {
  artists: CulturalsArtist[]
  title?: string
}

export function ArtistCarousel({ artists, title }: ArtistCarouselProps) {
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set())
  const [lightboxArtist, setLightboxArtist] = useState<CulturalsArtist | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)

  const sortedArtists = [...artists].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  const handleCardClick = (artist: CulturalsArtist) => {
    if (artist.revealed || revealedIds.has(artist.id)) {
      // Already revealed — open lightbox
      if (artist.imageUrl) setLightboxArtist(artist)
    } else {
      // First click → reveal
      setRevealedIds((prev) => new Set([...prev, artist.id]))
      if (artist.imageUrl) {
        setTimeout(() => setLightboxArtist(artist), 350)
      }
    }
  }

  const TWO_HOURS_MS = 2 * 60 * 60 * 1000
  const isPermanentlyRevealed = (artist: CulturalsArtist) =>
    !!artist.uploadedAt && (Date.now() - artist.uploadedAt > TWO_HOURS_MS)

  const isRevealed = (artist: CulturalsArtist) =>
    isPermanentlyRevealed(artist) || artist.revealed || revealedIds.has(artist.id)

  const scrollTo = (index: number) => {
    const clamped = Math.max(0, Math.min(index, sortedArtists.length - 1))
    setActiveIndex(clamped)
    const card = trackRef.current?.children[clamped] as HTMLElement | undefined
    card?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }

  const prev = () => scrollTo(activeIndex - 1)
  const next = () => scrollTo(activeIndex + 1)

  if (sortedArtists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-2xl border border-[oklch(0.78_0.16_80/0.2)] flex items-center justify-center">
          <Music2 className="w-7 h-7" style={{ color: 'oklch(0.55 0.08 80)' }} />
        </div>
        <p style={{ color: 'oklch(0.50 0.05 80)', fontSize: '0.85rem' }}>Artists will be announced soon…</p>
      </div>
    )
  }

  return (
    <>
      <GoldenRibbonsBackground />
      {/* ── Carousel Track ── */}
      <div className="carousel-root">

        {/* Arrow nav */}
        {sortedArtists.length > 1 && (
          <>
            <button
              className="carousel-arrow carousel-arrow-left"
              onClick={prev}
              disabled={activeIndex === 0}
              aria-label="Previous artist"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              className="carousel-arrow carousel-arrow-right"
              onClick={next}
              disabled={activeIndex === sortedArtists.length - 1}
              aria-label="Next artist"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Scrollable track */}
        <div className="carousel-track" ref={trackRef}>
          {sortedArtists.map((artist, i) => {
            const revealed = isRevealed(artist)

            return (
              <div
                key={artist.id}
                className={`artist-card ${i === activeIndex ? 'active' : ''}`}
                onClick={() => { setActiveIndex(i); handleCardClick(artist) }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleCardClick(artist)}
                aria-label={revealed ? `View ${artist.name}` : 'Click to reveal artist'}
              >
                {/* Outer animated border */}
                <div className={`artist-border ${revealed ? 'revealed-border' : 'mystery-border'}`} />

                {/* Card inner */}
                <div className="artist-inner">
                  {/* Background image */}
                  {artist.imageUrl && (
                    <div
                      className={`artist-bg ${revealed ? 'bg-revealed' : 'bg-blurred'}`}
                      style={{ backgroundImage: `url(${artist.imageUrl})` }}
                    />
                  )}

                  {/* Gradient overlay */}
                  <div className={`artist-gradient ${revealed ? 'gradient-revealed' : 'gradient-mystery'}`} />

                  {/* Content */}
                  {revealed ? (
                    <div className="artist-revealed-content">
                      {!isPermanentlyRevealed(artist) && (
                        <div className="revealed-badge">
                          <Sparkles className="w-3 h-3" />
                          REVEALED
                        </div>
                      )}
                      {artist.name && (
                        <div className="artist-name-strip">
                          <h3 className="artist-card-name">{artist.name}</h3>
                          {artist.description && (
                            <p className="artist-card-desc">{artist.description}</p>
                          )}
                        </div>
                      )}
                      {artist.imageUrl && (
                        <div className="view-hint">
                          <Eye className="w-3 h-3" />
                          Click to view
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="artist-mystery-content">
                      <div className="mystery-icon-ring">
                        <Lock className="w-6 h-6" style={{ color: 'oklch(0.78 0.16 80)' }} />
                        <div className="mystery-ping-ring" />
                      </div>
                      <span className="mystery-card-label">CULTURAL ARTIST</span>
                      <span className="mystery-card-num">#{String(i + 1).padStart(2, '0')}</span>
                      <span className="mystery-tap-hint">
                        <Eye className="w-3 h-3" /> Tap to reveal
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Dot indicators */}
        {sortedArtists.length > 1 && (
          <div className="carousel-dots">
            {sortedArtists.map((_, i) => (
              <button
                key={i}
                className={`carousel-dot ${i === activeIndex ? 'dot-active' : ''}`}
                onClick={() => scrollTo(i)}
                aria-label={`Go to artist ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightboxArtist && (
        <div
          className="artist-lightbox-backdrop"
          onClick={() => setLightboxArtist(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="artist-lightbox-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="lightbox-close"
              onClick={() => setLightboxArtist(null)}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="lightbox-header">
              <span className="lightbox-eyebrow">
                <Sparkles className="w-3.5 h-3.5" />
                {title || 'CULTURAL NIGHT ARTIST'}
              </span>
              <h2 className="lightbox-name">{lightboxArtist.name}</h2>
              {lightboxArtist.description && (
                <p className="lightbox-desc">{lightboxArtist.description}</p>
              )}
            </div>

            {lightboxArtist.imageUrl && (
              <div className="lightbox-img-wrap">
                <img
                  src={lightboxArtist.imageUrl}
                  alt={lightboxArtist.name}
                  className="lightbox-img"
                />
              </div>
            )}

            {/* Navigation between artists in lightbox */}
            {sortedArtists.length > 1 && (
              <div className="lightbox-nav">
                {sortedArtists.map((a) => {
                  const rev = isRevealed(a)
                  return (
                    <button
                      key={a.id}
                      className={`lightbox-thumb ${lightboxArtist.id === a.id ? 'thumb-active' : ''} ${!rev ? 'thumb-locked' : ''}`}
                      onClick={() => rev && a.imageUrl && setLightboxArtist(a)}
                      title={rev ? a.name : 'Not revealed yet'}
                    >
                      {a.imageUrl && rev ? (
                        <img src={a.imageUrl} alt={a.name} className="w-full h-full object-cover" />
                      ) : (
                        <Lock className="w-3 h-3" style={{ color: 'oklch(0.55 0.08 80)' }} />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scoped styles */}
      <style>{`
        /* ── Carousel ── */
        .carousel-root {
          position: relative;
          width: 100%;
        }
        .carousel-track {
          display: flex;
          gap: 20px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scroll-behavior: smooth;
          padding: 12px 4px 24px;
          scrollbar-width: none;
        }
        .carousel-track::-webkit-scrollbar { display: none; }

        /* ── Artist Card ── */
        .artist-card {
          flex-shrink: 0;
          width: clamp(220px, 30vw, 280px);
          aspect-ratio: 3/4;
          position: relative;
          border-radius: 20px;
          cursor: pointer;
          scroll-snap-align: center;
          outline: none;
          transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s;
          opacity: 0.65;
        }
        .artist-card:hover, .artist-card.active {
          transform: translateY(-6px) scale(1.04);
          opacity: 1;
        }
        .artist-card:active { transform: scale(0.97); }

        /* Border ring */
        .artist-border {
          position: absolute;
          inset: -3px;
          border-radius: 23px;
          z-index: 0;
        }
        .mystery-border {
          background: conic-gradient(from 0deg, #d4af37 0%, #a855f7 33%, #d4af37 66%, #d4af37 100%);
          animation: border-spin 4s linear infinite;
          opacity: 0.5;
        }
        .artist-card:hover .mystery-border, .artist-card.active .mystery-border { opacity: 1; }
        .revealed-border {
          background: conic-gradient(from 0deg, #d4af37, #ffd700, #d4af37);
          animation: border-spin 6s linear infinite;
          opacity: 0.8;
        }
        @keyframes border-spin { to { transform: rotate(360deg); } }

        .artist-inner {
          position: absolute;
          inset: 2px;
          border-radius: 18px;
          overflow: hidden;
          background: oklch(0.10 0.02 25);
          z-index: 1;
        }

        /* Background image */
        .artist-bg {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center top;
          transition: filter 1s ease, transform 0.5s ease;
        }
        .bg-blurred {
          filter: blur(24px) brightness(0.25) saturate(0.3);
        }
        .bg-revealed {
          filter: none;
        }
        .artist-card:hover .bg-revealed {
          transform: scale(1.03);
        }

        /* Gradients */
        .artist-gradient {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .gradient-mystery {
          background: radial-gradient(ellipse at center, oklch(0.12 0.04 80 / 0.7), oklch(0.06 0.02 25 / 0.85));
        }
        .gradient-revealed {
          background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%);
        }

        /* Mystery content */
        .artist-mystery-content {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          z-index: 2;
          padding: 16px;
        }
        .mystery-icon-ring {
          position: relative;
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: oklch(0.78 0.16 80 / 0.10);
          border: 1.5px solid oklch(0.78 0.16 80 / 0.35);
          flex-shrink: 0;
        }
        .mystery-ping-ring {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 1px solid oklch(0.78 0.16 80 / 0.3);
          animation: ping-expand 2s ease-out infinite;
        }
        @keyframes ping-expand { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(1.6); opacity: 0; } }
        .mystery-card-label {
          font-size: 0.55rem;
          letter-spacing: 0.35em;
          color: oklch(0.78 0.16 80);
          font-weight: 700;
          text-transform: uppercase;
        }
        .mystery-card-num {
          font-family: monospace;
          font-size: 1.4rem;
          font-weight: 800;
          color: white;
          opacity: 0.15;
        }
        .mystery-tap-hint {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.65rem;
          color: oklch(0.60 0.08 80);
          letter-spacing: 0.08em;
          animation: hint-fade 3s ease-in-out infinite;
          margin-top: 6px;
        }
        @keyframes hint-fade { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }

        /* Revealed content */
        .artist-revealed-content {
          position: absolute;
          inset: 0;
          z-index: 2;
          display: flex;
          flex-direction: column;
        }
        .revealed-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          display: flex;
          align-items: center;
          gap: 4px;
          background: oklch(0.10 0.02 25 / 0.85);
          border: 1px solid oklch(0.78 0.16 80 / 0.4);
          border-radius: 20px;
          padding: 3px 8px;
          font-size: 0.5rem;
          letter-spacing: 0.2em;
          color: oklch(0.78 0.16 80);
          font-weight: 700;
          backdrop-filter: blur(8px);
        }
        .artist-name-strip {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 28px 14px 12px;
        }
        .artist-card-name {
          font-family: 'Cinzel', serif;
          font-size: clamp(0.85rem, 2vw, 1rem);
          font-weight: 700;
          color: white;
          text-shadow: 0 2px 8px rgba(0,0,0,0.7);
          line-height: 1.2;
        }
        .artist-card-desc {
          font-size: 0.68rem;
          color: oklch(0.75 0.08 80);
          margin-top: 3px;
          line-height: 1.4;
        }
        .view-hint {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.65rem;
          color: white;
          background: oklch(0.10 0.02 25 / 0.7);
          border: 1px solid white/20;
          border-radius: 16px;
          padding: 5px 12px;
          opacity: 0;
          transition: opacity 0.3s;
          backdrop-filter: blur(6px);
          letter-spacing: 0.05em;
          pointer-events: none;
        }
        .artist-card:hover .view-hint { opacity: 1; }

        /* ── Nav arrows ── */
        .carousel-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-60%);
          z-index: 10;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: oklch(0.12 0.02 25 / 0.9);
          border: 1px solid oklch(0.78 0.16 80 / 0.25);
          color: white;
          cursor: pointer;
          transition: background 0.2s, opacity 0.2s;
          backdrop-filter: blur(8px);
        }
        .carousel-arrow:hover { background: oklch(0.18 0.02 25); }
        .carousel-arrow:disabled { opacity: 0.3; pointer-events: none; }
        .carousel-arrow-left { left: -20px; }
        .carousel-arrow-right { right: -20px; }
        @media (max-width: 640px) {
          .carousel-arrow-left { left: 4px; }
          .carousel-arrow-right { right: 4px; }
        }

        /* ── Dots ── */
        .carousel-dots {
          display: flex;
          justify-content: center;
          gap: 8px;
          padding-top: 4px;
        }
        .carousel-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: oklch(0.78 0.16 80 / 0.25);
          transition: background 0.3s, width 0.3s;
          cursor: pointer;
          border: none;
        }
        .carousel-dot.dot-active {
          background: oklch(0.78 0.16 80);
          width: 24px;
          border-radius: 3px;
        }

        /* ── Lightbox ── */
        .artist-lightbox-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(0,0,0,0.92);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          backdrop-filter: blur(14px);
          animation: fade-in 0.3s ease;
        }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }

        .artist-lightbox-panel {
          position: relative;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          background: oklch(0.09 0.02 25);
          border: 1px solid oklch(0.78 0.16 80 / 0.30);
          border-radius: 26px;
          box-shadow: 0 0 80px oklch(0.78 0.16 80 / 0.25);
          animation: panel-pop 0.4s cubic-bezier(0.34,1.56,0.64,1);
          scrollbar-width: none;
        }
        .artist-lightbox-panel::-webkit-scrollbar { display: none; }
        @keyframes panel-pop { from { opacity: 0; transform: scale(0.85) translateY(20px); } to { opacity: 1; transform: none; } }

        .lightbox-close {
          position: sticky;
          top: 14px;
          float: right;
          margin: 14px 14px 0 0;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: oklch(0.14 0.02 25 / 0.9);
          border: 1px solid oklch(0.78 0.16 80 / 0.2);
          color: white;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .lightbox-close:hover { transform: rotate(90deg); }

        .lightbox-header {
          padding: 20px 24px 12px;
          clear: both;
          text-align: center;
        }
        .lightbox-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.58rem;
          letter-spacing: 0.35em;
          color: oklch(0.78 0.16 80);
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .lightbox-name {
          font-family: 'Cinzel', serif;
          font-size: clamp(1.3rem, 4vw, 1.8rem);
          font-weight: 800;
          background: linear-gradient(135deg, #d4af37, #fff8e1, #d4af37);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.2;
          letter-spacing: 0.04em;
          display: block;
        }
        .lightbox-desc {
          font-size: 0.82rem;
          color: oklch(0.62 0.06 80);
          margin-top: 6px;
          line-height: 1.6;
        }

        .lightbox-img-wrap {
          padding: 0 16px 16px;
        }
        .lightbox-img {
          width: 100%;
          border-radius: 18px;
          object-fit: cover;
          max-height: 55vh;
          display: block;
          box-shadow: 0 8px 40px rgba(0,0,0,0.6);
        }

        /* Lightbox thumbnail nav */
        .lightbox-nav {
          display: flex;
          gap: 8px;
          justify-content: center;
          padding: 0 16px 20px;
          flex-wrap: wrap;
        }
        .lightbox-thumb {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          overflow: hidden;
          border: 2px solid transparent;
          transition: border-color 0.2s;
          cursor: pointer;
          background: oklch(0.12 0.02 25);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .lightbox-thumb.thumb-active {
          border-color: oklch(0.78 0.16 80);
        }
        .lightbox-thumb.thumb-locked {
          opacity: 0.35;
          cursor: not-allowed;
        }
      `}</style>
    </>
  )
}
