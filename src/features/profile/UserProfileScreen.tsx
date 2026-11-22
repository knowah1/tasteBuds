import { useParams } from 'react-router-dom';
import { BackBar } from '@/app/TopBar';
import { Screen } from '@/app/Screen';
import { EmptyState, Icon, IconButton } from '@/components/ui';
import { selectUser, useStore } from '@/store';
import { useFakeLoading } from '@/lib/useFakeLoading';
import { ProfileSkeleton } from './ProfileSkeleton';
import { ProfileView } from './ProfileView';

/** Another user's profile (opened by tapping a Bud). ⋯ menu (Report/Block) comes in Phase 3. */
export function UserProfileScreen() {
  const { userId } = useParams();
  const user = useStore(selectUser(userId));
  const isMe = useStore((s) => !!userId && s.me?.id === userId);
  const loading = useFakeLoading();
  return (
    <Screen>
      <BackBar
        title={user ? `@${user.username}` : 'Profile'}
        right={
          <IconButton label="More options">
            <Icon name="more" />
          </IconButton>
        }
      />
      {loading ? (
        <ProfileSkeleton />
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
