import type {
  ChatRoom,
  Cuisine,
  CuisineSkill,
  ForumReply,
  ForumThread,
  Message,
  Post,
  User,
  Zone,
} from '@/types';
import { generateTitle } from '@/lib/titles';
import { DAY, HOUR, MINUTE } from '@/lib/time';

/** Map is 1000 × 1400 units; zones are neighbourhood boxes Buds wander inside. */
export const MAP_SIZE = { width: 1000, height: 1400 } as const;

export const ZONES: Zone[] = [
  { id: 'z_campus', name: 'McGill Campus', x: 330, y: 560, width: 360, height: 300 },
  { id: 'z_miltonparc', name: 'Milton-Parc', x: 560, y: 250, width: 320, height: 280 },
  { id: 'z_ghetto', name: 'McGill Ghetto', x: 120, y: 250, width: 380, height: 260 },
  { id: 'z_plateau', name: 'Plateau edge', x: 640, y: 40, width: 300, height: 180 },
  { id: 'z_park', name: 'Mont-Royal foot', x: 40, y: 40, width: 520, height: 170 },
  { id: 'z_downtown', name: 'Downtown', x: 200, y: 920, width: 600, height: 280 },
  { id: 'z_parc', name: 'Parc Ave', x: 760, y: 560, width: 200, height: 320 },
];

interface BotSpec {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  color: User['bud']['color'];
  type: User['bud']['type'];
  accessories: User['bud']['accessories'];
  cuisines: [Cuisine, CuisineSkill['level']][];
  xp: number;
  zoneId: string;
  bio: string;
}

const BOTS: BotSpec[] = [
  { id: 'u_maya', username: 'maya.cooks', firstName: 'Maya', lastName: 'Haddad', color: 'rose', type: 'rosebud', accessories: ['apron'], cuisines: [['Lebanese', 'Expert'], ['French', 'Home Cook']], xp: 420, zoneId: 'z_miltonparc', bio: 'Teta’s recipes, U2 Nutrition. Will trade fattoush for gossip.' },
  { id: 'u_arjun', username: 'arjun_tadka', firstName: 'Arjun', lastName: 'Mehta', color: 'butter', type: 'sprout', accessories: ['chefHat', 'apron'], cuisines: [['Indian', 'Expert'], ['Thai', 'Beginner']], xp: 610, zoneId: 'z_ghetto', bio: 'Comp Sci by day, dal by night.' },
  { id: 'u_lea', username: 'lea_poutine', firstName: 'Léa', lastName: 'Tremblay', color: 'peach', type: 'tulip', accessories: ['toque', 'scarf'], cuisines: [['Québécois', 'Confident'], ['French', 'Confident']], xp: 350, zoneId: 'z_plateau', bio: 'Tourtière evangelist. Sugar shack every spring.' },
  { id: 'u_kenji', username: 'kenji.umami', firstName: 'Kenji', lastName: 'Sato', color: 'sky', type: 'mushroom', accessories: ['headphones'], cuisines: [['Japanese', 'Confident'], ['Korean', 'Home Cook']], xp: 280, zoneId: 'z_campus', bio: 'Ramen broth takes 12 hours and so does my thesis.' },
  { id: 'u_sofia', username: 'sofia.salsa', firstName: 'Sofía', lastName: 'Ramírez', color: 'lime', type: 'cactusNub', accessories: ['glasses'], cuisines: [['Mexican', 'Expert'], ['Caribbean', 'Curious']], xp: 515, zoneId: 'z_downtown', bio: 'Tortillas from scratch or bust 🌮' },
  { id: 'u_wei', username: 'wei_dumpling', firstName: 'Wei', lastName: 'Chen', color: 'mint', type: 'beanSprout', accessories: ['apron', 'glasses'], cuisines: [['Chinese', 'Expert'], ['Vietnamese', 'Home Cook']], xp: 700, zoneId: 'z_miltonparc', bio: 'Dumpling-folding speedrunner. 40/min PB.' },
  { id: 'u_selam', username: 'selam.injera', firstName: 'Selam', lastName: 'Bekele', color: 'cocoa', type: 'sprout', accessories: ['scarf'], cuisines: [['Ethiopian', 'Expert']], xp: 390, zoneId: 'z_parc', bio: 'Berbere is a personality trait.' },
  { id: 'u_jules', username: 'jules.bistro', firstName: 'Jules', lastName: 'Moreau', color: 'lilac', type: 'tulip', accessories: ['beret'], cuisines: [['French', 'Expert'], ['Italian', 'Confident']], xp: 830, zoneId: 'z_ghetto', bio: 'Exchange student from Lyon. Butter is a food group.' },
  { id: 'u_nadia', username: 'nadia.griot', firstName: 'Nadia', lastName: 'Joseph', color: 'butter', type: 'rosebud', accessories: [], cuisines: [['Haitian', 'Confident'], ['Caribbean', 'Home Cook']], xp: 160, zoneId: 'z_downtown', bio: 'Griot and pikliz, every Sunday.' },
  { id: 'u_minh', username: 'minh.pho', firstName: 'Minh', lastName: 'Nguyen', color: 'leaf', type: 'beanSprout', accessories: ['headphones'], cuisines: [['Vietnamese', 'Confident'], ['Thai', 'Home Cook']], xp: 240, zoneId: 'z_campus', bio: 'Pho on a hot plate in residence. Ask me how.' },
  { id: 'u_eleni', username: 'eleni.olive', firstName: 'Eleni', lastName: 'Papadakis', color: 'sage', type: 'naked', accessories: [], cuisines: [['Greek', 'Expert'], ['Lebanese', 'Beginner']], xp: 300, zoneId: 'z_park', bio: 'Yiayia-approved spanakopita.' },
  { id: 'u_ploy', username: 'ploy.curry', firstName: 'Ploy', lastName: 'Srisai', color: 'mint', type: 'tulip', accessories: ['apron'], cuisines: [['Thai', 'Expert'], ['Japanese', 'Beginner']], xp: 455, zoneId: 'z_miltonparc', bio: 'Green curry paste, pounded by hand.' },
  { id: 'u_gio', username: 'gio.pasta', firstName: 'Giovanni', lastName: 'Russo', color: 'peach', type: 'mushroom', accessories: ['chefHat'], cuisines: [['Italian', 'Expert']], xp: 760, zoneId: 'z_parc', bio: 'Never break the spaghetti.' },
  { id: 'u_jiwoo', username: 'jiwoo.kimchi', firstName: 'Ji-woo', lastName: 'Park', color: 'rose', type: 'sprout', accessories: ['glasses'], cuisines: [['Korean', 'Expert'], ['Chinese', 'Beginner']], xp: 330, zoneId: 'z_ghetto', bio: 'Kimchi jjigae fixes everything.' },
  { id: 'u_omar', username: 'omar.falafel', firstName: 'Omar', lastName: 'Saleh', color: 'butter', type: 'cactusNub', accessories: [], cuisines: [['Lebanese', 'Home Cook'], ['Indian', 'Curious']], xp: 90, zoneId: 'z_campus', bio: 'First year, first apartment, first everything.' },
  { id: 'u_chloe', username: 'chloe.bakes', firstName: 'Chloé', lastName: 'Gagnon', color: 'lilac', type: 'rosebud', accessories: [], cuisines: [['French', 'Home Cook'], ['Québécois', 'Home Cook']], xp: 140, zoneId: 'z_plateau', bio: 'Croissant lamination enjoyer.' },
  { id: 'u_marcus', username: 'marcus.jerk', firstName: 'Marcus', lastName: 'Campbell', color: 'leaf', type: 'mushroom', accessories: ['scarf'], cuisines: [['Caribbean', 'Expert'], ['Mexican', 'Beginner']], xp: 480, zoneId: 'z_downtown', bio: 'Scotch bonnets are not a threat, they are a promise.' },
  { id: 'u_priya', username: 'priya.chai', firstName: 'Priya', lastName: 'Iyer', color: 'sky', type: 'tulip', accessories: [], cuisines: [['Indian', 'Home Cook'], ['Italian', 'Curious']], xp: 60, zoneId: 'z_park', bio: 'Masala chai at all hours.' },
];

function buildUsers(now: number): User[] {
  return BOTS.map((b, i) => ({
    id: b.id,
    username: b.username,
    firstName: b.firstName,
    lastName: b.lastName,
    email: `${b.username.replace(/[^a-z]/g, '')}@mail.mcgill.ca`,
    bud: { color: b.color, type: b.type, accessories: b.accessories },
    cuisines: b.cuisines.map(([cuisine, level]) => ({ cuisine, level })),
    xp: b.xp,
    createdAt: now - (20 + i * 7) * DAY,
    isBot: true,
    bio: b.bio,
    zoneId: b.zoneId,
  }));
}

interface PostSpec {
  id: string;
  type: Post['type'];
  hostId: string;
  cuisines: Cuisine[];
  ingredient?: string;
  description: string;
  startIn: number;
  duration: number;
  max: number;
}

const POSTS: PostSpec[] = [
  { id: 'p_teach_lebanese', type: 'teach', hostId: 'u_maya', cuisines: ['Lebanese'], description: 'Fattoush, hummus from dried chickpeas, and the secret to fluffy pita. Bring a tupperware!', startIn: 3 * HOUR, duration: 2 * HOUR, max: 4 },
  { id: 'p_teach_dumplings', type: 'teach', hostId: 'u_wei', cuisines: ['Chinese'], description: 'Dumpling folding night 🥟 Pork & chive + a veggie option. All skill levels welcome.', startIn: 1 * DAY + 2 * HOUR, duration: 3 * HOUR, max: 6 },
  { id: 'p_learn_ethiopian', type: 'learn', hostId: 'u_omar', cuisines: ['Ethiopian'], description: 'Never made injera and would love someone to show me the ropes. I have a big pan!', startIn: 5 * HOUR, duration: 2 * HOUR, max: 2 },
  { id: 'p_learn_italian', type: 'learn', hostId: 'u_priya', cuisines: ['Italian'], description: 'I want to learn fresh pasta by hand. Can supply flour, eggs, and good playlists.', startIn: 2 * DAY, duration: 2 * HOUR, max: 3 },
  { id: 'p_teach_curry', type: 'teach', hostId: 'u_ploy', cuisines: ['Thai'], description: 'Pounding green curry paste from scratch. Mortar & pestle arm workout included 💪', startIn: 26 * HOUR, duration: 2 * HOUR, max: 4 },
  { id: 'p_potluck_ghetto', type: 'potluck', hostId: 'u_jules', cuisines: ['French', 'Italian', 'Greek'], description: 'Mediterranean-ish potluck at mine. Bring a dish, leave with five. Plates provided.', startIn: 2 * DAY + 4 * HOUR, duration: 3 * HOUR, max: 10 },
  { id: 'p_potluck_carib', type: 'potluck', hostId: 'u_marcus', cuisines: ['Caribbean', 'Haitian', 'Mexican'], description: 'Spicy food potluck 🌶️ Heat tolerance optional, enthusiasm mandatory.', startIn: 8 * HOUR, duration: 3 * HOUR, max: 8 },
  { id: 'p_learn_korean', type: 'learn', hostId: 'u_minh', cuisines: ['Korean'], description: 'Looking for someone to teach me kimchi jjigae — I’ll bring the soju-free sparkling water.', startIn: 30 * HOUR, duration: 90 * MINUTE, max: 2 },
  { id: 'p_teach_quebec', type: 'teach', hostId: 'u_lea', cuisines: ['Québécois'], description: 'Pouding chômeur + homemade poutine gravy. It’s cold out, let’s be cozy.', startIn: 50 * HOUR, duration: 2 * HOUR, max: 5 },
  { id: 'p_mergency_rice', type: 'budmergency', hostId: 'u_kenji', cuisines: [], ingredient: 'rice', description: 'Made WAY too much rice for onigiri practice. 4 cups cooked. Help 😭', startIn: -40 * MINUTE, duration: 3 * HOUR, max: 0 },
  { id: 'p_mergency_bananas', type: 'budmergency', hostId: 'u_sofia', cuisines: [], ingredient: 'bananas', description: 'Six bananas going brown on my counter. Not banana bread again please.', startIn: -2 * HOUR, duration: 6 * HOUR, max: 0 },
  { id: 'p_mergency_spinach', type: 'budmergency', hostId: 'u_jiwoo', cuisines: [], ingredient: 'spinach', description: 'Giant Costco bag of spinach, expires tomorrow. Savoury ideas?', startIn: -20 * MINUTE, duration: 1 * HOUR, max: 0 },
  { id: 'p_mergency_lentils', type: 'budmergency', hostId: 'u_eleni', cuisines: [], ingredient: 'lentils', description: 'Bought red lentils for a recipe I lost. What do I do with 2kg?', startIn: -30 * HOUR, duration: 24 * HOUR, max: 0 },
];

function buildPosts(now: number): Post[] {
  return POSTS.map((p) => {
    const startAt = now + p.startIn;
    const endAt = startAt + p.duration;
    return {
      id: p.id,
      type: p.type,
      title: generateTitle({ type: p.type, cuisines: p.cuisines, ingredient: p.ingredient }),
      description: p.description.slice(0, 150),
      cuisines: p.cuisines,
      ingredient: p.ingredient,
      startAt,
      endAt,
      maxParticipants: p.max,
      hostId: p.hostId,
      status: endAt <= now ? 'ended' : 'open',
      createdAt: Math.min(now, startAt) - 30 * MINUTE,
    };
  });
}

function buildForum(posts: Post[]): { threads: ForumThread[]; replies: ForumReply[] } {
  const threads: ForumThread[] = posts
    .filter((p) => p.type === 'budmergency')
    .map((p) => ({
      id: `t_${p.id}`,
      postId: p.id,
      authorId: p.hostId,
      ingredient: p.ingredient ?? '',
      title: p.title,
      description: p.description,
      createdAt: p.startAt,
      expiresAt: p.endAt,
    }));

  const r = (
    id: string,
    threadId: string,
    authorId: string,
    text: string,
    minsAfter: number,
    upvoterIds: string[] = [],
    parentId?: string,
  ): ForumReply => {
    const t = threads.find((x) => x.id === threadId)!;
    return { id, threadId, authorId, text, upvoterIds, parentId, createdAt: t.createdAt + minsAfter * MINUTE };
  };

  const replies: ForumReply[] = [
    r('r_rice_1', 't_p_mergency_rice', 'u_wei', 'Egg fried rice! Day-old rice is actually perfect for it. Scallions + soy + sesame oil.', 5, ['u_minh', 'u_jiwoo', 'u_arjun']),
    r('r_rice_2', 't_p_mergency_rice', 'u_jiwoo', 'Kimchi fried rice with a fried egg on top 🍳', 9, ['u_kenji']),
    r('r_rice_3', 't_p_mergency_rice', 'u_kenji', 'omg yes I have kimchi', 11, [], 'r_rice_2'),
    r('r_rice_4', 't_p_mergency_rice', 'u_maya', 'Rice pudding with rose water and pistachios!', 18, ['u_eleni']),
    r('r_ban_1', 't_p_mergency_bananas', 'u_marcus', 'Fried plantain-style! Caramelize slices in butter + brown sugar + rum extract.', 12, ['u_nadia', 'u_sofia']),
    r('r_ban_2', 't_p_mergency_bananas', 'u_arjun', 'Banana lassi with cardamom. Freeze the rest in chunks for smoothies.', 25, ['u_priya']),
    r('r_ban_3', 't_p_mergency_bananas', 'u_ploy', 'Thai roti gluay — banana pancakes with condensed milk 🤤', 40, ['u_sofia', 'u_minh', 'u_wei']),
    r('r_spin_1', 't_p_mergency_spinach', 'u_eleni', 'Spanakopita! Phyllo + feta + all that spinach. Freezes great.', 4, ['u_jiwoo']),
    r('r_spin_2', 't_p_mergency_spinach', 'u_arjun', 'Palak paneer. A whole bag shrinks down to like two servings anyway.', 8),
    r('r_lent_1', 't_p_mergency_lentils', 'u_arjun', 'Masoor dal — onion, garlic, turmeric, cumin tadka. 20 minutes.', 30, ['u_eleni', 'u_priya']),
    r('r_lent_2', 't_p_mergency_lentils', 'u_selam', 'Misir wot! Berbere + niter kibbeh. I can share my spice mix.', 55, ['u_eleni', 'u_maya', 'u_omar']),
    r('r_lent_3', 't_p_mergency_lentils', 'u_maya', 'Shorbat adas — Lebanese lentil soup with lemon.', 90, ['u_omar']),
  ];

  // The expired lentil thread has a pinned "This saved me!" answer.
  const lentils = threads.find((t) => t.id === 't_p_mergency_lentils');
  if (lentils) lentils.savedReplyId = 'r_lent_2';

  return { threads, replies };
}

/** A bot-hosted room so Chats isn't empty for bots' own simulations. */
function buildRooms(posts: Post[], now: number): { rooms: ChatRoom[]; messages: Message[] } {
  const post = posts.find((p) => p.id === 'p_potluck_carib');
  if (!post) return { rooms: [], messages: [] };
  const room: ChatRoom = {
    id: 'c_p_potluck_carib',
    postId: post.id,
    ownerId: post.hostId,
    members: [
      { userId: 'u_marcus', joinedAt: now - 3 * HOUR },
      { userId: 'u_nadia', joinedAt: now - 3 * HOUR },
      { userId: 'u_sofia', joinedAt: now - 2 * HOUR },
    ],
    archived: false,
    createdAt: now - 3 * HOUR,
  };
  const messages: Message[] = [
    { id: 'm_c1', roomId: room.id, kind: 'system', text: 'Nadia joined the kitchen 🍳', createdAt: now - 3 * HOUR },
    { id: 'm_c2', roomId: room.id, senderId: 'u_nadia', kind: 'text', text: 'Bringing griot + pikliz!', createdAt: now - 3 * HOUR + 2 * MINUTE },
    { id: 'm_c3', roomId: room.id, kind: 'system', text: 'Sofía joined the kitchen 🍳', createdAt: now - 2 * HOUR },
    { id: 'm_c4', roomId: room.id, senderId: 'u_sofia', kind: 'text', text: 'Elote and a salsa macha that will hurt 🔥', createdAt: now - 2 * HOUR + 5 * MINUTE },
    { id: 'm_c5', roomId: room.id, senderId: 'u_marcus', kind: 'text', text: 'Perfect. I’ve got jerk chicken and rice & peas.', createdAt: now - 90 * MINUTE },
  ];
  return { rooms: [room], messages };
}

export interface SeedData {
  users: User[];
  posts: Post[];
  rooms: ChatRoom[];
  messages: Message[];
  threads: ForumThread[];
  replies: ForumReply[];
}

/** Builds fresh seed data with timestamps relative to `now`. */
export function createSeed(now = Date.now()): SeedData {
  const users = buildUsers(now);
  const posts = buildPosts(now);
  const { threads, replies } = buildForum(posts);
  const { rooms, messages } = buildRooms(posts, now);
  return { users, posts, rooms, messages, threads, replies };
}

/** Canned lines for simulated bots (used by simulators.ts). */
export const BOT_LINES = {
  joinMessages: [
    'Would love to join! I can bring snacks 🍪',
    'I’ve always wanted to try this — count me in?',
    'Total beginner but very enthusiastic!',
    'I live super close, happy to help clean up after 🧽',
    'My roommate and I talk about this cuisine constantly. Please!',
  ],
  chat: [
    'Hiii so excited for this 🥳',
    'Should I bring anything?',
    'I can grab ingredients on the way from Adonis!',
    'Is there a dietary thing I should know about?',
    'See you all soon 🌱',
  ],
  forumTips: [
    'Freeze it in portions — future you will say thanks.',
    'Throw it into a frittata with whatever cheese you have!',
    'Soup! Almost anything becomes soup with onion, garlic and stock.',
    'Stir-fry with garlic, soy, and a squeeze of lime.',
    'Blend it into a sauce or dip — works way more often than you think.',
  ],
} as const;
