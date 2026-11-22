import type { ReactNode } from 'react';
import { OVERLAY_ROOT_ID } from '@/components/ui';

/**
 * Full-screen on phones; on larger screens the app sits in a centered
 * ~390×844 phone frame. Overlays (sheets, modals, toasts) render inside it.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full w-full items-center justify-center sm:p-6">
      <SketchFilters />
      <div className="relative h-full w-full overflow-hidden bg-cream sm:h-phone sm:max-h-full sm:w-phone sm:rounded-[3rem] sm:ring-[10px] sm:ring-ink">
        {/* Notch (desktop only) */}
        <div className="pointer-events-none absolute left-1/2 top-2 z-[70] hidden h-7 w-32 -translate-x-1/2 rounded-full bg-ink sm:block" />
        <div className="relative flex h-full flex-col">{children}</div>
        <div id={OVERLAY_ROOT_ID} className="pointer-events-none absolute inset-0 z-40" />
      </div>
    </div>
  );
}

/**
 * The wobble behind every `edge-*` outline: low-frequency noise nudges the stroke
 * by about a pixel, so borders look drawn by hand. Applied to ::before strokes only,
 * never to text.
 */
function SketchFilters() {
  return (
    <svg aria-hidden width="0" height="0" className="pointer-events-none absolute">
      <filter id="tb-wobble" x="-4%" y="-4%" width="108%" height="108%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" />
        <feDisplacementMap
          in="SourceGraphic"
          scale="2.6"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}
