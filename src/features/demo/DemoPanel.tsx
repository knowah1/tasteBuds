import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Sheet, useToast } from '@/components/ui';
import { api, DEMO_USERNAME } from '@/mock/api';
import { useStore } from '@/store';
import { MyReportsList } from '@/features/safety';

/** Placeholder Demo Panel (long-press logo or `?demo=1`). Phase 4 adds the simulators' triggers. */
export function DemoPanel() {
  const open = useStore((s) => s.demoPanelOpen);
  const setOpen = useStore((s) => s.setDemoPanelOpen);
  const me = useStore((s) => s.me);
  const resetAll = useStore((s) => s.resetAll);
  const signOut = useStore((s) => s.signOut);
  const [switching, setSwitching] = useState<'out' | 'in' | null>(null);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('demo') === '1') setOpen(true);
  }, [setOpen]);

  return (
    <Sheet open={open} onClose={() => setOpen(false)} title="Demo panel">
      <div className="space-y-3 pt-1">
        <Button
          block
          variant="leaf"
          disabled={!me}
          onClick={async () => {
            await api.awardXp(100, { label: 'Demo boost' });
          }}
        >
          +100 XP
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            disabled={!me || !!switching}
            loading={switching === 'out'}
            onClick={async () => {
              setSwitching('out');
              await signOut();
              setSwitching(null);
              setOpen(false);
              navigate('/onboarding', { replace: true });
              toast.success('Signed out', 'See you soon');
            }}
          >
            Sign out
          </Button>
          <Button
            variant="secondary"
            disabled={me?.username === DEMO_USERNAME || !!switching}
            loading={switching === 'in'}
            onClick={async () => {
              setSwitching('in');
              if (me) await signOut();
              const user = await api.quickStartDemoAccount();
              setSwitching(null);
              setOpen(false);
              navigate('/', { replace: true });
              toast.success(`Welcome back, ${user.firstName}!`, `Signed in as @${DEMO_USERNAME}`);
            }}
          >
            Sign in as {DEMO_USERNAME}
          </Button>
        </div>
        <Button
          block
          variant="danger"
          onClick={() => {
            resetAll();
            setOpen(false);
            navigate('/onboarding', { replace: true });
            toast.success('All data reset', 'Fresh seed loaded');
          }}
        >
          Reset all data
        </Button>
        <p className="text-center text-sm text-ink-muted">
          Join requests, fast-forward and nearby posts arrive in Phase 4.
        </p>
        <section className="pt-2">
          <h3 className="mb-2 px-1 font-display text-lg text-ink">Reports</h3>
          <MyReportsList />
        </section>
      </div>
    </Sheet>
  );
}
