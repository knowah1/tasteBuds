import { uid } from '@/lib/id';
import type { SliceCreator } from './types';

export type ToastKind = 'success' | 'info' | 'error' | 'inbox';

export interface Toast {
  id: string;
  kind: ToastKind;
  title: string;
  body?: string;
  /** ms; 0 = sticky until dismissed. */
  duration: number;
  href?: string;
}

export type MapFilter = 'all' | 'learn' | 'teach' | 'potluck' | 'budmergency';
export type ChatsSegment = 'active' | 'archived';

export interface UISlice {
  toasts: Toast[];
  pushToast: (
    toast: Omit<Toast, 'id' | 'duration' | 'kind'> & Partial<Pick<Toast, 'duration' | 'kind'>>,
  ) => string;
  dismissToast: (id: string) => void;
  demoPanelOpen: boolean;
  setDemoPanelOpen: (open: boolean) => void;
  composerOpen: boolean;
  setComposerOpen: (open: boolean) => void;
  // Persisted preferences
  mapFilter: MapFilter;
  setMapFilter: (filter: MapFilter) => void;
  chatsSegment: ChatsSegment;
  setChatsSegment: (segment: ChatsSegment) => void;
}

export const createUISlice: SliceCreator<UISlice> = (set) => ({
  toasts: [],
  pushToast: (toast) => {
    const id = uid('toast');
    set((s) => ({
      toasts: [...s.toasts.slice(-3), { kind: 'info', duration: 3500, ...toast, id }],
    }));
    return id;
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  demoPanelOpen: false,
  setDemoPanelOpen: (open) => set({ demoPanelOpen: open }),
  composerOpen: false,
  setComposerOpen: (open) => set({ composerOpen: open }),
  mapFilter: 'all',
  setMapFilter: (mapFilter) => set({ mapFilter }),
  chatsSegment: 'active',
  setChatsSegment: (chatsSegment) => set({ chatsSegment }),
});
