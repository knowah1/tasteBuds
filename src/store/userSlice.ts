import type { ID, User } from '@/types';
import { api, ApiError, type ProfilePatch, type StudiesPatch } from '@/mock/api';
import type { SliceCreator } from './types';

export interface UserSlice {
  users: User[];
  /**
   * The same records as `users`, keyed by id. This is the one place a user's Bud lives:
   * avatars resolve it by userId (`useUserBud`) instead of copying it around.
   */
  usersById: Record<ID, User>;
  updateProfile: (patch: ProfilePatch) => Promise<User>;
  /**
   * Sets or clears the signed-in user's major and degree level. Omit a field to keep it,
   * pass `null` to clear it. The mock API persists it; the store resyncs from there.
   */
  updateStudies: (patch: StudiesPatch) => Promise<User>;
}

export const createUserSlice: SliceCreator<UserSlice> = (_set, get) => ({
  users: [],
  usersById: {},
  updateProfile: (patch) => api.updateProfile(patch),
  updateStudies: async (patch) => {
    const userId = get().currentUserId;
    if (!userId) throw new ApiError('unauthenticated', 'No signed-in user');
    const user = await api.updateStudies(userId, patch);
    get().sync();
    return user;
  },
});
