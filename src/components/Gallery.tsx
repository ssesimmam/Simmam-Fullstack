import g1 from "@/assets/gallery-1.jpg";
import g2 from "@/assets/gallery-2.jpg";
import g3 from "@/assets/gallery-3.jpg";
import g4 from "@/assets/gallery-4.jpg";
import g5 from "@/assets/gallery-5.jpg";
import g6 from "@/assets/gallery-6.jpg";
import { SectionHeader } from "./Dashboard";

const items = [
  { src: g1, label: "Pulse Dance", span: "row-span-2" },
  { src: g2, label: "Opening Fireworks", span: "" },
  { src: g3, label: "Concert Night", span: "" },
  { src: g4, label: "Awards Gala", span: "row-span-2" },
  { src: g5, label: "Esports Arena", span: "" },
  { src: g6, label: "Royal Runway", span: "" },
];

export function Gallery() {
  return (
    <section id="gallery" className="relative py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader
          eyebrow="Gallery"
          title="Moments That Stayed"
          subtitle="A cinematic glimpse at the energy that defines SIMMAM."
        />

        <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[180px] md:auto-rows-[220px] gap-4">
          {items.map((it, i) => (
            <div
              key={i}
              className={`group relative rounded-2xl overflow-hidden glass hover-lift ${it.span}`}
            >
              <img
                src={it.src}
                alt={it.label}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent opacity-80 group-hover:opacity-60 transition" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <div className="text-[10px] tracking-[0.3em] text-gold/80">SIMMAM • 2025</div>
                <div className="font-display text-lg text-foreground mt-0.5">{it.label}</div>
              </div>
              <div className="absolute inset-0 ring-1 ring-inset ring-[var(--gold)]/0 group-hover:ring-[var(--gold)]/40 transition" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
