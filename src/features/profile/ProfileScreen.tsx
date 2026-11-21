import { TopBar } from '@/app/TopBar';
import { Screen } from '@/app/Screen';
import { useStore } from '@/store';
import { useFakeLoading } from '@/lib/useFakeLoading';
import { ProfileSkeleton } from './ProfileSkeleton';
import { ProfileView } from './ProfileView';

/** The signed-in user's profile (Profile tab). */
export function ProfileScreen() {
  const me = useStore((s) => s.me);
  const loading = useFakeLoading();
  return (
    <Screen>
      <TopBar title="Profile" />
      {loading || !me ? <ProfileSkeleton /> : <ProfileView user={me} isMe />}
    </Screen>
  );
}
