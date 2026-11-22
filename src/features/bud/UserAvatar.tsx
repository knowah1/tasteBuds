import { memo } from 'react';
import { Avatar, type AvatarProps } from '@/components/ui';
import { useUserBud } from '@/store';
import type { ID } from '@/types';
import { DEFAULT_BUD } from './budMeta';

export type UserAvatarProps = Omit<AvatarProps, 'bud'> & { userId: ID | null | undefined };

/**
 * The compact `Avatar` for a real user: resolves the Bud from their user record by id,
 * so it always shows their current look (chat, members, request cards…).
 */
export const UserAvatar = memo(function UserAvatar({ userId, ...rest }: UserAvatarProps) {
  const bud = useUserBud(userId) ?? DEFAULT_BUD;
  return <Avatar bud={bud} {...rest} />;
});
