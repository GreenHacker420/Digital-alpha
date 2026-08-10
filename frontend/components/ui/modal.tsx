"use client";

import { useEffect, useRef } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const selector =
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => {
      (panel?.querySelector(selector) as HTMLElement | null)?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panel) return;

      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(selector));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      previous?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div ref={panelRef} className="modal-panel" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">Details</p>
            <h2>{title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
