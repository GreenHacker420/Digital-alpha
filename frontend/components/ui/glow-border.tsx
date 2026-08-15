import type { HTMLAttributes } from "react";

/**
 * A lightweight, dependency-free interpretation of the animated border-glow
 * pattern popular in modern component libraries. Motion is CSS-only and is
 * disabled by the global prefers-reduced-motion rule.
 */
export function GlowBorder({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={`glow-border ${className}`} {...props} />;
}
