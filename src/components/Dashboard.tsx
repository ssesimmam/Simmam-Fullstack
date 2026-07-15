import { useState } from "react";
import { Crown, Activity, TrendingUp, ChevronDown } from "lucide-react";
import { Counter } from "./Counter";
import { Tilt3D } from "./Tilt3D";
import { houses } from "@/lib/houses";

export function Dashboard() {
  const [expandedHouse, setExpandedHouse] = useState<string | null>(null);

  // ── All static — zero DB/Supabase calls ──
  const manualPoints: Record<string, number> = {
    "Agniyas": 44100,
    "Dhronas": 63217,
    "Marutas": 53511,
    "Rudras":  58760,
    "Suryas":  58775,
    "Vajras":  39901,
  };

  const houseScores = houses
    .map(h => ({
      name:     h.name,
      points:   manualPoints[h.name] ?? 0,
      color:    h.accent,
      accent:   h.accent,
      gradient: h.gradient || `linear-gradient(135deg, ${h.accent}, #000)`,
    }))
    .sort((a, b) => b.points - a.points);

  const maxPoints = Math.max(...houseScores.map(s => s.points), 1);
  const topHouse  = houseScores[0];

  return (
    <section id="dashboard" className="relative py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader
          eyebrow="Festival Dashboard"
          title="Final Standings"
          subtitle="SIMMAM 2026 final house rankings and total points."
        />

        {/* Current Leader Banner */}
        {topHouse && (
          <div className="mb-12">
            <Tilt3D max={5}>
              <div className="relative group glass-strong rounded-3xl p-8 overflow-hidden hover-lift border border-[var(--gold)]/20">
                <div
                  className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-700"
                  style={{ background: `radial-gradient(circle at center, ${topHouse.color}, transparent 70%)` }}
                />
                <div className="relative flex flex-col md:flex-row items-center gap-8 justify-between">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-black/50 border border-white/10 backdrop-blur-md">
                        <Crown className="w-10 h-10 text-[var(--gold)] animate-bounce" />
                      </div>
                      <div className="absolute -inset-2 bg-[var(--gold)]/20 blur-xl rounded-full -z-10 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-bold tracking-[0.3em] text-[var(--gold)] uppercase">🏆 Current Leader</span>
                      </div>
                      <h3 className="font-display text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
                        {topHouse.name}
                      </h3>
                    </div>
                  </div>
                  <div className="text-center md:text-right mt-4 md:mt-0">
                    <div className="font-display text-5xl md:text-6xl font-bold text-gradient-gold">
                      <Counter to={topHouse.points} />
                    </div>
                    <div className="text-sm font-medium tracking-widest text-foreground/60 uppercase mt-1">Total Points</div>
                  </div>
                </div>
              </div>
            </Tilt3D>
          </div>
        )}

        {/* House Rankings Leaderboard */}
        <div className="bg-black/60 border border-white/10 rounded-3xl p-6 md:p-10 relative overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[var(--crimson)]/30 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[var(--gold)]/30 blur-3xl" />

          <div className="relative flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <span className="relative flex w-2.5 h-2.5">
                <span className="absolute inset-0 rounded-full bg-red-500 animate-ping" />
                <span className="relative w-2.5 h-2.5 rounded-full bg-red-500" />
              </span>
              <span className="text-xs tracking-[0.3em] text-gold/80">FINAL • HOUSE RANKINGS</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-foreground/60">
              <span className="inline-flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-gold" /> Updated
              </span>
              <span className="inline-flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-gold" /> Ranked
              </span>
            </div>
          </div>

          <div className="relative space-y-4">
            {houseScores.map((house, i) => {
              const isExpanded = expandedHouse === house.name;

              return (
                <div key={house.name} className="relative rounded-xl transition-colors">
                  <div
                    className="p-2 -mx-2 rounded-xl transition-colors hover:bg-white/5 cursor-pointer select-none"
                    onClick={() => setExpandedHouse(isExpanded ? null : house.name)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <span className="font-display text-2xl font-black text-white/20 w-8 tabular-nums italic">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg tracking-tight text-foreground/90 uppercase">{house.name}</span>
                            {i === 0 && <Crown className="w-4 h-4 text-gold animate-bounce" />}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                          <span className="font-display text-3xl font-bold tabular-nums text-gradient-gold leading-none">
                            {house.points.toLocaleString()}
                          </span>
                          <span className="text-[10px] tracking-[0.2em] text-foreground/30 font-bold uppercase mt-1">Total Score</span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-foreground/30 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative">
                      <div className="h-4 rounded-full bg-white/5 border border-white/10 overflow-hidden backdrop-blur-sm relative">
                        <div
                          className="absolute inset-y-0 left-0 transition-all duration-1000 ease-out"
                          style={{
                            width: `${(house.points / maxPoints) * 100}%`,
                            background: house.gradient,
                            boxShadow: `inset 0 1px 1px rgba(255,255,255,0.2), 0 0 25px ${house.color}66`,
                          }}
                        >
                          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,oklch(1_0_0/0.3),transparent)] bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="text-center max-w-3xl mx-auto mb-14">
      <div className="inline-flex items-center gap-3 mb-4">
        <span className="h-px w-10 bg-gradient-to-r from-transparent to-[var(--gold)]" />
        <span className="text-[10px] md:text-xs tracking-[0.4em] text-gold/80">
          {eyebrow.toUpperCase()}
        </span>
        <span className="h-px w-10 bg-gradient-to-l from-transparent to-[var(--gold)]" />
      </div>
      <h2 className="font-display text-4xl md:text-6xl font-bold text-gradient-fire">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-foreground/70 text-base md:text-lg">{subtitle}</p>
      )}
    </div>
  );
}
