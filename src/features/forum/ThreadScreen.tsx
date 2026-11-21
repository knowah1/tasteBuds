import { useParams } from 'react-router-dom';
import { BackBar } from '@/app/TopBar';
import { Screen } from '@/app/Screen';
import { Card, EmptyState } from '@/components/ui';
import { useStore } from '@/store';
import { timeAgo } from '@/lib/time';

/** Placeholder — Track E builds threaded replies, 🌱 upvotes and "This saved me!". */
export function ThreadScreen() {
  const { threadId } = useParams();
  const thread = useStore((s) => s.threads.find((t) => t.id === threadId));
  const allReplies = useStore((s) => s.replies);
  const users = useStore((s) => s.users);
  const replies = allReplies.filter((r) => r.threadId === threadId);
  if (!thread) {
    return (
      <Screen>
        <BackBar title="Thread" />
        <EmptyState emoji="🥫" title="Thread not found" />
      </Screen>
    );
  }
  return (
    <Screen>
      <BackBar title="Bud-mergency" />
      <div className="space-y-3 px-4 pb-6">
        <Card>
          <h2 className="font-display text-xl font-bold">{thread.title}</h2>
          <p className="mt-1 text-ink-soft">{thread.description}</p>
        </Card>
        {replies.map((r) => (
          <Card key={r.id} className={r.parentId ? 'ml-6' : undefined}>
            <p className="text-xs text-ink-muted">
              {users.find((u) => u.id === r.authorId)?.firstName} · {timeAgo(r.createdAt)}
              {thread.savedReplyId === r.id && ' · 🌟 This saved me!'}
            </p>
            <p className="mt-1">{r.text}</p>
            <p className="mt-1 text-xs text-ink-muted">🌱 {r.upvoterIds.length}</p>
          </Card>
        ))}
      </div>
    </Screen>
  );
}
