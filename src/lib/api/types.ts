// TH-Platform domain types — single source of truth.
// Backend will return JSON in these shapes; mock.ts already does today.

export type GameId = 'th06' | 'th07' | 'th08' | 'th09';

export type Status = 'online' | 'idle' | 'away' | 'dnd' | 'offline';

export type Difficulty = 'Easy' | 'Normal' | 'Hard' | 'Lunatic' | 'Extra';

export type RoomKind = 'Official' | 'Personal';

export type Visibility = 'public' | 'ask' | 'private';

export type RoomState = 'lobby' | 'loading' | 'playing' | 'post';

export interface Room {
  id: number;
  gameId: GameId;
  kind: RoomKind;
  title: string;
  host: string;
  region: string;
  ping: number;
  diff: Difficulty;
  mode: string;
  taken: number;
  total: number;
  vis: Visibility;
  state?: RoomState;
  /** Absent until the room's host publishes where it is listening. */
  endpoint?: RoomEndpoint;
}

/**
 * Where a room's host is reachable right now.
 *
 * The address and the port arrive together or not at all, and the session id
 * names the host's game session: a host that restarts its game republishes on
 * the same address, so `addr` alone cannot tell a peer whether the process
 * behind it is the one it was told about.
 */
export interface RoomEndpoint {
  addr: string;
  port: number;
  sessionId: string;
}

/**
 * The `ip:port` string both loaders and the DLL take, or '' when the room has
 * no endpoint. Brackets an IPv6 literal, because the loaders hand this straight
 * to the socket layer.
 */
export function peerAddr(endpoint?: RoomEndpoint | null): string {
  if (!endpoint?.addr) return '';
  return endpoint.addr.includes(':') ? `[${endpoint.addr}]:${endpoint.port}` : `${endpoint.addr}:${endpoint.port}`;
}

export interface Friend {
  name: string;
  handle: string;
  status: Status;
  game?: string;
  subtle?: string;
  mutual?: number;
}

export interface PendingFriend extends Friend {
  dir: 'in' | 'out';
}

export interface Seat {
  idx: number;
  name: string | null;
  handle?: string;
  status?: Status;
  role?: '正常' | '观战' | '缺席';
  char?: string | null;
  mono?: string | null;
  ready?: boolean;
}

export interface Reaction {
  icon: string;
  count: number;
  mine?: boolean;
}

export interface RoomShareEmbed {
  title: string;
  host: string;
  region: string;
  ping: number;
  diff: Difficulty | string;
  mode?: string;
  taken: number;
  total: number;
  vis: Visibility;
}

export interface ChatMsg {
  // sys system events
  kind?: 'sys' | 'embed';
  text?: string; // for sys
  // user messages
  who?: string;
  t: string;
  msg?: string;
  mention?: string;
  samegroup?: boolean;
  share?: RoomShareEmbed;
  reactions?: Reaction[];
}

export interface Channel {
  id: string;
  label: string;
  active?: boolean;
  unread?: number;
  mention?: number;
  muted?: boolean;
  voice?: boolean;
  count?: number;
  tag?: string;
}

export interface ChannelCategory {
  id: string;
  label: string;
  icon: string;
  items: Channel[];
}

export interface Group {
  name: string;
  handle: string;
  motto: string;
  members: number;
  online: number;
  established: string;
}

export interface RankMap {
  th06?: string;
  th07?: string;
  th08?: string;
  th09?: string;
}

export interface RecentGame {
  game: string;
  mode: string;
  score: string;
  time: string;
}

export interface ProfileGroup {
  name: string;
  role: string;
}

export interface Profile {
  name: string;
  handle: string;
  pronoun: string;
  status: Status;
  presence: string;
  joined: string;
  bio: string;
  badges: string[];
  ranks: RankMap;
  recent: RecentGame[];
  groups: ProfileGroup[];
  uid?: string;
}

export interface Announcement {
  pinnedBy: string;
  time: string;
  title: string;
  body: string;
}
