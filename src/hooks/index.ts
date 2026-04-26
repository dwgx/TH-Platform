// Domain hooks — thin wrappers over api/client + useAsync.
// Pages import these instead of importing api directly, so swapping the
// fetcher / adding caching is a one-file change.

import { api } from '@/lib/api/client';
import { useAsync } from './use-async';
import type { GameId } from '@/lib/api/types';

export function useRooms(gameId?: GameId) {
  return useAsync(() => api.listRooms(gameId), [gameId]);
}

export function useRoom(id: number) {
  return useAsync(() => api.getRoom(id), [id]);
}

export function useRoomSeats(id: number) {
  return useAsync(() => api.getRoomSeats(id), [id]);
}

export function useRoomSpectators(id: number) {
  return useAsync(() => api.getRoomSpectators(id), [id]);
}

export function useRoomChat(id: number) {
  return useAsync(() => api.getRoomChat(id), [id]);
}

export function useFriends() {
  return useAsync(() => api.listFriends());
}

export function useLobbyFriends() {
  return useAsync(() => api.listLobbyFriends());
}

export function usePendingFriends() {
  return useAsync(() => api.listPendingFriends());
}

export function useLobbyChat(gameId?: GameId) {
  return useAsync(() => api.getLobbyChat(gameId), [gameId]);
}

export function useDMThread(handle: string) {
  return useAsync(() => api.getDMThread(handle), [handle]);
}

export function useGroup(handle: string) {
  return useAsync(() => api.getGroup(handle), [handle]);
}

export function useGroupChannels(handle: string) {
  return useAsync(() => api.listGroupChannels(handle), [handle]);
}

export function useGroupAnnouncement(handle: string) {
  return useAsync(() => api.getGroupAnnouncement(handle), [handle]);
}

export function useGroupMessages(handle: string, channelId: string) {
  return useAsync(() => api.listGroupMessages(handle, channelId), [handle, channelId]);
}

export function useMe() {
  return useAsync(() => api.getMe());
}

export function useProfile(handle: string) {
  return useAsync(() => api.getProfile(handle), [handle]);
}
