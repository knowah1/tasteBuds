# tasteBuds 🌱

McGill students connecting through food — learn, teach, potluck, and rescue leftovers. Built for CodeJam 16.
See **CLAUDE.md** for the full product spec and team workflow.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # must pass before merging to main
```

- **Demo Panel:** long-press the logo, or open any URL with `?demo=1`.
- **Skip onboarding (dev):** "Explore with a demo account" on the welcome screen.
- **Reset:** Demo Panel → Reset all data (wipes localStorage and reseeds).

## How the foundation fits together

```
src/
  types/            shared domain types (User, Post, ChatRoom, …)
  mock/
    seed.ts         18 bot users, map zones, posts of every type, forum threads
    db.ts           in-memory DB persisted to localStorage (only api.ts touches it)
    api.ts          the ONLY data layer — async functions + viewer-scoped snapshot()
    simulators.ts   demo bot hooks (stubs; Phase 4)
  store/            Zustand: one slice per feature, mirrors api.snapshot()
  components/ui/    Button, Card, Chip/Badge, Sheet, Modal, Toast, Avatar (Bud SVG), fields…
  app/              PhoneFrame, TopBar/BackBar, TabBar, routes
  features/<name>/  placeholder screens — each track replaces its own
  lib/              xp math, title generation, time, cuisine metadata
```

**Data flow:** components call store actions → store calls `api.*` → the mock DB mutates and
persists → the store re-syncs from `api.snapshot()`.

**Rules live in the API.** `snapshot()` already hides blocked users' Buds/posts/messages/replies and
applies the late-joiner rule to chat messages, so screens can render whatever the store gives them.
XP (incl. milestones and chat cap), level-ups, unlocks, and notifications are awarded inside the API
and surfaced to the UI via `onApiEvent` (wired up in `startStoreBridge`).

## Routes

| Path | Screen | Track |
|---|---|---|
| `/onboarding` | First launch | A |
| `/` | Map | B |
| `/post/:postId`, composer sheet | Event detail, post drafter | C |
| `/profile`, `/user/:userId` | Profiles | C (A: Bud editor) |
| `/chats`, `/chats/:roomId` | Chats | D |
| `/forum`, `/forum/:threadId` | Forum | E |
| `/notifications` | Notification center | Phase 3 |
