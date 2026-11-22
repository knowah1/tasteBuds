import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Button,
  Icon,
  IconButton,
  Modal,
  Portal,
  OVERLAY_ROOT_ID,
  useToast,
} from '@/components/ui';
import { useStore } from '@/store';
import { selectAnyUser, selectIsBlocked } from '@/store/safetySlice';
import { cn } from '@/lib/cn';
import type { ID } from '@/types';
import { ReportSheet } from './ReportSheet';

/**
 * The ⋯ button on someone else's profile: Report, and Block or Unblock.
 * Owns its popover, the block confirmation and the report sheet.
 */
export function ProfileSafetyMenu({ userId }: { userId: ID }) {
  const user = useStore(selectAnyUser(userId));
  const isBlocked = useStore(selectIsBlocked(userId));
  const blockUser = useStore((s) => s.blockUser);
  const unblockUser = useStore((s) => s.unblockUser);
  const toast = useToast();
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!user) return null;
  const handle = `@${user.username}`;

  const doBlock = async () => {
    setBusy(true);
    await blockUser(userId);
    setBusy(false);
    setConfirmBlock(false);
    toast.success(`${handle} blocked`, 'Their Bud, posts and messages are hidden.');
  };

  const doUnblock = async () => {
    setMenuOpen(false);
    await unblockUser(userId);
    toast.success(`${handle} unblocked`, `${user.firstName}’s Bud is back on your map.`);
  };

  return (
    <>
      <span ref={anchorRef} className="inline-flex">
        <IconButton
          label="More options"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <Icon name="more" />
        </IconButton>
      </span>

      <Popover open={menuOpen} anchorRef={anchorRef} onClose={() => setMenuOpen(false)}>
        <MenuItem
          icon="flag"
          danger
          onClick={() => {
            setMenuOpen(false);
            setReportOpen(true);
          }}
        >
          Report {handle}
        </MenuItem>
        {isBlocked ? (
          <MenuItem icon="refresh" onClick={doUnblock}>
            Unblock {handle}
          </MenuItem>
        ) : (
          <MenuItem
            icon="block"
            onClick={() => {
              setMenuOpen(false);
              setConfirmBlock(true);
            }}
          >
            Block {handle}
          </MenuItem>
        )}
      </Popover>

      <Modal open={confirmBlock} onClose={() => !busy && setConfirmBlock(false)}>
        <div className="flex flex-col items-center text-center">
          <span className="sketch-round mb-3 flex h-16 w-16 items-center justify-center bg-blush text-tomato">
            <Icon name="block" size={34} />
          </span>
          <h2 className="font-display text-2xl text-ink">Block {handle}?</h2>
          <p className="mt-1 font-body text-base text-ink-soft">
            Their Bud, posts and messages disappear for you. They won’t be told. You can unblock
            from their profile any time.
          </p>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="secondary" disabled={busy} onClick={() => setConfirmBlock(false)}>
            Cancel
          </Button>
          <Button loading={busy} onClick={doBlock}>
            Block
          </Button>
        </div>
      </Modal>

      <ReportSheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="user"
        targetId={userId}
      />
    </>
  );
}

/** Small menu anchored under a button, inside the phone frame. Closes on outside tap. */
function Popover({
  open,
  anchorRef,
  onClose,
  children,
}: {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement>;
  onClose: () => void;
  children: ReactNode;
}) {
  const [pos, setPos] = useState({ top: 72, right: 12 });

  useLayoutEffect(() => {
    if (!open) return;
    const anchor = anchorRef.current?.getBoundingClientRect();
    const root = document.getElementById(OVERLAY_ROOT_ID)?.getBoundingClientRect();
    if (anchor && root) {
      setPos({ top: anchor.bottom - root.top + 8, right: root.right - anchor.right });
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, anchorRef, onClose]);

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <div className="pointer-events-auto absolute inset-0 z-40">
            <motion.div
              className="absolute inset-0 bg-ink/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              role="menu"
              style={{ top: pos.top, right: pos.right, originX: 1, originY: 0 }}
              initial={{ opacity: 0, scale: 0.6, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -6 }}
              transition={{ type: 'spring', stiffness: 520, damping: 24 }}
              className="sketch-2 absolute w-64 overflow-hidden border-2 border-kraft bg-paper p-1.5"
            >
              {children}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
}

function MenuItem({
  icon,
  danger,
  onClick,
  children,
}: {
  icon: 'flag' | 'block' | 'refresh';
  danger?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <motion.button
      type="button"
      role="menuitem"
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className={cn(
        'sketch-sm flex h-14 w-full items-center gap-3 px-3 text-left font-display text-base',
        'hover:bg-cream focus-visible:bg-cream focus-visible:outline-none',
        danger ? 'text-tomato' : 'text-ink',
      )}
    >
      <Icon name={icon} size={22} className="shrink-0" />
      <span className="min-w-0 truncate">{children}</span>
    </motion.button>
  );
}
