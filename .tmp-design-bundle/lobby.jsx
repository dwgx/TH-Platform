/* global React, UI */
// TH-Platform Lobby — 4-column Discord-style layout.
// Soft, friendly, no metallic / cinematic / tactical.

const { useState } = React;
const { Button, Avatar, Badge, Card, Input, Icon } = UI;

// ---------- Mock data ----------
const GAMES = [
  { id: 'th06', code: 'TH06', name: '红魔乡', short: 'EoSD', grad: 'var(--grad-rose)' },
  { id: 'th07', code: 'TH07', name: '妖妖梦', short: 'PCB', grad: 'var(--grad-mint)' },
  { id: 'th08', code: 'TH08', name: '永夜抄', short: 'IN',   grad: 'var(--grad-violet)' },
  { id: 'th09', code: 'TH09', name: '花映塚', short: 'PoFV', grad: 'var(--grad-amber)' },
];

const ROOMS = [
  { id: 1, kind: 'Official', title: '永夜抄 PvP — 北京', host: '幽幽子',
    region: 'CN-East', ping: 24, diff: 'Lunatic', mode: 'Standard', lives: 3,
    seats: 4, taken: 3, grad: 'var(--grad-violet)' },
  { id: 2, kind: 'Personal', title: '老咸鱼下午茶', host: '咲夜',
    region: 'CN-East', ping: 31, diff: 'Hard', mode: 'Standard', lives: 4,
    seats: 4, taken: 2, grad: 'var(--grad-teal)' },
  { id: 3, kind: 'Official', title: 'IN 周末锦标赛 #14', host: '灵梦',
    region: 'CN-South', ping: 42, diff: 'Lunatic', mode: 'Ranked', lives: 3,
    seats: 4, taken: 4, grad: 'var(--grad-amber)' },
  { id: 4, kind: 'Personal', title: '萌新练习房 · 慢慢打', host: '魔理沙',
    region: 'CN-East', ping: 19, diff: 'Normal', mode: 'Casual', lives: 5,
    seats: 4, taken: 1, grad: 'var(--grad-mint)' },
  { id: 5, kind: 'Official', title: 'Spell Card Showdown', host: '妖梦',
    region: 'JP-Tokyo', ping: 88, diff: 'Lunatic', mode: 'Spell', lives: 1,
    seats: 4, taken: 2, grad: 'var(--grad-dusk)' },
  { id: 6, kind: 'Personal', title: '深夜不困局 · 03:00', host: '蕾米莉亚',
    region: 'CN-East', ping: 27, diff: 'Hard', mode: 'Standard', lives: 3,
    seats: 4, taken: 3, grad: 'var(--grad-rose)' },
];

const MY_ROOMS = [
  { name: '昨日的房间', sub: 'TH08 · 3 人' },
  { name: '咲夜的茶话会', sub: 'TH07 · 待机中' },
];

const FRIENDS = [
  { name: '小野塚小町', handle: 'komachi', status: 'online', game: 'TH09 中' },
  { name: '河城荷取',   handle: 'nitori',  status: 'online', game: 'TH08 中' },
  { name: '雾雨魔理沙', handle: 'marisa',  status: 'away',   game: '挂机' },
  { name: '十六夜咲夜', handle: 'sakuya',  status: 'online', game: 'TH06 中' },
  { name: '博丽灵梦',   handle: 'reimu',   status: 'dnd',    game: '勿扰' },
];

const CHAT = [
  { who: '河城荷取',   handle: 'nitori',  t: '21:04', msg: '今晚有人上分吗，本命永夜抄' },
  { who: '小野塚小町', handle: 'komachi', t: '21:05', msg: '刚下班，等我十分钟', mention: false },
  { who: '十六夜咲夜', handle: 'sakuya',  t: '21:07', msg: '@nitori 我开了一桌，进来吧', mention: 'nitori', share: 1 },
  { who: '雾雨魔理沙', handle: 'marisa',  t: '21:09', msg: '稳，先来一把试试手感' },
  { who: '河城荷取',   handle: 'nitori',  t: '21:10', msg: '好嘞，路上' },
];

/* See lobby.tsx for the full conversion to TypeScript with proper types. */
