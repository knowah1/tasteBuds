import type { ID, ReportReason, ReportTargetType } from '@/types';
import { api } from '@/mock/api';
import type { SliceCreator } from './types';

export interface SafetySlice {
  report: (input: {
    targetType: ReportTargetType;
    targetId: ID;
    reason: ReportReason;
    details?: string;
  }) => Promise<void>;
  blockUser: (userId: ID) => Promise<void>;
  unblockUser: (userId: ID) => Promise<void>;
  markSafetyTipSeen: () => Promise<void>;
}

export const createSafetySlice: SliceCreator<SafetySlice> = () => ({
  report: async (input) => {
    await api.report(input);
  },
  blockUser: (userId) => api.blockUser(userId),
  unblockUser: (userId) => api.unblockUser(userId),
  markSafetyTipSeen: () => api.markSafetyTipSeen(),
});
