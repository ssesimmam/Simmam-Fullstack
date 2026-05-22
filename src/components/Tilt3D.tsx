import React, { useEffect, useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
  max?: number;
  className?: string;
};

export function Tilt3D({
  children,
  max = 10,
  className = "",
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rx = ((y / rect.height) - 0.5) * -max * 2;
    const ry = ((x / rect.width) - 0.5) * max * 2;
    ref.current.style.setProperty("--rx", `${rx}deg`);
    ref.current.style.setProperty("--ry", `${ry}deg`);
  };

  const reset = () => {
    if (!ref.current) return;
    ref.current.style.setProperty("--rx", `0deg`);
    ref.current.style.setProperty("--ry", `0deg`);
  };

  return (
    <div
      ref={ref}
      className={`group/tilt relative [perspective:1200px] ${className}`}
      style={{
        "--rx": "0deg",
        "--ry": "0deg",
      } as React.CSSProperties}
      onMouseMove={handleMove}
      onMouseLeave={reset}
    >
      <div
        className="transition-transform duration-200 will-change-transform"
        style={{
          transform: "rotateX(var(--rx)) rotateY(var(--ry))",
        }}
      >
        {children}
      </div>
    </div>
  );
}