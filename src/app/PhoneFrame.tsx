import type { ReactNode } from 'react';
import { OVERLAY_ROOT_ID } from '@/components/ui';

/**
 * Full-screen on phones; on larger screens the app sits in a centered
 * ~390×844 phone frame. Overlays (sheets, modals, toasts) render inside it.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full w-full items-center justify-center sm:p-6">
      <div className="relative h-full w-full overflow-hidden bg-cream sm:h-phone sm:max-h-full sm:w-phone sm:rounded-[3rem] sm:ring-[10px] sm:ring-ink">
        {/* Notch (desktop only) */}
        <div className="pointer-events-none absolute left-1/2 top-2 z-[70] hidden h-7 w-32 -translate-x-1/2 rounded-full bg-ink sm:block" />
        <div className="relative flex h-full flex-col">{children}</div>
        <div id={OVERLAY_ROOT_ID} className="pointer-events-none absolute inset-0 z-40" />
      </div>
    </div>
  );
}
