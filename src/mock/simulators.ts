/**
 * Demo simulators (Phase 4). Phase 1 only defines the interface so features can
 * call these hooks; the bot behaviour (timed join requests, chat lines, forum
 * tips) is filled in by the Demo track.
 *
 * Spec (CLAUDE.md §6):
 *  - After a meetup post is published, join requests arrive at ~5 s and ~15 s.
 *  - Accepted bots send a few chat messages.
 *  - Bud-mergencies get 2–3 bot tips within ~20 s.
 */
import type { ID, Post } from '@/types';

const timers = new Set<ReturnType<typeof setTimeout>>();

/** Schedule a callback that is cancelled by `stopSimulators()`. */
export function schedule(fn: () => void, ms: number) {
  const t = setTimeout(() => {
    timers.delete(t);
    fn();
  }, ms);
  timers.add(t);
}

export function stopSimulators() {
  timers.forEach(clearTimeout);
  timers.clear();
}

/** Called after the signed-in user publishes a post. */
export function onPostPublished(_post: Post): void {
  // TODO(demo): schedule bot join requests / forum tips.
}

/** Called after the host accepts a bot's join request. */
export function onRequestAccepted(_postId: ID, _botId: ID): void {
  // TODO(demo): schedule bot chat lines.
}
