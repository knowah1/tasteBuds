import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Sheet, useToast } from '@/components/ui';
import { api } from '@/mock/api';
import { useStore } from '@/store';

/** Placeholder Demo Panel (long-press logo or `?demo=1`). Phase 4 adds the simulators' triggers. */
export function DemoPanel() {
  const open = useStore((s) => s.demoPanelOpen);
  const setOpen = useStore((s) => s.setDemoPanelOpen);
  const me = useStore((s) => s.me);
  const resetAll = useStore((s) => s.resetAll);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('demo') === '1') setOpen(true);
  }, [setOpen]);

  return (
    <Sheet open={open} onClose={() => setOpen(false)} title="🎬 Demo panel">
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
        <Button
          block
          variant="danger"
          onClick={() => {
            resetAll();
            setOpen(false);
            navigate('/onboarding', { replace: true });
            toast.success('All data reset', 'Fresh seed loaded 🌱');
          }}
        >
          Reset all data
        </Button>
        <p className="text-center text-xs text-ink-muted">
          Join requests, fast-forward and nearby posts arrive in Phase 4.
        </p>
      </div>
    </Sheet>
  );
}
