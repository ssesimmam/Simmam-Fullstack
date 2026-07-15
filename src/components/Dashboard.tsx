import { useState } from "react";
import { Award, Building2, Crown, Flame, Trophy, Users, Activity, TrendingUp, ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Counter } from "./Counter";
import { Tilt3D } from "./Tilt3D";
import { useData } from "@/lib/store";
import { HousePointsBreakdown } from "./HousePointsBreakdown";

type Stat = {
  icon: LucideIcon;
  label: string;
  value: number;
  suffix?: string;
  hint: string;
  accent: "gold" | "red";
};

export function Dashboard() {
  const [expandedHouse, setExpandedHouse] = useState<string | null>(null);

  const { houses, events, participants, settings } = useData();
  
  const houseScores = houses.map(h => ({
    name: h.name,
    points: 0,
    color: h.accent,
    accent: h.accent,
    gradient: h.gradient || `linear-gradient(135deg, ${h.accent}, #000)`
  }));
  const leader = [...houses].sort((a, b) => Number(b.points2026 ?? b.points2025 ?? 0) - Number(a.points2026 ?? a.points2025 ?? 0))[0];
  const houseOfTheDay = houses.find((h) => h.name === settings?.houseOfTheDay);

  const stats: Stat[] = [
    { icon: Users, label: "Total Teams", value: houses.length, hint: houses.map((house) => house.name).join(", "), accent: "gold" },
    { icon: Flame, label: "Total Participants", value: participants.length, hint: "Across all events", accent: "red" },
    { icon: Trophy, label: "Total Events", value: events.length, hint: "Synced from the backend", accent: "gold" },
    { icon: Building2, label: "Festival Days", value: 3, hint: "Three days. One legend.", accent: "red" },
    { icon: Crown, label: "Top House Score", value: leader ? Number(leader.points2026 ?? leader.points2025 ?? 0) : 0, suffix: leader ? ` — ${leader.name}` : "", hint: "Leading the rankings", accent: "gold" },
    { icon: Award, label: "Highest Score", value: leader ? Number(leader.points2026 ?? leader.points2025 ?? 0) : 0, hint: leader ? `${leader.name} — Current backend total` : "No house data yet", accent: "red" },
  ];

  return (
    <section id="dashboard" className="relative py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader
          eyebrow="Festival Dashboard"
          title="Live by the Numbers"
          subtitle="A real-time pulse of SIMMAM 2026 — teams, talents, and total intensity."
        />

        {houseOfTheDay && (
          <div className="mb-12">
            <Tilt3D max={5}>
              <div className="relative group glass-strong rounded-3xl p-8 overflow-hidden hover-lift border border-[var(--gold)]/20">
                <div
                  className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-700"
                  style={{
                    background: `radial-gradient(circle at center, ${houseOfTheDay.accent || 'var(--gold)'}, transparent 70%)`
                  }}
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
                        <span className="text-xs font-bold tracking-[0.3em] text-[var(--gold)] uppercase">House of the Day</span>
                        <span className="relative flex w-2.5 h-2.5">
                          <span className="absolute inset-0 rounded-full bg-red-500 animate-ping" />
                          <span className="relative w-2.5 h-2.5 rounded-full bg-red-500" />
                        </span>
                      </div>
                      <h3 className="font-display text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
                        {houseOfTheDay.name}
                      </h3>
                    </div>
                  </div>
                  
                  <div className="text-center md:text-right mt-4 md:mt-0">
                    <div className="font-display text-5xl md:text-6xl font-bold text-gradient-gold">
                      <Counter to={houseOfTheDay.points} />
                    </div>
                    <div className="text-sm font-medium tracking-widest text-foreground/60 uppercase mt-1">Total Points</div>
                  </div>
                </div>
              </div>
            </Tilt3D>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {stats.map((s, i) => (
            <Tilt3D key={s.label} max={9}>
              <div
                className="group relative glass rounded-2xl p-6 hover-lift overflow-hidden animate-rise-in h-full"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* corner glow */}
              <div
                className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-40 group-hover:opacity-70 transition"
                style={{
                  background:
                    s.accent === "gold"
                      ? "oklch(0.78 0.16 80 / 0.7)"
                      : "oklch(0.55 0.22 27 / 0.7)",
                }}
              />
              <div className="relative flex items-start justify-between">
                <div
                  className={`p-3 rounded-xl ${
                    s.accent === "gold"
                      ? "bg-gold/10 text-gold neon-border"
                      : "bg-[var(--crimson)]/15 text-crimson neon-border-red"
                  }`}
                >
                  <s.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] tracking-[0.3em] text-foreground/50">
                  LIVE
                </span>
              </div>

              <div className="relative mt-6">
                <div className="font-display text-5xl font-bold text-gradient-gold">
                  <Counter to={s.value} suffix={s.suffix} />
                </div>
                <div className="mt-2 text-base text-foreground/90 font-medium">
                  {s.label}
                </div>
                <div className="text-xs text-foreground/55 mt-1">{s.hint}</div>
              </div>

              {/* progress sparkline */}
              <div className="relative mt-5 h-1 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: "78%",
                    background:
                      s.accent === "gold"
                        ? "linear-gradient(90deg, var(--gold), var(--crimson))"
                        : "linear-gradient(90deg, var(--crimson-glow), var(--gold))",
                    boxShadow: "0 0 12px var(--gold)",
                  }}
                />
              </div>
              </div>
            </Tilt3D>
          ))}
        </div>

        {/* Live Scores Section with House Logos */}
        <div className="bg-black/60 border border-white/10 rounded-3xl p-6 md:p-10 relative overflow-hidden mt-16">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[var(--crimson)]/30 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[var(--gold)]/30 blur-3xl" />

            <div className="relative flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <span className="relative flex w-2.5 h-2.5">
                  <span className="absolute inset-0 rounded-full bg-red-500 animate-ping" />
                  <span className="relative w-2.5 h-2.5 rounded-full bg-red-500" />
                </span>
                <span className="text-xs tracking-[0.3em] text-gold/80">LIVE • HOUSE RANKINGS</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-foreground/60">
                <span className="inline-flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-gold" /> Auto-sync
                </span>
                <span className="inline-flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-gold" /> Rising
                </span>
              </div>
            </div>

            <div className="relative space-y-4">
              {houseScores.map((house, i) => {
                const houseData = houses.find((h: any) => h.name === house.name);
                const houseId = houseData?.id || '';
                const isExpanded = expandedHouse === houseId;
                const max = 1;

                return (
                  <div 
                    key={house.name} 
                    className="relative rounded-xl transition-colors"
                  >
                    <div
                      className="p-2 -mx-2 rounded-xl transition-colors hover:bg-white/5 cursor-pointer select-none"
                      onClick={() => setExpandedHouse(isExpanded ? null : houseId)}
                    >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <span className="font-display text-2xl font-black text-white/20 w-8 tabular-nums italic">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg tracking-tight text-foreground/90 uppercase">{house.name}</span>
                            {i === 0 && house.points > 0 && <Crown className="w-4 h-4 text-gold animate-bounce" />}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                          <span className="font-display text-3xl font-bold tabular-nums text-gradient-gold leading-none">
                            {house.points}
                          </span>
                          <span className="text-[10px] tracking-[0.2em] text-foreground/30 font-bold uppercase mt-1">Total Score</span>
                        </div>
                        {houseId && (
                          <ChevronDown
                            className={`w-4 h-4 text-foreground/30 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        )}
                      </div>
                    </div>

                    {/* Total Points Progress Bar */}
                    <div className="relative group/bar">
                      <div className="h-4 rounded-full bg-white/5 border border-white/10 overflow-hidden backdrop-blur-sm relative">
                        <div
                          className="absolute inset-y-0 left-0 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                          style={{
                            width: `${max > 0 ? (house.points / max) * 100 : 0}%`,
                            background: house.gradient,
                            boxShadow: `inset 0 1px 1px rgba(255,255,255,0.2), 0 0 25px ${house.color}66`,
                          }}
                        >
                          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,oklch(1_0_0/0.3),transparent)] bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite]" />
                        </div>
                      </div>
                    </div>
                    </div>

                    {/* Expandable Breakdown */}
                    {houseId && (
                      <div className="px-2">
                        <HousePointsBreakdown
                          houseId={houseId}
                          houseName={house.name}
                          houseAccent={house.accent}
                          isOpen={isExpanded}
                          onToggle={() => setExpandedHouse(isExpanded ? null : houseId)}
                        />
                      </div>
                    )}

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
