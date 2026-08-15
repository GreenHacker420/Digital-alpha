"use client";

import type { CSSProperties, HTMLAttributes, PointerEvent } from "react";


export function SpotlightCard({
  className = "",
  style,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const updateSpotlight = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
    event.currentTarget.style.setProperty("--spot-opacity", "1");
  };

  const clearSpotlight = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.style.setProperty("--spot-opacity", "0");
  };

  return (
    <div
      className={`spotlight-card ${className}`}
      style={style as CSSProperties}
      onPointerMove={updateSpotlight}
      onPointerLeave={clearSpotlight}
      {...props}
    />
  );
}
