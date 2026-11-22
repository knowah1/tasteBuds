import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Icon, useToast } from '@/components/ui';
import { useStore } from '@/store';
import type { User } from '@/types';

/** What a blocked user's profile shows instead of their Bud and events. */
export function BlockedProfile({ user }: { user: User }) {
  const unblockUser = useStore((s) => s.unblockUser);
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  return (
    <div className="px-4 pb-28 pt-6">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 26 }}
        className="sketch-3 flex flex-col items-center border-2 border-kraft bg-paper px-5 py-8 text-center"
      >
        <span className="sketch-round mb-4 flex h-20 w-20 items-center justify-center bg-cream text-kraft">
          <Icon name="block" size={44} />
        </span>
        <h2 className="font-display text-2xl text-ink">You blocked @{user.username}</h2>
        <p className="mt-1 max-w-xs font-body text-base text-ink-soft">
          Their Bud, posts and messages are hidden for you. They haven’t been told.
        </p>
        <Button
          className="mt-5 px-8"
          variant="secondary"
          loading={busy}
          leftIcon={<Icon name="refresh" size={18} />}
          onClick={async () => {
            setBusy(true);
            await unblockUser(user.id);
            setBusy(false);
            toast.success(`@${user.username} unblocked`, `${user.firstName}’s Bud is back.`);
          }}
        >
          Unblock
        </Button>
      </motion.div>
    </div>
  );
}
