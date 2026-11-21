import type { ChatRoom, ID, Message } from '@/types';
import { api } from '@/mock/api';
import type { SliceCreator } from './types';

export interface ChatSlice {
  rooms: ChatRoom[];
  /** Keyed by roomId; already filtered by the late-joiner rule. */
  messages: Record<ID, Message[]>;
  sendMessage: (roomId: ID, text: string) => Promise<Message>;
}

export const createChatSlice: SliceCreator<ChatSlice> = () => ({
  rooms: [],
  messages: {},
  sendMessage: async (roomId, text) => (await api.sendMessage(roomId, text)).message,
});
