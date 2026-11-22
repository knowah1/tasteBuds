import { useNavigate } from 'react-router-dom';
import { BackBar } from '@/app/TopBar';
import { Screen } from '@/app/Screen';
import { Button, Card, EmptyState } from '@/components/ui';
import { useStore } from '@/store';
import { cn } from '@/lib/cn';
import { timeAgo } from '@/lib/time';

/** Placeholder notification center — Phase 3 polishes this. */
export function NotificationsScreen() {
  const navigate = useNavigate();
  const notifications = useStore((s) => s.notifications);
  const markRead = useStore((s) => s.markNotificationRead);
  const markAll = useStore((s) => s.markAllNotificationsRead);
  return (
    <Screen>
      <BackBar
        title="Notifications"
        right={
          notifications.some((n) => !n.read) && (
            <Button size="sm" variant="ghost" onClick={() => markAll()}>
              Mark all read
            </Button>
          )
        }
      />
      <div className="space-y-2 px-4 pb-6">
        {notifications.length === 0 ? (
          <EmptyState
            icon="bell"
            tone="cream"
            title="All quiet"
            body="Join requests, replies and level-ups show up here."
          />
        ) : (
          notifications.map((n) => (
            <Card
              key={n.id}
              interactive
              className={cn(!n.read && 'ring-2 ring-blush')}
              onClick={() => {
                markRead(n.id);
                if (n.href) navigate(n.href);
              }}
            >
              <p className="font-display text-lg">{n.title}</p>
              {n.body && <p className="text-sm text-ink-soft">{n.body}</p>}
              <p className="mt-1 text-sm text-ink-muted">{timeAgo(n.createdAt)}</p>
            </Card>
          ))
        )}
      </div>
    </Screen>
  );
}
