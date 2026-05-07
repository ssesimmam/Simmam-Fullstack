import { useEffect, useRef } from "react";
import lion from "@/assets/simmam-lion.png";

export function LionEmblem({
  size = 220,
  className = "",
  interactive = true,
}: {
  size?: number;
  className?: string;
  interactive?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!interactive) return;
    const el = wrapRef.current;
    if (!el) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--rx", `${(-y * 16).toFixed(2)}deg`);
        el.style.setProperty("--ry", `${(x * 20).toFixed(2)}deg`);
      });
    };
    const onLeave = () => {
      el.style.setProperty("--rx", `0deg`);
      el.style.setProperty("--ry", `0deg`);
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [interactive]);

  return (
    <div
      ref={wrapRef}
      className={`relative inline-flex items-center justify-center [perspective:1000px] ${className}`}
      style={
        {
          width: size,
          height: size,
          "--rx": "0deg",
          "--ry": "0deg",
        } as React.CSSProperties
      }
    >
      <div
        className="relative w-full h-full will-change-transform transition-transform duration-200 ease-out"
        style={{
          transform: "rotateX(var(--rx)) rotateY(var(--ry))",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Soft ambient glow behind the crest, shaped to its silhouette */}
        <img
          src={lion}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none animate-pulse-glow"
          style={{
            filter:
              "blur(24px) saturate(160%) drop-shadow(0 0 30px oklch(0.78 0.16 80 / 0.6))",
            opacity: 0.7,
            transform: "translateZ(0px) scale(1.05)",
          }}
        />

        {/* Lion crest in original shape */}
        <img
          src={lion}
          alt="SIMMAM 2026 crest"
          width={size}
          height={size}
          draggable={false}
          className="relative w-full h-full object-contain"
          style={{
            transform: "translateZ(60px)",
            filter:
              "drop-shadow(0 8px 18px oklch(0 0 0 / 0.55)) drop-shadow(0 0 14px oklch(0.78 0.16 80 / 0.45))",
          }}
        />
      </div>
    </div>
  );
}
