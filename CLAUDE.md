# tasteBuds — Project Context (CLAUDE.md)

> Read this before every task. It is the source of truth for **what** we're building and **how** this repo works. Individual prompts only say *which part* to build next.

## 1. What we're building
**tasteBuds** is a mobile-first web app where McGill students connect through food: learning and teaching cuisines, cooking together at each other's homes, and getting help using up leftovers.

- **Context:** CodeJam 16 hackathon. Judged on **UI polish and working features**, not backend.
- **Priorities, in order:** (1) delightful, polished UI, (2) every core feature works end to end, (3) the demo runs smoothly with one person at the keyboard.
- **No real backend.** Everything is mocked on the client with seeded data and simulated users.
- **Don't stop to ask clarifying questions.** Make sensible decisions and note them in the PR description.

## 2. Tech stack (fixed — don't swap libraries)
- React + Vite + TypeScript (strict)
- Tailwind CSS · Framer Motion · Zustand (persisted to localStorage) · React Router
- Avatars and map are hand-built SVG components (no external image assets)
- Package manager: **npm only** (one lockfile; never commit yarn/pnpm locks)
- All data goes through `src/mock/api.ts`, so a real backend could swap in later

## 3. Glossary
| Term | Meaning |
|---|---|
| **Bud** | A user's plant-bud avatar. Shown wandering on the map |
| **Meetup post** | Learn, Teach, or Potluck. People request to join and cook together in person |
| **Bud-mergency** | A no-meetup "help me use this ingredient" post. Goes to the public Forum |
| **Host / poster** | The user who created a post. Owns its chatroom |
| **Bubble** | The speech bubble above a Bud on the map, showing the post title |

## 4. Product decisions (resolved — don't re-litigate)
- **One chatroom per meetup post**, owned by the host, created when the first join request is accepted.
- **Late joiners see only messages sent after they joined.** Each member stores `joinedAt`, and messages are filtered by it.
- **At event end**, guests are always removed. The host chooses:
  - **Archive:** keeps a read-only copy under Chats → Archived.
  - **Don't archive:** the chat is deleted for everyone.
- Bud-mergencies have **no chatroom**. They live in the Forum.
- Titles are **auto-generated** and can't be freely edited.
- Buds **always wander** within neighbourhood zones, so a real location can never be inferred.

## 5. Features (spec)

### 5.1 Onboarding (first launch)
A multi-step flow with a progress bar:
1. **Account:** unique username (live check), password (min 8 characters, with a strength meter), first name, last name, McGill email (must end in `@mail.mcgill.ca` or `@mcgill.ca`). Validation is inline.
2. **Simulated email verification:** a fake in-app "inbox" toast shows a 6-digit code to type in. Includes resend.
3. **Cuisines:** pick from chips (Indian, Chinese, Italian, Mexican, Lebanese, Japanese, Korean, Ethiopian, French, Haitian, Vietnamese, Greek, Thai, Caribbean, Québécois…). Each one gets a skill level: Curious · Beginner · Home Cook · Confident · Expert. At least one is required.
4. **Create your Bud**, then land on the Map with a celebration.

### 5.2 Buds
- Default: a plain "naked" bud with a cute face.
- Customizable: **color** (8–10 swatches), **bud type** (Sprout, Rosebud, Tulip, Bean Sprout, Mushroom, Cactus Nub), **accessories** (apron, chef hat, beret, glasses, scarf, headphones, toque, oven mitts).
- Accessories are XP-locked: a padlock and "Unlocks at Lv X". Unlocking one shows a celebration modal.
- Built as layered SVG (body → face → accessory).
- States: `idle`, `walking`, `hasBubble`, `panicked` (worried face, sweat drop, shake).
- The editor is reopenable from Profile.

### 5.3 Map (home)
- Illustrated 2D map of the McGill / Milton-Parc area. Pan and zoom.
- About 15–20 seeded Buds plus the user's own (highlighted with a ring), constantly wandering.
- Buds with an open post show a bubble. Bud-mergency Buds look panicked and carry a red "🚨 bud-mergency" banner.
- Tapping a Bud makes it bounce, then opens that user's profile.
- Filter chips: All · Learn · Teach · Potluck · Bud-mergency.

### 5.4 Posts
The "+" button opens a bottom-sheet drafter. Pick a type first:

| Type | Title (= map bubble) | Destination |
|---|---|---|
| Learn | `Want to learn {Cuisine} cuisine` | Map + chatroom |
| Teach | `Want to teach {Cuisine} cuisine` | Map + chatroom |
| Potluck | `Potluck: {Cuisines} welcome!` | Map + chatroom |
| Bud-mergency | `Taking recipe suggestions for {Ingredient}` | Forum |

- **Description:** max **150 characters**, with a live counter.
- **Fields:** cuisine (multi-select for Potluck), start/end time, max participants (1–10).
- **Bud-mergency fields:** an ingredient instead of a cuisine, a duration (30 min / 1 h / 3 h / 6 h / 24 h), no participant cap.
- A live bubble preview appears while drafting. Publishing pops the bubble onto your Bud.
- The bubble stays visible while the event or chatroom is open, or for the length of the emergency.

### 5.5 Profiles & event detail
- Profile shows the Bud, name, @username, level and XP bar, cuisine badges, ongoing events, and past events.
- **Event detail** shows the full post and spots left. The **"Ask to join"** button (with an optional message) moves through Requested → Accepted / Declined.
- The ⋯ menu has Report and Block.

### 5.6 Requests & chatrooms
- The host is notified of each request and sees a card (Bud, name, skills, message) with Accept / Decline.
- Accepted users join the chatroom. A system line announces them ("Maya joined the kitchen 🍳").
- The chat pins the event details at the top and shows a member list. Every message has a report action.
- At the event's end time, or when the host taps "End event", the host sees the archive modal (§4).
- The Chats tab has two segments: **Active** and **Archived**.

### 5.7 Forum (Bud-mergencies)
- Feed sorted by urgency, with countdowns and the ingredient shown as an emoji or tag.
- Threaded replies, 🌱 upvotes, and the original poster can mark one reply "This saved me!" (it gets pinned).
- Threads stay readable after the emergency ends, marked "Resolved".

### 5.8 Notifications
- In-app toasts plus a bell with a notification center and unread badge.
- Triggers: a nearby post, a join request, a request accepted or declined, a new message, a forum reply, a level-up or unlock, an event ending soon.

### 5.9 XP & levels
Everyone starts at 0 XP, Level 1. Each award shows a floating "+XP".

| Action | XP |
|---|---|
| Publish a post | +10 |
| Forum reply | +5 |
| Chat message (cap 10/day) | +1 |
| Reply marked "This saved me!" | +15 |
| Complete an event as a learner | +30 |
| Complete an event as a host or teacher | +40 |
| Milestones (first post; 5/25/100 posts; 10/50 replies; 7/30/100 days registered) | +25 to +100 |

- XP needed per level: `xpForLevel(n) = round(100 * 1.3^(n-1))`.
- Accessory unlocks: Lv2 apron, Lv3 chef hat, Lv5 beret, and so on.

### 5.10 Safety
- Report is available on profiles, posts, chat messages, and forum replies.
- Report reasons: Harassment, Spam, Unsafe meetup, Inappropriate content, Impersonation, Other. Optional details, then a confirmation screen.
- **Block** hides that user's Bud, posts, and messages.
- A one-time safety tip appears before a user's first in-person join request.

## 6. Demo Mode (critical)
- **Seed data:** about 15–20 users, with active posts of every type and at least one Bud-mergency.
- **Simulators:**
  - After a meetup post is published, join requests arrive at about 5 s and 15 s.
  - Accepted bots send a few chat messages.
  - Bud-mergencies get 2–3 bot tips within about 20 s.
- **Demo Panel** (opened by long-pressing the logo, or with `?demo=1`): trigger a join request, fast-forward to event end, +100 XP, simulate a nearby post, reset all data.
- **Demo script (README):**
  1. Onboarding and Bud creation
  2. Map
  3. Post a Learn event
  4. Accept two requests (shows the late-joiner rule)
  5. End the event and archive
  6. Post a Bud-mergency and watch the forum tips arrive
  7. Level up and unlock an accessory
  8. Report a user

## 7. Design system
- **Feel:** warm, cozy, playful — a friendly cooking game, not a corporate app. Low friction: big tap targets, few fields per screen, smart defaults.
- **Colors:**
  - Cream background `#FFF8EE`
  - Leaf greens for Buds
  - McGill red `#ED1B2F` for primary actions
  - Food tones for cuisine tags: tomato, saffron, eggplant
- **Type:** rounded display font (Fredoka or Bricolage Grotesque) for headings, clean sans for body.
- **Style:** chunky rounded cards, soft shadows, springy micro-interactions.
- **Layout:** mobile-first. On desktop, the app sits centered in a ~390×844 phone frame.
- **Navigation:** bottom tabs Map · Forum · Chats · Profile, with a center floating "+" button.
- **Every screen** has an empty state, a loading skeleton, and success toasts.
- **Design tokens** live in `tailwind.config.ts`. Never hard-code hex values in components.

## 8. Data model (`src/types/`)
- `User`, `Bud { color, type, accessories[] }`, `CuisineSkill`
- `Post { id, type, title, description, cuisines[], ingredient?, startAt, endAt, maxParticipants, hostId, status }`
- `JoinRequest { status: 'pending' | 'accepted' | 'declined' }`
- `ChatRoom { postId, ownerId, members: { userId, joinedAt }[], archived }`, `Message`
- `ForumThread`, `ForumReply`, `Notification`, `Report`, `XPEvent`

## 9. Repo & GitHub workflow
Several of us work in parallel through GitHub, so **folder ownership prevents merge conflicts**.

```
src/
  types/            # shared — change only via a small dedicated PR
  mock/             # api.ts, seed.ts, simulators.ts
  store/            # one Zustand slice per feature (userSlice, postSlice, chatSlice…)
  components/ui/    # shared primitives (Button, Card, Sheet, Toast, Avatar)
  features/
    onboarding/  bud/  map/  posts/  profile/
    chat/  forum/  notifications/  xp/  safety/  demo/
  lib/              # helpers (time, xp math, title generation)
```

**Rules:**
- `main` must always build and run (`npm run build` passes).
- One branch per feature: `feat/map`, `feat/chat`, etc. Open a PR into `main` and keep PRs small.
- Work only inside your feature folder and your store slice. Changes to `types/`, `components/ui/`, or `mock/seed.ts` get their own small PR, merged first.
- Commit after each working step, using conventional commits (`feat(map): wandering buds`).
- **Never** reformat files outside your feature (this creates huge diffs). Prettier config is committed. Run it only on files you touched.
- No secrets, no `.env` needed.
- **Deploy:** connect the repo to Vercel, which gives every PR a preview URL to demo from. If using GitHub Pages instead, use `HashRouter` and set `base` in `vite.config.ts`.

## 10. Build phases
**Phase 1 must merge before parallel work starts.**

1. **Foundation:** scaffold, Tailwind tokens, app shell (tabs + phone frame), all types, mock API, seed data, store skeleton, shared UI primitives.
2. **Parallel tracks** after Phase 1:
   - **A** · Bud system and editor → Onboarding
   - **B** · Map and wandering Buds
   - **C** · Post drafter → Profiles and event detail
   - **D** · Requests and chatrooms (late-joiner rule, archive flow)
   - **E** · Forum
3. **Cross-cutting:** notifications, XP and unlocks, report and block.
4. **Demo Panel and simulators,** polish pass, README with the demo script.

## 11. Definition of done
- [ ] A user can register, verify, pick cuisines and skill levels, and build a Bud
- [ ] Buds wander on the map, and tapping one opens its profile
- [ ] All 4 post types produce the right title and bubble; descriptions are capped at 150 characters
- [ ] Bud-mergency Buds look panicked, and the post appears in the Forum
- [ ] Request → accept/decline → chat works; late joiners can't see earlier history
- [ ] Event end triggers the archive prompt, and both branches work
- [ ] XP is awarded for every listed action, levels scale, and accessories unlock
- [ ] Report and block work everywhere they should
- [ ] The demo script runs with no console errors and looks great at phone size
