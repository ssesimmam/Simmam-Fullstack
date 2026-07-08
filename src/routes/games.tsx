import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Clock, Users, Zap, Shield, Star, Trophy } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Route = (createFileRoute as any)('/games')({
  component: GamesPage,
})

const API = import.meta.env.VITE_API_URL || ''
const HOUSES = ['Agniyas', 'Dronas', 'Marutas', 'Rudras', 'Suryas', 'Vajras']

type Phase = 'landing' | 'form' | 'playing' | 'submitting' | 'done' | 'already_played'

interface Score { rank: number; playerName: string; house: string; registerNumber: string; timeSec: number; completedAt: string }

function fmtTime(s: number) {
  const m = String(Math.floor(s / 60)).padStart(2, '0')
  const sec = String(s % 60).padStart(2, '0')
  return `${m}:${sec}`
}

function GamesPage() {
  const [phase, setPhase] = useState<Phase>('landing')
  const [name, setName] = useState('')
  const [house, setHouse] = useState('')
  const [regNum, setRegNum] = useState('')
  const [checking, setChecking] = useState(false)
  const [formErr, setFormErr] = useState('')
  const [result, setResult] = useState<{ timeSec: number; rank?: number } | null>(null)
  const [alreadyScore, setAlreadyScore] = useState<{ time_seconds: number; completed_at: string } | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Listen for game completion postMessage
  const onMessage = useCallback((e: MessageEvent) => {
    if (e.data?.type !== 'LASER_HACK_COMPLETE') return
    const { playerName, house: h, registerNumber, timeSec } = e.data
    submitScore(playerName, h, registerNumber, timeSec)
  }, [])

  useEffect(() => {
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [onMessage])

  // Inject playerData into game iframe once it loads
  const onIframeLoad = () => {
    try {
      iframeRef.current?.contentWindow?.sessionStorage.setItem(
        'playerData',
        JSON.stringify({ playerName: name, house, registerNumber: regNum })
      )
    } catch {
      // cross-origin fallback: pass via postMessage
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'PLAYER_DATA', playerName: name, house, registerNumber: regNum },
        '*'
      )
    }
  }

  const handleStart = async () => {
    setFormErr('')
    if (!name.trim() || !house || !regNum.trim()) { setFormErr('All fields are required.'); return }

    setChecking(true)
    try {
      const res = await fetch(`${API}/api/game/check/${encodeURIComponent(regNum.trim().toUpperCase())}`)
      const json = await res.json()
      if (json.played) {
        setAlreadyScore(json.existing)
        setPhase('already_played')
        setChecking(false)
        return
      }
    } catch { /* allow if check fails */ }

    setChecking(false)
    setPhase('playing')
  }

  const submitScore = async (pName: string, pHouse: string, pReg: string, timeSec: number) => {
    setPhase('submitting')
    try {
      const res = await fetch(`${API}/api/game/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: pName, house: pHouse, registerNumber: pReg, timeSec }),
      })
      const json = await res.json()
      if (json.error === 'already_played') {
        setAlreadyScore(json.existing)
        setPhase('already_played')
      } else {
        setResult({ timeSec })
        setPhase('done')
      }
    } catch {
      setResult({ timeSec })
      setPhase('done')
    }
  }

  return (
    <div className="gp-root">
      <Navbar />
      {/* Animated background */}
      <div className="gp-bg" aria-hidden="true">
        <div className="gp-grid"/>
        <div className="gp-orb gp-orb--a"/>
        <div className="gp-orb gp-orb--b"/>
        <div className="gp-scan"/>
      </div>

      <main className="gp-main">
        {/* ── LANDING ── */}
        {phase === 'landing' && (
          <div className="gp-hero">
            <div className="gp-badge"><Zap size={12}/> SIMMAM 2026 EXCLUSIVE</div>
            <h1 className="gp-title">LASER<span className="gp-title--cyan">HACK</span></h1>
            <p className="gp-sub">Navigate 3 deadly maze levels under the clock. Beat your friends. Claim glory.</p>
            <div className="gp-stats-row">
              <div className="gp-stat"><Users size={16}/>Players allowed: <strong>Once per person</strong></div>
              <div className="gp-stat"><Clock size={16}/>3 Timed Levels</div>
              <div className="gp-stat"><Trophy size={16}/>Leaderboard tracked</div>
            </div>
            <button className="gp-btn gp-btn--primary" onClick={() => setPhase('form')}>
              <Zap size={18}/> LAUNCH GAME
            </button>
          </div>
        )}

        {/* ── FORM ── */}
        {phase === 'form' && (
          <div className="gp-card">
            <div className="gp-card-header">
              <Shield size={22} className="gp-card-icon"/>
              <h2>Player Registration</h2>
            </div>
            <p className="gp-card-sub">You can only play once. Your score will be saved permanently.</p>
            <div className="gp-form">
              <label className="gp-label">Full Name
                <input className="gp-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Arjun Kumar" maxLength={80}/>
              </label>
              <label className="gp-label">House
                <select className="gp-input gp-select" value={house} onChange={e => setHouse(e.target.value)}>
                  <option value="">Select your house…</option>
                  {HOUSES.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </label>
              <label className="gp-label">Register Number
                <input className="gp-input" value={regNum} onChange={e => setRegNum(e.target.value)} placeholder="e.g. 71202104" maxLength={20}/>
              </label>
              {formErr && <div className="gp-err">{formErr}</div>}
              <div className="gp-form-actions">
                <button className="gp-btn gp-btn--ghost" onClick={() => setPhase('landing')}>Back</button>
                <button className="gp-btn gp-btn--primary" onClick={handleStart} disabled={checking}>
                  {checking ? 'Checking…' : <><Zap size={16}/> Start Game</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── PLAYING ── */}
        {phase === 'playing' && (
          <div className="gp-iframe-wrap">
            <div className="gp-iframe-header">
              <span className="gp-badge"><Zap size={10}/> LIVE</span>
              <span className="gp-player-tag">🎮 {name} · {house}</span>
            </div>
            <iframe
              ref={iframeRef}
              src="/game/index.html"
              className="gp-iframe"
              title="SIMMAM Laser Hack Game"
              onLoad={onIframeLoad}
              allow="autoplay"
            />
            <p className="gp-iframe-hint">Complete all 3 levels — your score saves automatically!</p>
          </div>
        )}

        {/* ── SUBMITTING ── */}
        {phase === 'submitting' && (
          <div className="gp-card gp-card--center">
            <div className="gp-spinner"/>
            <h2>Saving your score…</h2>
            <p className="gp-card-sub">Hold tight while we log your time to the leaderboard.</p>
          </div>
        )}

        {/* ── DONE ── */}
        {phase === 'done' && result && (
          <div className="gp-card gp-card--center gp-card--gold">
            <div className="gp-trophy">🏆</div>
            <div className="gp-badge gp-badge--gold"><Star size={10}/> MISSION COMPLETE</div>
            <h2 className="gp-congrats">Congratulations, {name}!</h2>
            <div className="gp-time-display">
              <Clock size={20}/>
              <span>{fmtTime(result.timeSec)}</span>
            </div>
            <p className="gp-card-sub">Your time has been saved to the leaderboard. Check with admin to see your rank!</p>
            <button className="gp-btn gp-btn--primary" onClick={() => setPhase('landing')}>
              Back to Games
            </button>
          </div>
        )}

        {/* ── ALREADY PLAYED ── */}
        {phase === 'already_played' && (
          <div className="gp-card gp-card--center">
            <div className="gp-badge gp-badge--red"><Shield size={10}/> ACCESS DENIED</div>
            <h2>You've already played!</h2>
            {alreadyScore && (
              <div className="gp-time-display">
                <Clock size={18}/>
                <span>Your time: {fmtTime(alreadyScore.time_seconds)}</span>
              </div>
            )}
            <p className="gp-card-sub">Each register number is allowed one play only. Your score is already on the board!</p>
            <button className="gp-btn gp-btn--ghost" onClick={() => setPhase('landing')}>Back</button>
          </div>
        )}
      </main>

      <Footer />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Outfit:wght@300;400;500;600&display=swap');

        .gp-root {
          min-height: 100vh; background: #050508; color: #e8e8f0;
          font-family: 'Outfit', sans-serif; position: relative; overflow-x: hidden;
        }

        /* BG */
        .gp-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
        .gp-grid {
          position: absolute; inset: 0;
          background-image: linear-gradient(rgba(0,255,200,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,200,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
        }
        .gp-orb {
          position: absolute; border-radius: 50%;
          filter: blur(120px); pointer-events: none;
        }
        .gp-orb--a { width: 500px; height: 500px; background: radial-gradient(circle, rgba(0,255,200,0.08) 0%, transparent 70%); top: -100px; left: -100px; animation: orb-drift 15s ease-in-out infinite; }
        .gp-orb--b { width: 400px; height: 400px; background: radial-gradient(circle, rgba(120,80,255,0.08) 0%, transparent 70%); bottom: -50px; right: -50px; animation: orb-drift 18s ease-in-out infinite reverse; }
        @keyframes orb-drift { 0%,100%{transform:translate(0,0);} 50%{transform:translate(40px,-40px);} }
        .gp-scan {
          position: absolute; inset: 0;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,200,0.015) 2px, rgba(0,255,200,0.015) 4px);
        }

        .gp-main {
          position: relative; z-index: 1;
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          padding: 100px 1.5rem 4rem;
        }

        /* HERO */
        .gp-hero { text-align: center; max-width: 600px; }
        .gp-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 14px; border-radius: 999px;
          background: rgba(0,255,200,0.08); border: 1px solid rgba(0,255,200,0.25);
          color: #00ffc8; font-size: 0.65rem; letter-spacing: 0.15em; text-transform: uppercase;
          margin-bottom: 1.5rem;
        }
        .gp-badge--gold { background: rgba(255,213,74,0.1); border-color: rgba(255,213,74,0.3); color: #FFD54A; }
        .gp-badge--red  { background: rgba(255,60,60,0.1); border-color: rgba(255,60,60,0.3); color: #ff6060; }

        .gp-title {
          font-family: 'Orbitron', monospace; font-size: clamp(3.5rem, 10vw, 6rem); font-weight: 900;
          letter-spacing: 0.05em; margin: 0 0 1rem; color: #e8e8f0;
          text-shadow: 0 0 40px rgba(0,255,200,0.3);
        }
        .gp-title--cyan { color: #00ffc8; text-shadow: 0 0 40px rgba(0,255,200,0.6); }
        .gp-sub { font-size: 1.05rem; color: rgba(232,232,240,0.6); max-width: 480px; margin: 0 auto 2rem; line-height: 1.7; }

        .gp-stats-row { display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center; margin-bottom: 2.5rem; }
        .gp-stat { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: rgba(232,232,240,0.5); }
        .gp-stat strong { color: #00ffc8; }

        /* BUTTONS */
        .gp-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 0.75rem 2rem; border-radius: 8px; font-size: 0.95rem; font-weight: 600;
          cursor: pointer; border: none; transition: all 0.2s ease;
          letter-spacing: 0.05em; text-transform: uppercase;
        }
        .gp-btn--primary {
          background: linear-gradient(135deg, #00ffc8, #00c8aa);
          color: #050508; box-shadow: 0 0 24px rgba(0,255,200,0.35);
        }
        .gp-btn--primary:hover { transform: translateY(-2px); box-shadow: 0 0 36px rgba(0,255,200,0.55); }
        .gp-btn--primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .gp-btn--ghost {
          background: transparent; border: 1px solid rgba(232,232,240,0.2); color: rgba(232,232,240,0.7);
        }
        .gp-btn--ghost:hover { border-color: rgba(0,255,200,0.4); color: #00ffc8; }

        /* CARD */
        .gp-card {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; padding: 2.5rem; max-width: 500px; width: 100%;
          backdrop-filter: blur(12px);
          box-shadow: 0 0 60px rgba(0,0,0,0.5);
        }
        .gp-card--center { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
        .gp-card--gold { border-color: rgba(255,213,74,0.25); box-shadow: 0 0 60px rgba(255,213,74,0.1); }
        .gp-card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 0.5rem; }
        .gp-card-header h2 { margin: 0; font-family: 'Orbitron', monospace; font-size: 1.2rem; }
        .gp-card-icon { color: #00ffc8; }
        .gp-card-sub { font-size: 0.85rem; color: rgba(232,232,240,0.5); margin: 0 0 1.5rem; }

        /* FORM */
        .gp-form { display: flex; flex-direction: column; gap: 1rem; }
        .gp-label { display: flex; flex-direction: column; gap: 6px; font-size: 0.8rem; color: rgba(232,232,240,0.6); letter-spacing: 0.05em; text-transform: uppercase; }
        .gp-input {
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px; padding: 0.65rem 1rem; color: #e8e8f0;
          font-size: 0.95rem; font-family: 'Outfit', sans-serif;
          transition: border-color 0.2s ease;
        }
        .gp-input:focus { outline: none; border-color: rgba(0,255,200,0.5); box-shadow: 0 0 0 2px rgba(0,255,200,0.1); }
        .gp-select option { background: #0d0d14; color: #e8e8f0; }
        .gp-err { color: #ff6060; font-size: 0.8rem; }
        .gp-form-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 0.5rem; }

        /* IFRAME */
        .gp-iframe-wrap { width: 100%; max-width: 860px; display: flex; flex-direction: column; gap: 0.75rem; }
        .gp-iframe-header { display: flex; align-items: center; justify-content: space-between; }
        .gp-player-tag { font-size: 0.85rem; color: rgba(232,232,240,0.6); }
        .gp-iframe {
          width: 100%; height: 600px; border: 1px solid rgba(0,255,200,0.2);
          border-radius: 12px; background: #000;
        }
        .gp-iframe-hint { text-align: center; font-size: 0.75rem; color: rgba(232,232,240,0.35); }

        /* RESULT */
        .gp-trophy { font-size: 4rem; }
        .gp-congrats { font-family: 'Orbitron', monospace; font-size: 1.3rem; margin: 0; }
        .gp-time-display {
          display: flex; align-items: center; gap: 10px;
          font-family: 'Orbitron', monospace; font-size: 1.8rem; font-weight: 700;
          color: #FFD54A; text-shadow: 0 0 20px rgba(255,213,74,0.5);
        }
        .gp-spinner {
          width: 48px; height: 48px; border-radius: 50%;
          border: 3px solid rgba(0,255,200,0.15); border-top-color: #00ffc8;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 640px) {
          .gp-iframe { height: 420px; }
          .gp-title { font-size: 3rem; }
        }
      `}</style>
    </div>
  )
}
