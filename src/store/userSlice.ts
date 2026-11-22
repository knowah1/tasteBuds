import type { ID, User } from '@/types';
import { api, type ProfilePatch } from '@/mock/api';
import type { SliceCreator } from './types';

export interface UserSlice {
  users: User[];
  /**
   * The same records as `users`, keyed by id. This is the one place a user's Bud lives:
   * avatars resolve it by userId (`useUserBud`) instead of copying it around.
   */
  usersById: Record<ID, User>;
  updateProfile: (patch: ProfilePatch) => Promise<User>;
}

export const createUserSlice: SliceCreator<UserSlice> = () => ({
  users: [],
  usersById: {},
  updateProfile: (patch) => api.updateProfile(patch),
});
