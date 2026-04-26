// API client — currently returns mocks. Swap each function to a real fetch
// when the Go backend lands (see UIprompts/02-backend-codex-prompt.md).
//
// Pattern: every function is async, returns the same shape mock.ts has.
// To enable artificial latency for testing skeletons / empty states, set
// FAKE_DELAY_MS > 0.

import * as mock from './mock';
import type {
  Room, Friend, PendingFriend, Seat, ChatMsg, Group, ChannelCategory,
  Profile, Announcement, GameId,
} from './types';

const FAKE_DELAY_MS = 0;

async function delay() {
  if (FAKE_DELAY_MS) await new Promise((r) => setTimeout(r, FAKE_DELAY_MS));
}

export const api = {
  // ---------- Rooms ----------
  async listRooms(gameId?: GameId): Promise<Room[]> {
    await delay();
    return gameId ? mock.ROOMS.filter((r) => r.gameId === gameId) : mock.ROOMS;
  },

  async getRoom(id: number): Promise<Room | null> {
    await delay();
    return mock.ROOMS.find((r) => r.id === id) ?? null;
  },

  async getRoomSeats(_id: number): Promise<Seat[]> {
    await delay();
    return mock.ROOM_SEATS;
  },

  async getRoomSpectators(_id: number): Promise<string[]> {
    await delay();
    return mock.ROOM_SPECTATORS;
  },

  async getRoomChat(_id: number): Promise<ChatMsg[]> {
    await delay();
    return mock.ROOM_CHAT;
  },

  // ---------- Friends ----------
  async listFriends(): Promise<Friend[]> {
    await delay();
    return mock.FRIENDS;
  },

  async listLobbyFriends(): Promise<Friend[]> {
    await delay();
    return mock.LOBBY_FRIENDS;
  },

  async listPendingFriends(): Promise<PendingFriend[]> {
    await delay();
    return mock.PENDING_FRIENDS;
  },

  // ---------- Chat ----------
  async getLobbyChat(_gameId?: GameId): Promise<ChatMsg[]> {
    await delay();
    return mock.LOBBY_CHAT;
  },

  async getDMThread(_handle: string): Promise<ChatMsg[]> {
    await delay();
    return mock.DM_THREAD;
  },

  async sendMessage(channelId: string, text: string): Promise<ChatMsg> {
    await delay();
    return { who: 'me', t: nowHHMM(), msg: text };
  },

  // ---------- Groups ----------
  async getGroup(_handle: string): Promise<Group> {
    await delay();
    return mock.GROUP;
  },

  async listGroupChannels(_handle: string): Promise<ChannelCategory[]> {
    await delay();
    return mock.GROUP_CATS;
  },

  async getGroupAnnouncement(_handle: string): Promise<Announcement> {
    await delay();
    return mock.GROUP_ANNOUNCEMENT;
  },

  async listGroupMessages(_handle: string, _channelId: string): Promise<ChatMsg[]> {
    await delay();
    return mock.GROUP_MSGS;
  },

  // ---------- Profile ----------
  async getMe(): Promise<Profile> {
    await delay();
    return mock.ME;
  },

  async getProfile(handle: string): Promise<Profile | null> {
    await delay();
    if (handle === mock.ME.handle) return mock.ME;
    // future: hit backend
    return mock.ME;
  },
};

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
