import type { Channel, ChatMessage, Friend, Room } from '@/types';

export const rooms: Room[] = [
  { id: '4912', name: '永夜抄 PvP — 北京', game: 'TH08', region: 'CN-East',
    pingMs: 24, kind: 'official', status: 'waiting', difficulty: 'Lunatic',
    mode: 'Standard', capacity: 4,
    players: [
      { id: 'u1', name: '幽幽子', isHost: true },
      { id: 'u2', name: '魔理沙' },
      { id: 'u3', name: '咲夜' },
    ],
    tags: ['Lunatic', '3 lives', 'No bombs'],
  },
  { id: '4730', name: 'Lunatic only', game: 'TH08', region: 'Tokyo',
    pingMs: 38, kind: 'personal', status: 'waiting', difficulty: 'Lunatic',
    mode: 'Standard', capacity: 4,
    players: [
      { id: 'u4', name: '紫', isHost: true },
      { id: 'u5', name: '蓝' },
    ],
    tags: ['Lunatic', '2 lives'],
  },
  { id: '4801', name: '深夜挑战 — 北京 #2', game: 'TH08', region: 'CN-East',
    pingMs: 31, kind: 'personal', status: 'full', difficulty: 'Hard',
    mode: 'Standard', capacity: 4,
    players: [
      { id: 'u6', name: '灵梦', isHost: true },
      { id: 'u7', name: '爱丽丝' },
      { id: 'u8', name: '帕秋莉' },
      { id: 'u9', name: '琪露诺' },
    ],
    tags: ['Hard', '3 lives'],
  },
  { id: '4520', name: 'Co-op — 新手友好', game: 'TH08', region: 'CN-South',
    pingMs: 52, kind: 'personal', status: 'waiting', difficulty: 'Easy',
    mode: 'Casual', capacity: 4,
    players: [{ id: 'u10', name: '爱丽丝', isHost: true }],
    tags: ['Easy', '5 lives'],
  },
  { id: '4309', name: 'Score-attack 1cc', game: 'TH08', region: 'CN-East',
    pingMs: 19, kind: 'personal', status: 'waiting', difficulty: 'Lunatic',
    mode: 'Score attack', capacity: 4,
    players: [
      { id: 'u11', name: '咲夜', isHost: true },
      { id: 'u12', name: '小恶魔' },
    ],
    tags: ['Lunatic', '1 life'],
  },
  { id: '4188', name: 'Practice 5/6 关', game: 'TH08', region: 'CN-North',
    pingMs: 44, kind: 'personal', status: 'idle', difficulty: 'Normal',
    mode: 'Practice', capacity: 4,
    players: [{ id: 'u13', name: '魔理沙', isHost: true }],
    tags: ['Practice'],
  },
];

export const channels: Channel[] = [
  { id: 'announcements', name: 'announcements', category: 'INFORMATION', type: 'text' },
  { id: 'rules',         name: 'rules',         category: 'INFORMATION', type: 'text' },
  { id: 'lobby-th06',    name: 'lobby-th06',    category: 'LOBBIES', type: 'text' },
  { id: 'lobby-th07',    name: 'lobby-th07',    category: 'LOBBIES', type: 'text', unread: 3 },
  { id: 'lobby-th08',    name: 'lobby-th08',    category: 'LOBBIES', type: 'text', active: true, mention: true },
  { id: 'lobby-th09',    name: 'lobby-th09',    category: 'LOBBIES', type: 'text' },
  { id: 'general',       name: 'general',       category: '闲聊',    type: 'text' },
  { id: 'spell-cards',   name: 'spell-cards',   category: '闲聊',    type: 'text' },
  { id: 'meta-strats',   name: 'meta-strats',   category: '闲聊',    type: 'text' },
];

export const lobbyChat: ChatMessage[] = [
  { id: 'm1', author: '幽幽子', time: '02:13',
    text: '今晚有人 Lunatic 联机吗？刚开了 #4912 还有一个位' },
  { id: 'm2', author: '魔理沙', time: '02:14',
    text: '我五分钟到，先把 final A 练一下' },
  { id: 'm3', system: true, time: '02:15',
    text: '咲夜 shared a room', embedRoomId: '4730' },
  { id: 'm4', author: '灵梦', time: '02:16',
    text: 'Score-attack 一会儿开桌，CN-East 19ms 进的喊一声' },
  { id: 'm5', author: '爱丽丝', time: '02:18',
    text: '@dwgx 你来吗？4912 最后一个位等你', hasMention: true },
  { id: 'm6', author: '帕秋莉', time: '02:21',
    text: '我先去查个 Mokou 的弹幕，等会儿过来' },
];

export const friends: Friend[] = [
  { id: 'f1', name: '幽幽子',   handle: 'yuyuko',  status: 'online', activity: 'In #4912' },
  { id: 'f2', name: '魔理沙',   handle: 'marisa',  status: 'online', activity: 'In #4912' },
  { id: 'f3', name: '咲夜',     handle: 'sakuya',  status: 'online', activity: 'In #4730' },
  { id: 'f4', name: '灵梦',     handle: 'reimu',   status: 'idle',   activity: 'AFK' },
  { id: 'f5', name: '爱丽丝',   handle: 'alice',   status: 'online', activity: 'In #4520' },
  { id: 'f6', name: '小恶魔',   handle: 'koakuma', status: 'dnd',    activity: 'Do not disturb' },
  { id: 'f7', name: '紫',       handle: 'yukari',  status: 'online' },
  { id: 'f8', name: '帕秋莉',   handle: 'patchy',  status: 'idle' },
  { id: 'f9', name: '蕾米',     handle: 'remilia', status: 'offline' },
  { id: 'f10', name: '十六夜',  handle: 'rin',     status: 'offline' },
];

export const myUid = '100029481';
export const myDisplayName = 'dwgx';
export const myHandle = 'dwgx';
