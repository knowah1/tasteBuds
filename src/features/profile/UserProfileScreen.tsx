import { useParams } from 'react-router-dom';
import { BackBar } from '@/app/TopBar';
import { Screen } from '@/app/Screen';
import { EmptyState } from '@/components/ui';
import { useStore } from '@/store';
import { selectAnyUser, selectIsBlocked } from '@/store/safetySlice';
import { BlockedProfile, ProfileSafetyMenu } from '@/features/safety';
import { useFakeLoading } from '@/lib/useFakeLoading';
import { ProfileSkeleton } from './ProfileSkeleton';
import { ProfileView } from './ProfileView';

/** Another user's profile (opened by tapping a Bud). ⋯ menu: Report, Block / Unblock. */
export function UserProfileScreen() {
  const { userId } = useParams();
  const user = useStore(selectAnyUser(userId));
  const isMe = useStore((s) => !!userId && s.me?.id === userId);
  const isBlocked = useStore(selectIsBlocked(userId));
  const loading = useFakeLoading();
  return (
    <Screen>
      <BackBar
        title={user ? `@${user.username}` : 'Profile'}
        right={user && !isMe ? <ProfileSafetyMenu userId={user.id} /> : undefined}
      />
      {loading ? (
        <ProfileSkeleton />
      ) : user && isBlocked ? (
        <BlockedProfile user={user} />
      ) : user ? (
        <ProfileView user={user} isMe={isMe} />
      ) : (
        <EmptyState
          icon="user"
          tone="cream"
          title="Bud not found"
          body="They may have wandered off."
        />
      )}
    </Screen>
  );
}
