import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { api } from '@/mock/api';
import { levelProgress } from '@/lib/xp';
import type { ID } from '@/types';
import type { AppState } from './types';
import { createSessionSlice, snapshotToState } from './sessionSlice';
import { createUserSlice } from './userSlice';
import { createPostSlice } from './postSlice';
import { createChatSlice } from './chatSlice';
import { createForumSlice } from './forumSlice';
import { createNotificationSlice } from './notificationSlice';
import { createXPSlice } from './xpSlice';
import { createSafetySlice } from './safetySlice';
import { createUISlice } from './uiSlice';

export type { AppState } from './types';
export type { Toast, ToastKind, MapFilter, ChatsSegment } from './uiSlice';
export type { XPFloater } from './xpSlice';

/**
 * One app store composed of feature slices.
 * Entity data mirrors the mock API (which persists itself); only UI
 * preferences are persisted here.
 */
export const useStore = create<AppState>()(
  persist(
    (...a) => ({
      ...createSessionSlice(...a),
      ...createUserSlice(...a),
      ...createPostSlice(...a),
      ...createChatSlice(...a),
      ...createForumSlice(...a),
      ...createNotificationSlice(...a),
      ...createXPSlice(...a),
      ...createSafetySlice(...a),
      ...createUISlice(...a),
      ...snapshotToState(api.snapshot()),
    }),
    {
      name: 'tastebuds:ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ mapFilter: s.mapFilter, chatsSegment: s.chatsSegment }),
    },
  ),
);

let bridgeStarted = false;

/** Keeps the store in sync with the mock API and routes side-channel events to the UI. */
export function startStoreBridge() {
  if (bridgeStarted) return;
  bridgeStarted = true;
  api.onDataChange(() => useStore.getState().sync());
  api.onApiEvent((e) => {
    const s = useStore.getState();
    switch (e.type) {
      case 'xp':
        s.pushXpFloater(e.result.event.amount, e.result.event.label);
        if (e.result.toLevel > e.result.fromLevel) s.setPendingLevelUp(e.result.toLevel);
        if (e.result.unlocked.length) s.queueUnlocks(e.result.unlocked);
        break;
      case 'notification':
        s.pushToast({ title: e.notification.title, body: e.notification.body, href: e.notification.href });
        break;
      case 'verificationCode':
        s.pushToast({
          kind: 'inbox',
          emoji: '📬',
          title: 'New email · tasteBuds',
          body: `Your verification code is ${e.code}`,
          duration: 0,
        });
        break;
    }
  });
  useStore.getState().sync();
}

// ─── Selectors ──────────────────────────────────────────────────────

export const selectUser = (id: ID | undefined) => (s: AppState) =>
  id ? s.users.find((u) => u.id === id) : undefined;

export const selectPost = (id: ID | undefined) => (s: AppState) =>
  id ? s.posts.find((p) => p.id === id) : undefined;

export const selectUnreadCount = (s: AppState) => s.notifications.filter((n) => !n.read).length;

export const selectMyLevel = (s: AppState) => levelProgress(s.me?.xp ?? 0);

/** Signed in, email verified, and at least one cuisine picked. */
export const selectIsOnboarded = (s: AppState) =>
  !!s.me && !!s.account?.emailVerified && s.me.cuisines.length > 0;
