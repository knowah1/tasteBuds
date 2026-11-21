import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '@/app/TopBar';
import { Screen } from '@/app/Screen';
import { Button, Modal, useToast } from '@/components/ui';
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
      {loading || !me ? (
        <ProfileSkeleton />
      ) : (
        <ProfileView user={me} isMe footer={<SignOutButton />} />
      )}
    </Screen>
  );
}

function SignOutButton() {
  const signOut = useStore((s) => s.signOut);
  const navigate = useNavigate();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    await signOut();
    setBusy(false);
    setConfirming(false);
    navigate('/onboarding', { replace: true });
    toast.success('Signed out', 'See you soon 🌱');
  };

  return (
    <div className="pt-2">
      <Button block variant="danger" onClick={() => setConfirming(true)}>
        Sign out
      </Button>
      <Modal open={confirming} onClose={() => !busy && setConfirming(false)} className="text-center">
        <p className="text-4xl">👋</p>
        <h2 className="mt-2 font-display text-xl font-bold">Sign out?</h2>
        <p className="mt-1 text-sm text-ink-soft">You'll go back to the welcome screen.</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="secondary" disabled={busy} onClick={() => setConfirming(false)}>
            Cancel
          </Button>
          <Button loading={busy} onClick={confirm}>
            Sign out
          </Button>
        </div>
      </Modal>
    </div>
  );
}
