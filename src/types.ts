export type GameTag = 'TH06' | 'TH07' | 'TH08' | 'TH09';

export type Region =
  | 'CN-East'
  | 'CN-North'
  | 'CN-South'
  | 'CN-West'
  | 'Tokyo'
  | 'Auto';

export type Difficulty = 'Easy' | 'Normal' | 'Hard' | 'Lunatic' | 'Extra';

export type RoomKind = 'official' | 'personal' | 'community';

export type RoomStatus = 'waiting' | 'full' | 'idle' | 'playing';

export type CoverId =
  | 'aurora'
  | 'midnight'
  | 'twilight'
  | 'dawn'
  | 'glacier'
  | 'amber';

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
  tags: { label: string; tone?: 'default' | 'warning' }[];
  capacity: number;
  players: Player[];
  cover: CoverId;
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
