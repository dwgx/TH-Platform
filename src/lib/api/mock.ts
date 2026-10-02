// Mock data — extracted from inline page sample data so client.ts can return
// it consistently. Swap to real fetch in client.ts when backend lands.

import type {
  Room, Friend, PendingFriend, Seat, ChatMsg, ChannelCategory,
  Group, Profile, Announcement,
} from './types';

export const ROOMS: Room[] = [
  { id: 1, gameId: 'th08', kind: 'Official', title: '永夜抄 PvP — 北京',  host: '幽幽子',   region: 'CN-East',  ping: 24, diff: 'Lunatic', mode: 'Standard', taken: 3, total: 4, vis: 'public' },
  { id: 2, gameId: 'th08', kind: 'Personal', title: '老咸鱼下午茶',         host: '咲夜',     region: 'CN-East',  ping: 31, diff: 'Hard',    mode: 'Standard', taken: 2, total: 4, vis: 'public' },
  { id: 3, gameId: 'th08', kind: 'Official', title: 'IN 周末练习 #14',      host: '灵梦',     region: 'CN-South', ping: 42, diff: 'Lunatic', mode: 'Standard', taken: 4, total: 4, vis: 'public' },
  { id: 4, gameId: 'th08', kind: 'Personal', title: '萌新练习房 · 慢慢打',  host: '魔理沙',   region: 'CN-East',  ping: 19, diff: 'Normal',  mode: 'Casual',   taken: 1, total: 4, vis: 'public' },
  { id: 5, gameId: 'th08', kind: 'Official', title: 'Spell Card Showdown', host: '妖梦',     region: 'JP-Tokyo', ping: 88, diff: 'Lunatic', mode: 'Spell',    taken: 2, total: 4, vis: 'public' },
  { id: 6, gameId: 'th08', kind: 'Personal', title: '深夜不困局 · 03:00',   host: '蕾米莉亚', region: 'CN-East',  ping: 27, diff: 'Hard',    mode: 'Standard', taken: 3, total: 4, vis: 'public' },
];

export const FRIENDS: Friend[] = [
  { name: '幽幽子',    handle: 'yuyuko',    status: 'online',  game: 'TH08 永夜抄', subtle: '在 永夜抄 PvP — 北京' },
  { name: '咲夜',      handle: 'sakuya',    status: 'online',  game: 'TH08 永夜抄', subtle: '游戏中 · Lunatic 4B' },
  { name: '魔理沙',    handle: 'marisa',    status: 'idle',    subtle: '挂机 18 分钟' },
  { name: '爱丽丝',    handle: 'alice',     status: 'online',  game: 'TH09 PoFV',   subtle: '在 PoFV 自由对战' },
  { name: '帕秋莉',    handle: 'patchouli', status: 'dnd',     subtle: '请勿打扰 · 撰写中' },
  { name: '蕾米莉亚',  handle: 'remilia',   status: 'offline', subtle: '昨天 23:41' },
];

export const PENDING_FRIENDS: PendingFriend[] = [
  { name: '十六夜咲夜', handle: 'izayoi',  status: 'online', dir: 'in',  mutual: 4 },
  { name: '小野塚小町', handle: 'komachi', status: 'online', dir: 'out' },
];

// Lobby's "好友在线" sidebar — uses a smaller curated set
export const LOBBY_FRIENDS: Friend[] = [
  { name: '小野塚小町', handle: 'komachi', status: 'online', game: 'TH09 中' },
  { name: '河城荷取',   handle: 'nitori',  status: 'online', game: 'TH08 中' },
  { name: '雾雨魔理沙', handle: 'marisa',  status: 'away',   game: '挂机' },
  { name: '十六夜咲夜', handle: 'sakuya',  status: 'online', game: 'TH06 中' },
  { name: '博丽灵梦',   handle: 'reimu',   status: 'dnd',    game: '勿扰' },
];

export const LOBBY_CHAT: ChatMsg[] = [
  { who: '河城荷取',   t: '21:04', msg: '今晚有人上分吗，本命永夜抄' },
  { who: '小野塚小町', t: '21:05', msg: '刚下班，等我十分钟' },
  { who: '十六夜咲夜', t: '21:07', msg: '@nitori 我开了一桌，进来吧', mention: 'nitori', share: { title: '永夜抄 PvP — 北京', host: '幽幽子', region: 'CN-East', ping: 24, diff: 'Lunatic', mode: 'Standard', taken: 3, total: 4, vis: 'public' } },
  { who: '雾雨魔理沙', t: '21:09', msg: '稳，先来一把试试手感', reactions: [{ icon: 'thumbs-up', count: 3, mine: true }] },
  { who: '河城荷取',   t: '21:10', msg: '好嘞，路上' },
];

export const ROOM_SEATS: Seat[] = [
  { idx: 1, name: '幽幽子', handle: 'yuyuko', status: 'online', role: '正常', char: '灵梦',   mono: '灵', ready: true },
  { idx: 2, name: '妖梦',   handle: 'youmu',  status: 'online', role: '正常', char: '魔理沙', mono: '魔', ready: true },
  { idx: 3, name: '咲夜',   handle: 'sakuya', status: 'online', role: '正常', char: '咲夜',   mono: '咲', ready: true },
  { idx: 4, name: '魔理沙', handle: 'marisa', status: 'away',   role: '观战', char: null,     mono: null, ready: false },
  { idx: 5, name: null },
  { idx: 6, name: null },
];

export const ROOM_SPECTATORS = [
  '小野塚小町', '十六夜咲夜', '博丽灵梦', '雾雨魔理沙',
  '蕾米莉亚', '爱丽丝', '帕秋莉', '藤原妹红',
];

export const ROOM_CHAT: ChatMsg[] = [
  { kind: 'sys', t: '21:00', text: '妖梦 加入了 #2 号位' },
  { kind: 'sys', t: '21:04', text: '幽幽子 选择了 灵梦' },
  { who: '幽幽子', t: '21:02', msg: '今晚打 Lunatic，先适应一下手感' },
  { who: '妖梦',   t: '21:03', msg: '稳，我用魔理沙' },
  { who: '咲夜',   t: '21:05', msg: '@youmu 你不是要打吗，怎么观战了', mention: 'youmu' },
];

export const GROUP: Group = {
  name: '夜组 · 永夜抄研究会',
  handle: 'yegumi',
  motto: '专研永夜抄 Lunatic 路线 · 每周三、五 21:00 集合',
  members: 248,
  online: 42,
  established: '2019.08',
};

export const GROUP_CATS: ChannelCategory[] = [
  { id: 'info',  label: '群组信息', icon: 'megaphone', items: [
    { id: 'rules',    label: '群规与守则', tag: '置顶' },
    { id: 'announce', label: '公告',      unread: 2 },
    { id: 'events',   label: '活动日程',  unread: 0 },
  ]},
  { id: 'chat',  label: '文字频道', icon: 'hash', items: [
    { id: 'lounge',   label: '闲聊大厅' },
    { id: 'th08',     label: '永夜抄研究', active: true, unread: 14 },
    { id: 'th07',     label: '妖妖梦' },
    { id: 'replay',   label: '录像点评' },
    { id: 'tools',    label: '工具与下载' },
  ]},
  { id: 'voice', label: '语音频道', icon: 'volume-2', items: [
    { id: 'v1', label: 'Lunatic 集训', voice: true, count: 5 },
    { id: 'v2', label: '深夜车队',     voice: true, count: 0 },
    { id: 'v3', label: 'AFK 挂机',     voice: true, count: 2 },
  ]},
];

export const GROUP_ANNOUNCEMENT: Announcement = {
  pinnedBy: '幽幽子',
  time: '昨天 22:14',
  title: '本周永夜抄 Lunatic 集训安排',
  body: '周三 21:00 准时在 Lunatic 集训 语音频道集合，主攻 5 面与 6A 路线。本周新增 4B（魔理沙 + 爱丽丝）路线讨论，自带录像。\n\n报名截止：周三 18:00。报名表见 #活动日程。',
};

export const GROUP_MSGS: ChatMsg[] = [
  { who: '咲夜',   t: '20:54', msg: '今晚有人想打 Lunatic 4B 吗？我录像看了一晚上有点想自己试' },
  { who: '魔理沙', t: '20:55', msg: '我可以陪打 但是 5 面我经常死在 Reisen 那张符卡' },
  { who: '咲夜',   t: '20:55', msg: '那张符卡其实是规律弹 我录屏给你看下', samegroup: true },
  { kind: 'embed', t: '20:56' },
  { who: '幽幽子', t: '21:00', msg: '@everyone 集训开始 上语音吧', mention: 'everyone' },
];

export const DM_THREAD: ChatMsg[] = [
  { who: '咲夜', t: '20:48', msg: '今晚要打 Lunatic 吗' },
  { who: 'me',   t: '20:49', msg: '打的，4B 路线还是老样子' },
  { who: '咲夜', t: '20:49', msg: '稳，我先去开房间', samegroup: true },
  { kind: 'embed', t: '20:50' },
  { who: 'me',   t: '20:51', msg: '收到，我两分钟后到' },
  { who: '咲夜', t: '20:53', msg: '魔理沙 也来 总共 3 个 等多 1 个就开打' },
  { who: 'me',   t: '20:54', msg: '@yuyuko 在不？要不要来打 Lunatic 4B', mention: 'yuyuko' },
  { who: '咲夜', t: '20:55', msg: '我去拉幽幽子 你先调下手感', samegroup: false },
];

export const ME: Profile = {
  name: '幽幽子',
  handle: 'yuyuko',
  pronoun: 'she/her',
  status: 'online',
  presence: '正在游玩 永夜抄 PvP — 北京 · #4912',
  joined: '2024.03.14',
  uid: '4128920',
  bio: '夜组成员 · Lunatic 路线党 · 周三、五 21:00 集训\n咲夜的固定搭档 · 4B 路线 18 通关',
  badges: ['创始成员', 'Lunatic 通关 +50', '夜组管理员'],
  ranks: { th06: 'Hard', th07: 'Lunatic', th08: 'Lunatic+', th09: 'Hard' },
  recent: [
    { game: 'TH08', mode: 'Lunatic 4B', score: '4,128,920,470', time: '今天 21:42' },
    { game: 'TH08', mode: 'Normal 6A',  score: '982,140,560',   time: '昨天 22:08' },
    { game: 'TH09', mode: 'Hard',       score: '410,220',       time: '3 天前' },
    { game: 'TH07', mode: 'Lunatic',    score: '2,840,991,210', time: '上周三' },
  ],
  groups: [
    { name: '夜组 · 永夜抄研究会', role: '管理员' },
    { name: 'PoFV 自由对战群',    role: '成员' },
    { name: 'TH06 EoSD 复习班',   role: '成员' },
  ],
};
