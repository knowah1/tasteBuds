import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export const OVERLAY_ROOT_ID = 'phone-overlay-root';

/** Renders children into the phone frame's overlay layer (so sheets stay inside the phone). */
export function Portal({ children }: { children: ReactNode }) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  useEffect(() => setEl(document.getElementById(OVERLAY_ROOT_ID) ?? document.body), []);
  return el ? createPortal(children, el) : null;
}
