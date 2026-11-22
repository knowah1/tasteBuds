import type {
  ChatRoom,
  Cuisine,
  CuisineSkill,
  DegreeLevel,
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
  major?: string;
  degreeLevel?: DegreeLevel;
}

const BOTS: BotSpec[] = [
  {
    id: 'u_maya',
    username: 'maya.simmers',
    firstName: 'Maya',
    lastName: 'Haddad',
    color: 'rose',
    type: 'rosebud',
    accessories: ['apron'],
    cuisines: [
      ['Lebanese', 'Expert'],
      ['French', 'Home Cook'],
    ],
    xp: 420,
    zoneId: 'z_miltonparc',
    bio: 'Teta’s recipes, U2 Nutrition. Will trade fattoush for gossip.',
    major: 'Nutrition',
    degreeLevel: 'undergrad',
  },
  {
    id: 'u_arjun',
    username: 'arjun.whisks',
    firstName: 'Arjun',
    lastName: 'Mehta',
    color: 'butter',
    type: 'sprout',
    accessories: ['chefHat', 'apron'],
    cuisines: [
      ['Indian', 'Expert'],
      ['Thai', 'Beginner'],
    ],
    xp: 610,
    zoneId: 'z_ghetto',
    bio: 'Comp Sci by day, dal by night.',
    major: 'Computer Science',
    degreeLevel: 'undergrad',
  },
  {
    id: 'u_lea',
    username: 'lea.mixes',
    firstName: 'Léa',
    lastName: 'Tremblay',
    color: 'peach',
    type: 'tulip',
    accessories: ['toque', 'scarf'],
    cuisines: [
      ['Québécois', 'Confident'],
      ['French', 'Confident'],
    ],
    xp: 350,
    zoneId: 'z_plateau',
    bio: 'Tourtière evangelist. Sugar shack every spring.',
    major: 'Civil Engineering',
    degreeLevel: 'undergrad',
  },
  {
    id: 'u_kenji',
    username: 'kenji.stirs',
    firstName: 'Kenji',
    lastName: 'Sato',
    color: 'sky',
    type: 'mushroom',
    accessories: ['headphones'],
    cuisines: [
      ['Japanese', 'Confident'],
      ['Korean', 'Home Cook'],
    ],
    xp: 280,
    zoneId: 'z_campus',
    bio: 'Ramen broth takes 12 hours and so does my thesis.',
    major: 'Chemical Engineering',
    degreeLevel: 'phd',
  },
  {
    id: 'u_sofia',
    username: 'sofia.zests',
    firstName: 'Sofía',
    lastName: 'Ramírez',
    color: 'lime',
    type: 'cactusNub',
    accessories: ['glasses'],
    cuisines: [
      ['Mexican', 'Expert'],
      ['Caribbean', 'Curious'],
    ],
    xp: 515,
    zoneId: 'z_downtown',
    bio: 'tortillas from scratch or bust. masa harina lives in my bag',
    major: 'Anthropology',
    degreeLevel: 'masters',
  },
  {
    id: 'u_wei',
    username: 'wei.sprinkles',
    firstName: 'Wei',
    lastName: 'Chen',
    color: 'mint',
    type: 'beanSprout',
    accessories: ['apron', 'glasses'],
    cuisines: [
      ['Chinese', 'Expert'],
      ['Vietnamese', 'Home Cook'],
    ],
    xp: 700,
    zoneId: 'z_miltonparc',
    bio: 'Dumpling-folding speedrunner. 40/min PB.',
    major: 'Mathematics',
    degreeLevel: 'undergrad',
  },
  {
    id: 'u_selam',
    username: 'selam.sows',
    firstName: 'Selam',
    lastName: 'Bekele',
    color: 'cocoa',
    type: 'sprout',
    accessories: ['scarf'],
    cuisines: [['Ethiopian', 'Expert']],
    xp: 390,
    zoneId: 'z_parc',
    bio: 'Three-day injera ferment, worth every hour.',
  },
  {
    id: 'u_jules',
    username: 'jules.tastes',
    firstName: 'Jules',
    lastName: 'Moreau',
    color: 'lilac',
    type: 'tulip',
    accessories: ['beret'],
    cuisines: [
      ['French', 'Expert'],
      ['Italian', 'Confident'],
    ],
    xp: 830,
    zoneId: 'z_ghetto',
    bio: 'Exchange student from Lyon. Always has a sauce on the go.',
    major: 'Finance',
    degreeLevel: 'undergrad',
  },
  {
    id: 'u_nadia',
    username: 'nadia.blooms',
    firstName: 'Nadia',
    lastName: 'Joseph',
    color: 'butter',
    type: 'rosebud',
    accessories: [],
    cuisines: [
      ['Haitian', 'Confident'],
      ['Caribbean', 'Home Cook'],
    ],
    xp: 160,
    zoneId: 'z_downtown',
    bio: 'Griot and pikliz, every Sunday.',
    major: 'Nursing',
    degreeLevel: 'undergrad',
  },
  {
    id: 'u_minh',
    username: 'minh.sprouts',
    firstName: 'Minh',
    lastName: 'Nguyen',
    color: 'leaf',
    type: 'beanSprout',
    accessories: ['headphones'],
    cuisines: [
      ['Vietnamese', 'Confident'],
      ['Thai', 'Home Cook'],
    ],
    xp: 240,
    zoneId: 'z_campus',
    bio: 'Pho on a hot plate in residence. Ask me how.',
    major: 'Software Engineering',
    degreeLevel: 'undergrad',
  },
  {
    id: 'u_eleni',
    username: 'eleni.harvests',
    firstName: 'Eleni',
    lastName: 'Papadakis',
    color: 'sage',
    type: 'naked',
    accessories: [],
    cuisines: [
      ['Greek', 'Expert'],
      ['Lebanese', 'Beginner'],
    ],
    xp: 300,
    zoneId: 'z_park',
    bio: 'Yiayia-approved spanakopita.',
    major: 'Psychology',
    degreeLevel: 'masters',
  },
  {
    id: 'u_ploy',
    username: 'ploy.plants',
    firstName: 'Ploy',
    lastName: 'Srisai',
    color: 'mint',
    type: 'tulip',
    accessories: ['apron'],
    cuisines: [
      ['Thai', 'Expert'],
      ['Japanese', 'Beginner'],
    ],
    xp: 455,
    zoneId: 'z_miltonparc',
    bio: 'Green curry paste, pounded by hand.',
    major: 'Biochemistry',
    degreeLevel: 'phd',
  },
  {
    id: 'u_gio',
    username: 'gio.ladles',
    firstName: 'Giovanni',
    lastName: 'Russo',
    color: 'peach',
    type: 'mushroom',
    accessories: ['chefHat'],
    cuisines: [['Italian', 'Expert']],
    xp: 760,
    zoneId: 'z_parc',
    bio: 'Fresh pasta, rolled by hand. No machine needed.',
  },
  {
    id: 'u_jiwoo',
    username: 'jiwoo.grows',
    firstName: 'Ji-woo',
    lastName: 'Park',
    color: 'rose',
    type: 'sprout',
    accessories: ['glasses'],
    cuisines: [
      ['Korean', 'Expert'],
      ['Chinese', 'Beginner'],
    ],
    xp: 330,
    zoneId: 'z_ghetto',
    bio: 'Kimchi jjigae fixes everything.',
    major: 'Music Performance',
    degreeLevel: 'masters',
  },
  {
    id: 'u_omar',
    username: 'omar.chops',
    firstName: 'Omar',
    lastName: 'Saleh',
    color: 'butter',
    type: 'cactusNub',
    accessories: [],
    cuisines: [
      ['Lebanese', 'Home Cook'],
      ['Indian', 'Curious'],
    ],
    xp: 90,
    zoneId: 'z_campus',
    bio: 'First year, first apartment, first everything.',
    degreeLevel: 'undergrad',
  },
  {
    id: 'u_chloe',
    username: 'chloe.kneads',
    firstName: 'Chloé',
    lastName: 'Gagnon',
    color: 'lilac',
    type: 'rosebud',
    accessories: [],
    cuisines: [
      ['French', 'Home Cook'],
      ['Québécois', 'Home Cook'],
    ],
    xp: 140,
    zoneId: 'z_plateau',
    bio: 'Croissant lamination enjoyer.',
  },
  {
    id: 'u_marcus',
    username: 'marcus.plates',
    firstName: 'Marcus',
    lastName: 'Campbell',
    color: 'leaf',
    type: 'mushroom',
    accessories: ['scarf'],
    cuisines: [
      ['Caribbean', 'Expert'],
      ['Mexican', 'Beginner'],
    ],
    xp: 480,
    zoneId: 'z_downtown',
    bio: 'Plans cities by day, slow-cooks stews by night.',
    major: 'Urban Planning',
    degreeLevel: 'masters',
  },
  {
    id: 'u_priya',
    username: 'priya.waters',
    firstName: 'Priya',
    lastName: 'Iyer',
    color: 'sky',
    type: 'tulip',
    accessories: [],
    cuisines: [
      ['Indian', 'Home Cook'],
      ['Italian', 'Curious'],
    ],
    xp: 60,
    zoneId: 'z_park',
    bio: 'Always has the kettle on. Learning pasta next.',
    major: 'Electrical Engineering',
  },
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
    ...(b.major && { major: b.major }),
    ...(b.degreeLevel && { degreeLevel: b.degreeLevel }),
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
  {
    id: 'p_teach_lebanese',
    type: 'teach',
    hostId: 'u_maya',
    cuisines: ['Lebanese'],
    description:
      'fattoush + hummus from dried chickpeas (not canned, sorry) and my teta’s pita trick. bring a tupperware',
    startIn: 3 * HOUR,
    duration: 2 * HOUR,
    max: 4,
  },
  {
    id: 'p_teach_dumplings',
    type: 'teach',
    hostId: 'u_wei',
    cuisines: ['Chinese'],
    description:
      'dumpling folding night! pork & chive + a veggie filling. no skill needed, ugly ones still taste good',
    startIn: 1 * DAY + 2 * HOUR,
    duration: 3 * HOUR,
    max: 6,
  },
  {
    id: 'p_learn_ethiopian',
    type: 'learn',
    hostId: 'u_omar',
    cuisines: ['Ethiopian'],
    description:
      'never made injera and kind of scared of the fermenting part?? I do have a huge pan though',
    startIn: 5 * HOUR,
    duration: 2 * HOUR,
    max: 2,
  },
  {
    id: 'p_learn_italian',
    type: 'learn',
    hostId: 'u_priya',
    cuisines: ['Italian'],
    description:
      'want to learn fresh pasta by hand. I can supply flour, eggs and an elite playlist',
    startIn: 2 * DAY,
    duration: 2 * HOUR,
    max: 3,
  },
  {
    id: 'p_teach_curry',
    type: 'teach',
    hostId: 'u_ploy',
    cuisines: ['Thai'],
    description:
      'pounding green curry paste from scratch. mortar & pestle, so your arms will feel it lol',
    startIn: 26 * HOUR,
    duration: 2 * HOUR,
    max: 4,
  },
  {
    id: 'p_potluck_ghetto',
    type: 'potluck',
    hostId: 'u_jules',
    cuisines: ['French', 'Italian', 'Greek'],
    description:
      'mediterranean-ish potluck at mine. bring one dish, leave with five. I have plates, bring a fork',
    startIn: 2 * DAY + 4 * HOUR,
    duration: 3 * HOUR,
    max: 10,
  },
  {
    id: 'p_potluck_carib',
    type: 'potluck',
    hostId: 'u_marcus',
    cuisines: ['Caribbean', 'Haitian', 'Mexican'],
    description:
      'big-flavour potluck 🍲 bring your favourite dish, mild or fiery. plates and a playlist on me',
    startIn: 8 * HOUR,
    duration: 3 * HOUR,
    max: 8,
  },
  {
    id: 'p_learn_korean',
    type: 'learn',
    hostId: 'u_minh',
    cuisines: ['Korean'],
    description:
      'can someone teach me kimchi jjigae? mine always tastes like sad soup. I’ll bring drinks',
    startIn: 30 * HOUR,
    duration: 90 * MINUTE,
    max: 2,
  },
  {
    id: 'p_teach_quebec',
    type: 'teach',
    hostId: 'u_lea',
    cuisines: ['Québécois'],
    description: 'pouding chômeur + real poutine gravy. it’s -20 out, let’s just stay in and eat',
    startIn: 50 * HOUR,
    duration: 2 * HOUR,
    max: 5,
  },
  {
    id: 'p_mergency_rice',
    type: 'budmergency',
    hostId: 'u_kenji',
    cuisines: [],
    ingredient: 'rice',
    description: 'made WAY too much rice for onigiri practice. like 4 cups cooked. help 😭',
    startIn: -40 * MINUTE,
    duration: 3 * HOUR,
    max: 0,
  },
  {
    id: 'p_mergency_bananas',
    type: 'budmergency',
    hostId: 'u_sofia',
    cuisines: [],
    ingredient: 'bananas',
    description:
      'six bananas going brown on my counter. please not banana bread again, I’m begging',
    startIn: -2 * HOUR,
    duration: 6 * HOUR,
    max: 0,
  },
  {
    id: 'p_mergency_spinach',
    type: 'budmergency',
    hostId: 'u_jiwoo',
    cuisines: [],
    ingredient: 'spinach',
    description: 'giant costco bag of spinach, expires tomorrow. savoury ideas pls',
    startIn: -20 * MINUTE,
    duration: 1 * HOUR,
    max: 0,
  },
  {
    id: 'p_mergency_lentils',
    type: 'budmergency',
    hostId: 'u_eleni',
    cuisines: [],
    ingredient: 'lentils',
    description: 'bought red lentils for a recipe I then lost. what do I do with 2kg of these',
    startIn: -30 * HOUR,
    duration: 24 * HOUR,
    max: 0,
  },
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
    return {
      id,
      threadId,
      authorId,
      text,
      upvoterIds,
      parentId,
      createdAt: t.createdAt + minsAfter * MINUTE,
    };
  };

  const replies: ForumReply[] = [
    r(
      'r_rice_1',
      't_p_mergency_rice',
      'u_wei',
      'egg fried rice!! day-old rice is literally perfect for it. scallions, soy, sesame oil, done',
      5,
      ['u_minh', 'u_jiwoo', 'u_arjun'],
    ),
    r(
      'r_rice_2',
      't_p_mergency_rice',
      'u_jiwoo',
      'kimchi fried rice w a runny egg on top. trust',
      9,
      ['u_kenji'],
    ),
    r('r_rice_3', 't_p_mergency_rice', 'u_kenji', 'omg wait I have kimchi', 11, [], 'r_rice_2'),
    r(
      'r_rice_4',
      't_p_mergency_rice',
      'u_maya',
      'rice pudding w rose water and pistachios, my mom’s go-to',
      18,
      ['u_eleni'],
    ),
    r(
      'r_ban_1',
      't_p_mergency_bananas',
      'u_marcus',
      'do them plantain-style, caramelize slices in butter + brown sugar. so good with ice cream',
      12,
      ['u_nadia', 'u_sofia'],
    ),
    r(
      'r_ban_2',
      't_p_mergency_bananas',
      'u_arjun',
      'banana lassi with a bit of cardamom. freeze the rest in chunks for smoothies',
      25,
      ['u_priya'],
    ),
    r(
      'r_ban_3',
      't_p_mergency_bananas',
      'u_ploy',
      'roti gluay!! thai banana pancakes with condensed milk 🤤',
      40,
      ['u_sofia', 'u_minh', 'u_wei'],
    ),
    r(
      'r_spin_1',
      't_p_mergency_spinach',
      'u_eleni',
      'spanakopita. phyllo + feta + all of it. freezes really well too',
      4,
      ['u_jiwoo'],
    ),
    r(
      'r_spin_2',
      't_p_mergency_spinach',
      'u_arjun',
      'palak paneer. a whole bag cooks down to like two servings anyway',
      8,
    ),
    r(
      'r_lent_1',
      't_p_mergency_lentils',
      'u_arjun',
      'masoor dal. onion, garlic, turmeric, cumin tadka, 20 min tops',
      30,
      ['u_eleni', 'u_priya'],
    ),
    r(
      'r_lent_2',
      't_p_mergency_lentils',
      'u_selam',
      'misir wot! I can give you some of my berbere, I have too much',
      55,
      ['u_eleni', 'u_maya', 'u_omar'],
    ),
    r(
      'r_lent_3',
      't_p_mergency_lentils',
      'u_maya',
      'shorbat adas, lentil soup with a ton of lemon. my teta makes it every winter',
      90,
      ['u_omar'],
    ),
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
    {
      id: 'm_c1',
      roomId: room.id,
      kind: 'system',
      text: 'Nadia joined the kitchen',
      createdAt: now - 3 * HOUR,
    },
    {
      id: 'm_c2',
      roomId: room.id,
      senderId: 'u_nadia',
      kind: 'text',
      text: 'bringing griot + pikliz, made a double batch',
      createdAt: now - 3 * HOUR + 2 * MINUTE,
    },
    {
      id: 'm_c3',
      roomId: room.id,
      kind: 'system',
      text: 'Sofía joined the kitchen',
      createdAt: now - 2 * HOUR,
    },
    {
      id: 'm_c4',
      roomId: room.id,
      senderId: 'u_sofia',
      kind: 'text',
      text: 'elote and a salsa macha, with a mild one on the side',
      createdAt: now - 2 * HOUR + 5 * MINUTE,
    },
    {
      id: 'm_c5',
      roomId: room.id,
      senderId: 'u_marcus',
      kind: 'text',
      text: 'perfect, I’ve got jerk chicken and rice & peas covered',
      createdAt: now - 90 * MINUTE,
    },
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
    'would love to join! can bring snacks',
    'I’ve always wanted to try this, is there still room?',
    'total beginner but v enthusiastic',
    'I live like 2 min away, happy to help clean up after',
    'my roommate and I talk about this food constantly, pls',
  ],
  chat: [
    'hiii so excited for this',
    'should I bring anything?',
    'I can grab stuff from Adonis on the way',
    'any allergies I should know about?',
    'see you all soon!',
  ],
  forumTips: [
    'freeze it in portions, future you will thank you',
    'frittata with whatever cheese is in your fridge. works every time',
    'honestly just make soup. onion, garlic, stock, anything goes',
    'stir fry it with garlic, soy and a squeeze of lime',
    'blend it into a sauce or a dip, works way more often than you’d think',
  ],
} as const;
