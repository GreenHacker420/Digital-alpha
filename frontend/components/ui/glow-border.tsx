import type { HTMLAttributes } from "react";

export function GlowBorder({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={`glow-border ${className}`} {...props} />;
}
