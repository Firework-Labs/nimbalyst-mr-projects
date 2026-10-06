/**
 * A poster image with its HTML overlays (the green "Sandboxed" chip). Shared
 * by the left-column dock and the settings preview so both look identical.
 * Overlays are HTML rather than baked into the SVG so they also work on
 * image posters and stay crisp at any size.
 */
import type { ReactNode } from 'react';

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function SandboxedChip() {
  return (
    <span className="pt-chip-sandboxed" title="This project runs in a sandbox">
      <ShieldIcon />
      Sandboxed
    </span>
  );
}

export function PosterFrame({ src, alt, sandboxed, className, children }: { src: string; alt: string; sandboxed: boolean; className?: string; children?: ReactNode }) {
  return (
    <div className={`pt-poster-frame${className ? ` ${className}` : ''}`}>
      <img src={src} alt={alt} draggable={false} />
      {sandboxed ? <SandboxedChip /> : null}
      {children}
    </div>
  );
}
