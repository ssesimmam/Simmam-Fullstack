import { useEffect, useState } from "react";
import { Activity, Flame, TrendingUp } from "lucide-react";
import { SectionHeader } from "./Dashboard";

const initial = [
  { team: "CSE", points: 482, color: "oklch(0.78 0.16 80)" },
  { team: "MECH", points: 451, color: "oklch(0.62 0.27 25)" },
  { team: "ECE", points: 438, color: "oklch(0.70 0.18 200)" },
  { team: "IT", points: 412, color: "oklch(0.72 0.18 290)" },
  { team: "EEE", points: 388, color: "oklch(0.78 0.18 130)" },
  { team: "CIVIL", points: 340, color: "oklch(0.68 0.14 50)" },
];

export function LiveScores() {
  const [scores, setScores] = useState(initial);

  useEffect(() => {
    const id = setInterval(() => {
      setScores((prev) =>
        [...prev]
          .map((s) => ({ ...s, points: s.points + Math.floor(Math.random() * 6) }))
          .sort((a, b) => b.points - a.points),
      );
    }, 2200);
    return () => clearInterval(id);
  }, []);

  const max = Math.max(...scores.map((s) => s.points));

  return (
    <section id="live" className="relative py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader
          eyebrow="Live Scoreboard"
          title="The Battle, In Real Time"
          subtitle="Updated every moment. Watch the leaderboard shift as the festival breathes."
        />

        <div className="glass-strong rounded-3xl p-6 md:p-10 relative overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[var(--crimson)]/30 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[var(--gold)]/30 blur-3xl" />

          <div className="relative flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <span className="relative flex w-2.5 h-2.5">
                <span className="absolute inset-0 rounded-full bg-red-500 animate-ping" />
                <span className="relative w-2.5 h-2.5 rounded-full bg-red-500" />
              </span>
              <span className="text-xs tracking-[0.3em] text-gold/80">LIVE • DAY 02</span>
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
            {scores.map((s, i) => (
              <div key={s.team} className="relative">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-3">
                    <span className="font-display text-lg text-gold w-6">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-semibold text-foreground">{s.team}</span>
                    {i === 0 && <Flame className="w-4 h-4 text-[var(--crimson-glow)] animate-pulse" />}
                  </div>
                  <span className="font-display text-xl tabular-nums text-gradient-gold">
                    {s.points}
                  </span>
                </div>
                <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 relative"
                    style={{
                      width: `${(s.points / max) * 100}%`,
                      background: `linear-gradient(90deg, ${s.color}, var(--gold))`,
                      boxShadow: `0 0 20px ${s.color}`,
                    }}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,oklch(1_0_0/0.4),transparent)] bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
