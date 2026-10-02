// API client — real HTTP against the Go backend.
//
// Route table: AGENTS.md section 6 is the single source of truth for paths;
// the response shapes come from ./types.ts. Do not invent routes here.
//
// Config (Vite env, all optional — see src/vite-env.d.ts):
//   VITE_API_BASE_URL  backend origin        default http://127.0.0.1:8080
//   VITE_HANDLE        X-Handle identity     default "local" (no auth this round)
//   VITE_API_USE_MOCK  "1"/"true" -> mock.ts  default OFF, so real HTTP wins
//
// Failure policy: a dead backend must never blank a page. Collection routes
// resolve to [], nullable routes to null, and every failure is logged. The four
// routes whose contract return type is non-nullable (getMe, getGroup,
// getGroupAnnouncement, sendMessage) throw instead — useAsync turns a rejection
// into `data === undefined`, which is what those pages already render.

import * as mock from './mock';
import type {
  Room, Friend, PendingFriend, Seat, ChatMsg, Group, ChannelCategory,
  Profile, Announcement, GameId,
} from './types';

// ---------- configuration ----------

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8080').replace(/\/+$/, '');
const HANDLE = import.meta.env.VITE_HANDLE ?? 'local';
const USE_MOCK = ['1', 'true', 'on'].includes((import.meta.env.VITE_API_USE_MOCK ?? '').toLowerCase());

/**
 * Public view of the resolved configuration. `backend-status.tsx` probes this
 * same origin, so it imports it from here rather than re-deriving the default.
 */
export { BASE_URL as API_BASE_URL };

/**
 * The `X-Handle` value this client sends. Exported because it is the only
 * identity the platform has this round (AGENTS.md section 6: no login yet). A
 * settings page that showed an invented email address and UID was asserting an
 * account the client cannot see; this value it can, and so can the user.
 */
export { HANDLE as API_HANDLE };

const seg = (value: string | number): string => encodeURIComponent(String(value));

/** Mock-only latency knob for exercising skeletons / empty states. */
const FAKE_DELAY_MS = 0;

async function delay() {
  if (FAKE_DELAY_MS) await new Promise((r) => setTimeout(r, FAKE_DELAY_MS));
}

// ---------- transport ----------

/**
 * Decodes a JSON body as T, or null if the body is absent or not a container.
 * The container check is the only validation done without a schema dependency:
 * the server lane builds every struct to ./types.ts field-for-field, so parsing
 * fields here would be a second source of truth. `unknown` first, so no `any`
 * leaks; the one cast below is the single unchecked boundary in the client.
 */
async function decode<T>(res: Response, target: string): Promise<T | null> {
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    console.warn(`[api] ${target}: response body was not JSON`);
    return null;
  }
  if (typeof body !== 'object' || body === null) {
    console.warn(`[api] ${target}: expected a JSON object or array, got ${typeof body}`);
    return null;
  }
  return body as T;
}

/**
 * Performs the request and returns the decoded body, or null on any failure
 * (network error, non-2xx, undecodable body). Failures are logged, never thrown,
 * so one dead route degrades to an empty page instead of a crash.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T | null> {
  const method = init?.method ?? 'GET';
  const target = `${BASE_URL}${path}`;
  let res: Response;
  try {
    res = await fetch(target, {
      ...init,
      headers: {
        'X-Handle': HANDLE,
        ...(init?.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...init?.headers,
      },
    });
  } catch (err) {
    console.warn(`[api] ${method} ${target} failed:`, err);
    return null;
  }
  if (!res.ok) {
    console.warn(`[api] ${method} ${target} -> ${res.status} ${res.statusText}`);
    return null;
  }
  return decode<T>(res, target);
}

// ---------- API (routes per AGENTS.md section 6) ----------

export const api = {
  // ---------- Rooms ----------
  async listRooms(gameId?: GameId): Promise<Room[]> {
    if (USE_MOCK) {
      await delay();
      return gameId ? mock.ROOMS.filter((r) => r.gameId === gameId) : mock.ROOMS;
    }
    return (await request<Room[]>(`/v1/rooms${gameId ? `?game=${seg(gameId)}` : ''}`)) ?? [];
  },

  async getRoom(id: number): Promise<Room | null> {
    if (USE_MOCK) {
      await delay();
      return mock.ROOMS.find((r) => r.id === id) ?? null;
    }
    return request<Room>(`/v1/rooms/${seg(id)}`);
  },

  async getRoomSeats(id: number): Promise<Seat[]> {
    if (USE_MOCK) {
      await delay();
      return mock.ROOM_SEATS;
    }
    return (await request<Seat[]>(`/v1/rooms/${seg(id)}/seats`)) ?? [];
  },

  async getRoomSpectators(id: number): Promise<string[]> {
    if (USE_MOCK) {
      await delay();
      return mock.ROOM_SPECTATORS;
    }
    return (await request<string[]>(`/v1/rooms/${seg(id)}/spectators`)) ?? [];
  },

  async getRoomChat(id: number): Promise<ChatMsg[]> {
    if (USE_MOCK) {
      await delay();
      return mock.ROOM_CHAT;
    }
    return (await request<ChatMsg[]>(`/v1/rooms/${seg(id)}/chat`)) ?? [];
  },

  // ---------- Friends ----------
  async listFriends(): Promise<Friend[]> {
    if (USE_MOCK) {
      await delay();
      return mock.FRIENDS;
    }
    return (await request<Friend[]>('/v1/friends')) ?? [];
  },

  async listLobbyFriends(): Promise<Friend[]> {
    if (USE_MOCK) {
      await delay();
      return mock.LOBBY_FRIENDS;
    }
    return (await request<Friend[]>('/v1/lobby/friends')) ?? [];
  },

  async listPendingFriends(): Promise<PendingFriend[]> {
    if (USE_MOCK) {
      await delay();
      return mock.PENDING_FRIENDS;
    }
    return (await request<PendingFriend[]>('/v1/friends/pending')) ?? [];
  },

  // ---------- Chat ----------
  async getLobbyChat(gameId?: GameId): Promise<ChatMsg[]> {
    if (USE_MOCK) {
      await delay();
      return mock.LOBBY_CHAT;
    }
    return (await request<ChatMsg[]>(`/v1/lobby/chat${gameId ? `?game=${seg(gameId)}` : ''}`)) ?? [];
  },

  async getDMThread(handle: string): Promise<ChatMsg[]> {
    if (USE_MOCK) {
      await delay();
      return mock.DM_THREAD;
    }
    return (await request<ChatMsg[]>(`/v1/dm/${seg(handle)}/chat`)) ?? [];
  },

  async sendMessage(channelId: string, text: string): Promise<ChatMsg> {
    if (USE_MOCK) {
      await delay();
      return { who: 'me', t: nowHHMM(), msg: text };
    }
    const msg = await request<ChatMsg>(`/v1/channels/${seg(channelId)}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    if (msg === null) {
      throw new Error(`[api] POST /v1/channels/${channelId}/messages returned no message`);
    }
    return msg;
  },

  // ---------- Groups ----------
  async getGroup(handle: string): Promise<Group> {
    if (USE_MOCK) {
      await delay();
      return mock.GROUP;
    }
    const group = await request<Group>(`/v1/groups/${seg(handle)}`);
    if (group === null) throw new Error(`[api] GET /v1/groups/${handle} returned no group`);
    return group;
  },

  async listGroupChannels(handle: string): Promise<ChannelCategory[]> {
    if (USE_MOCK) {
      await delay();
      return mock.GROUP_CATS;
    }
    return (await request<ChannelCategory[]>(`/v1/groups/${seg(handle)}/channels`)) ?? [];
  },

  async getGroupAnnouncement(handle: string): Promise<Announcement> {
    if (USE_MOCK) {
      await delay();
      return mock.GROUP_ANNOUNCEMENT;
    }
    const announcement = await request<Announcement>(`/v1/groups/${seg(handle)}/announcement`);
    if (announcement === null) {
      throw new Error(`[api] GET /v1/groups/${handle}/announcement returned no announcement`);
    }
    return announcement;
  },

  async listGroupMessages(handle: string, channelId: string): Promise<ChatMsg[]> {
    if (USE_MOCK) {
      await delay();
      return mock.GROUP_MSGS;
    }
    return (
      (await request<ChatMsg[]>(`/v1/groups/${seg(handle)}/channels/${seg(channelId)}/messages`)) ?? []
    );
  },

  // ---------- Profile ----------
  async getMe(): Promise<Profile> {
    if (USE_MOCK) {
      await delay();
      return mock.ME;
    }
    const me = await request<Profile>('/v1/me');
    if (me === null) throw new Error('[api] GET /v1/me returned no profile');
    return me;
  },

  async getProfile(handle: string): Promise<Profile | null> {
    if (USE_MOCK) {
      await delay();
      return mock.ME;
    }
    return request<Profile>(`/v1/users/${seg(handle)}`);
  },
};

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}