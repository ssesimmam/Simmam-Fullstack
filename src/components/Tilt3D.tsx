import { useEffect, useRef } from "react";

/** Wraps content with a mouse-tracked 3D tilt + dynamic spotlight. */
export function Tilt3D({
  children,
  className = "",
  max = 12,
  glare = true,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
  glare?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--rx", `${(-y * max).toFixed(2)}deg`);
        el.style.setProperty("--ry", `${(x * max).toFixed(2)}deg`);
        el.style.setProperty("--gx", `${(50 + x * 70).toFixed(1)}%`);
        el.style.setProperty("--gy", `${(50 + y * 70).toFixed(1)}%`);
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
  }, [max]);

  return (
    <div
      ref={ref}
      className={`group/tilt relative [perspective:1200px] ${className}`}
      style={
        {
          
          "--rx": "0deg",
          "--ry": "0deg",
          "--gx": "50%",
          "--gy": "50%",
        } as React.CSSProperties
      }
    >
      <div
        className="relative h-full w-full transition-transform duration-200 ease-out will-change-transform [transform-style:preserve-3d]"
        style={{ transform: "rotateX(var(--rx)) rotateY(var(--ry))" }}
      >
        {children}
        {glare && (
          <div
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 group-hover/tilt:opacity-100 transition-opacity"
            style={{
              background:
                "radial-gradient(circle at var(--gx) var(--gy), oklch(1 0 0 / 0.18), transparent 40%)",
              mixBlendMode: "overlay",
            }}
          />
        )}
      </div>
    </div>
  );
}
