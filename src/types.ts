export type GameTag = 'TH06' | 'TH07' | 'TH08' | 'TH09';
export type Region = 'CN-East' | 'CN-North' | 'CN-South' | 'CN-West' | 'Tokyo';
export type Difficulty = 'Easy' | 'Normal' | 'Hard' | 'Lunatic' | 'Extra';
export type RoomKind = 'official' | 'personal' | 'community';
export type RoomStatus = 'waiting' | 'full' | 'idle' | 'playing';
export type FriendStatus = 'online' | 'idle' | 'dnd' | 'offline';
export type Page =
  | 'lobby'
  | 'room'
  | 'channels'
  | 'friends'
  | 'discover'
  | 'settings';

export interface Player {
  id: string;
  name: string;
  isHost?: boolean;
}

export interface Room {
  id: string;
  name: string;
  game: GameTag;
  region: Region;
  pingMs: number;
  kind: RoomKind;
  status: RoomStatus;
  difficulty: Difficulty;
  mode: string;
  capacity: number;
  players: Player[];
  tags?: string[];
}

export interface ChatMessage {
  id: string;
  author?: string;
  time: string;
  text?: string;
  system?: boolean;
  embedRoomId?: string;
  hasMention?: boolean;
}

export interface Friend {
  id: string;
  name: string;
  handle: string;
  status: FriendStatus;
  activity?: string;
}

export interface Channel {
  id: string;
  name: string;
  category: string;
  type: 'text';
  unread?: number;
  mention?: boolean;
  active?: boolean;
}
