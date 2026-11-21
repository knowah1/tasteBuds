import type { User } from '@/types';
import { api, type ProfilePatch } from '@/mock/api';
import type { SliceCreator } from './types';

export interface UserSlice {
  users: User[];
  updateProfile: (patch: ProfilePatch) => Promise<User>;
}

export const createUserSlice: SliceCreator<UserSlice> = () => ({
  users: [],
  updateProfile: (patch) => api.updateProfile(patch),
});
