import type { ID, Notification } from '@/types';
import { api } from '@/mock/api';
import type { SliceCreator } from './types';

export interface NotificationSlice {
  notifications: Notification[];
  markNotificationRead: (id: ID) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

export const createNotificationSlice: SliceCreator<NotificationSlice> = () => ({
  notifications: [],
  markNotificationRead: (id) => api.markNotificationRead(id),
  markAllNotificationsRead: () => api.markAllNotificationsRead(),
});
