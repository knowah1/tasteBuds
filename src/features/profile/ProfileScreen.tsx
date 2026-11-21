import { TopBar } from '@/app/TopBar';
import { Screen } from '@/app/Screen';
import { SkeletonList } from '@/components/ui';
import { useStore } from '@/store';
import { useFakeLoading } from '@/lib/useFakeLoading';
import { ProfileView } from './ProfileView';

/** The signed-in user's profile. Track C adds events; Track A adds the Bud editor entry. */
export function ProfileScreen() {
  const me = useStore((s) => s.me);
  const loading = useFakeLoading();
  return (
    <Screen>
      <TopBar title="Profile" />
      {loading || !me ? (
        <div className="px-4">
          <SkeletonList count={3} />
        </div>
      ) : (
        <ProfileView user={me} isMe />
      )}
    </Screen>
  );
}
