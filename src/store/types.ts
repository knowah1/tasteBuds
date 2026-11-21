import type { StateCreator } from 'zustand';
import type { SessionSlice } from './sessionSlice';
import type { UserSlice } from './userSlice';
import type { PostSlice } from './postSlice';
import type { ChatSlice } from './chatSlice';
import type { ForumSlice } from './forumSlice';
import type { NotificationSlice } from './notificationSlice';
import type { XPSlice } from './xpSlice';
import type { SafetySlice } from './safetySlice';
import type { UISlice } from './uiSlice';

export type AppState = SessionSlice &
  UserSlice &
  PostSlice &
  ChatSlice &
  ForumSlice &
  NotificationSlice &
  XPSlice &
  SafetySlice &
  UISlice;

export type SliceCreator<T> = StateCreator<AppState, [['zustand/persist', unknown]], [], T>;
