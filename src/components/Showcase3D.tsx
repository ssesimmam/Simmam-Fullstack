import { Crown, Medal, Sparkles, Trophy } from "lucide-react";
import { SectionHeader } from "./Dashboard";
import { Tilt3D } from "./Tilt3D";

const orbs = [
  {
    icon: Crown,
    label: "Champions Cup",
    sub: "The crown of SIMMAM",
    color: "oklch(0.85 0.17 85)",
    glow: "oklch(0.88 0.18 88)",
  },
  {
    icon: Trophy,
    label: "Runner-Up Shield",
    sub: "Silver glory awaits",
    color: "oklch(0.85 0.02 90)",
    glow: "oklch(0.92 0.02 90)",
  },
  {
    icon: Medal,
    label: "Bronze Medallion",
    sub: "Honors of the brave",
    color: "oklch(0.62 0.14 50)",
    glow: "oklch(0.72 0.18 55)",
  },
  {
    icon: Sparkles,
    label: "Spirit Award",
    sub: "For the loudest tribe",
    color: "oklch(0.55 0.22 27)",
    glow: "oklch(0.62 0.27 25)",
  },
];

export function Showcase3D() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Layered depth backdrops */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[80vh] rounded-full opacity-40"
          style={{
            background:
              "conic-gradient(from 0deg, oklch(0.55 0.22 27 / 0.3), oklch(0.78 0.16 80 / 0.3), oklch(0.55 0.22 27 / 0.3))",
            filter: "blur(120px)",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        <SectionHeader
          eyebrow="The Trophies"
          title="Forged in Gold. Earned on Stage."
          subtitle="Hover to feel the weight. Each award represents a season of brilliance."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {orbs.map((o, i) => (
            <Tilt3D key={o.label} max={18}>
              <div className="relative glass-strong rounded-3xl p-6 pb-7 text-center overflow-hidden h-full neon-border">
                {/* Floating 3D orb */}
                <div
                  className="relative mx-auto mb-5 animate-float"
                  style={{
                    transform: "translateZ(60px)",
                    animationDelay: `${i * 0.3}s`,
                  }}
                >
                  <div className="relative w-32 h-32 mx-auto">
                    {/* Orb shadow */}
                    <div
                      className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-24 h-4 rounded-full blur-xl opacity-70"
                      style={{ background: o.glow }}
                    />
                    {/* Orb sphere */}
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `radial-gradient(circle at 30% 25%, oklch(1 0 0 / 0.85), ${o.color} 35%, oklch(0.12 0.02 25) 90%)`,
                        boxShadow: `0 0 60px ${o.glow}, inset -10px -20px 40px oklch(0 0 0 / 0.6), inset 10px 15px 30px oklch(1 0 0 / 0.15)`,
                      }}
                    />
                    {/* Orbit ring */}
                    <div className="absolute inset-[-8px] rounded-full border border-dashed animate-spin-slow"
                      style={{ borderColor: `${o.glow}` }}
                    />
                    {/* Highlight */}
                    <div
                      className="absolute top-3 left-5 w-10 h-6 rounded-full opacity-80 blur-md"
                      style={{ background: "oklch(1 0 0 / 0.7)" }}
                    />
                    {/* Icon */}
                    <div
                      className="absolute inset-0 grid place-items-center"
                      style={{ transform: "translateZ(20px)" }}
                    >
                      <o.icon className="w-10 h-10 text-background drop-shadow-lg" />
                    </div>
                  </div>
                </div>

                <div
                  className="font-display text-xl font-bold text-gradient-gold"
                  style={{ transform: "translateZ(40px)" }}
                >
                  {o.label}
                </div>
                <div
                  className="text-xs text-foreground/60 mt-1"
                  style={{ transform: "translateZ(30px)" }}
                >
                  {o.sub}
                </div>

                {/* corner sparkle */}
                <div
                  className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-50"
                  style={{ background: o.glow }}
                />
              </div>
            </Tilt3D>
          ))}
        </div>
      </div>
    </section>
  );
}
