import { useState } from "react";
import { Tilt3D } from "./Tilt3D";
import {
  Camera,
  Code2,
  Drama,
  Gamepad2,
  Mic2,
  Music,
  Shirt,
  Sparkles,
  Trophy,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SectionHeader } from "./Dashboard";

type Event = {
  name: string;
  category: string;
  mainCategory: "Tech" | "Non-Tech" | "Sports";
  icon: LucideIcon;
  participants: number;
  prize: string;
};

const events: Event[] = [
  { name: "Pulse Dance Battle", category: "Dance", mainCategory: "Non-Tech", icon: Music, participants: 240, prize: "₹50K" },
  { name: "Voltage Band Wars", category: "Music", mainCategory: "Non-Tech", icon: Mic2, participants: 120, prize: "₹40K" },
  { name: "Hack the Night", category: "Coding", mainCategory: "Tech", icon: Code2, participants: 320, prize: "₹75K" },
  { name: "Esports Arena", category: "Esports", mainCategory: "Sports", icon: Gamepad2, participants: 280, prize: "₹60K" },
  { name: "Lens Republic", category: "Photography", mainCategory: "Non-Tech", icon: Camera, participants: 180, prize: "₹30K" },
  { name: "Stagecraft Drama", category: "Drama", mainCategory: "Non-Tech", icon: Drama, participants: 150, prize: "₹35K" },
  { name: "Royal Runway", category: "Fashion", mainCategory: "Non-Tech", icon: Shirt, participants: 90, prize: "₹45K" },
  { name: "Robo Forge", category: "Technical", mainCategory: "Tech", icon: Wrench, participants: 200, prize: "₹70K" },
  { name: "Treasure Quest", category: "Fun", mainCategory: "Non-Tech", icon: Sparkles, participants: 360, prize: "₹20K" },
  { name: "Quiz Coliseum", category: "Technical", mainCategory: "Tech", icon: Trophy, participants: 220, prize: "₹40K" },
];

const categories = ["All", "Tech", "Non-Tech", "Sports"];

export function Events() {
  const [filter, setFilter] = useState("All");
  const list = filter === "All" ? events : events.filter((e) => e.mainCategory === filter);

  return (
    <section id="events" className="relative py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader
          eyebrow="Events"
          title="48 Battlegrounds. One Crown."
          subtitle="From algorithmic showdowns to runway spectacles — SIMMAM 2026 has a stage for every spark."
        />

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-4 py-2 rounded-full text-xs tracking-wider transition ${
                filter === c
                  ? "bg-gradient-to-r from-[var(--crimson)] to-[var(--gold)] text-background font-semibold shadow-[var(--shadow-glow-red)]"
                  : "glass text-foreground/70 hover:text-gold"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {list.map((e) => (
            <Tilt3D key={e.name} max={10}>
              <div
                className="group relative glass rounded-2xl p-5 hover-lift overflow-hidden h-full"
              >
              <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl bg-[var(--gold)]/30 opacity-50 group-hover:opacity-90 transition" />
              <div className="relative flex items-start justify-between">
                <div className="p-3 rounded-xl bg-gold/10 text-gold neon-border group-hover:scale-110 transition-transform">
                  <e.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] tracking-[0.25em] text-foreground/50">
                  {e.category.toUpperCase()}
                </span>
              </div>
              <div className="relative mt-5">
                <div className="font-display text-xl font-bold text-foreground">{e.name}</div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-foreground/60">{e.participants} participants</span>
                  <span className="text-gradient-gold font-bold">{e.prize}</span>
                </div>
              </div>
              <button className="relative mt-5 w-full py-2.5 rounded-lg text-xs font-semibold border border-gold/30 text-gold hover:bg-gold/10 transition">
                Register →
              </button>
              </div>
            </Tilt3D>
          ))}
        </div>
      </div>
    </section>
  );
}
