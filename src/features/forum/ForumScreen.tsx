import { useNavigate } from 'react-router-dom';
import { TopBar } from '@/app/TopBar';
import { Screen } from '@/app/Screen';
import { Badge, Card, EmptyState, SkeletonList } from '@/components/ui';
import { useStore } from '@/store';
import { isThreadResolved, sortThreadsByUrgency } from '@/mock/api';
import { ingredientEmoji } from '@/lib/cuisine';
import { countdown } from '@/lib/time';
import { useFakeLoading } from '@/lib/useFakeLoading';

/** Placeholder — Track E builds the real feed with live countdowns. */
export function ForumScreen() {
  const navigate = useNavigate();
  const loading = useFakeLoading();
  const threads = useStore((s) => s.threads);
  const replies = useStore((s) => s.replies);
  const sorted = sortThreadsByUrgency(threads);

  return (
    <Screen>
      <TopBar title="Forum" />
      <div className="space-y-3 px-4 pb-6">
        {loading ? (
          <SkeletonList count={4} />
        ) : sorted.length === 0 ? (
          <EmptyState
            emoji="🥫"
            title="No bud-mergencies"
            body="Everyone's fridge is under control. For now."
          />
        ) : (
          sorted.map((t) => {
            const resolved = isThreadResolved(t);
            const count = replies.filter((r) => r.threadId === t.id).length;
            return (
              <Card
                key={t.id}
                interactive
                onClick={() => navigate(`/forum/${t.id}`)}
                className="flex gap-3"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cream-200 text-3xl">
                  {ingredientEmoji(t.ingredient)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display font-semibold leading-tight">{t.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge
                      className={
                        resolved ? 'bg-leaf-100 text-leaf-700' : 'bg-emergency-light text-emergency'
                      }
                    >
                      {resolved ? '✓ Resolved' : `⏱ ${countdown(t.expiresAt)}`}
                    </Badge>
                    <span className="text-xs text-ink-muted">💬 {count}</span>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </Screen>
  );
}
