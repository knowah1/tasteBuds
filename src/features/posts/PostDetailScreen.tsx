import { useParams } from 'react-router-dom';
import { BackBar } from '@/app/TopBar';
import { Screen } from '@/app/Screen';
import { Badge, Button, Card, EmptyState } from '@/components/ui';
import { selectPost, selectUser, useStore } from '@/store';
import { POST_TYPE_META } from '@/lib/cuisine';
import { formatRange } from '@/lib/time';

/** Placeholder — Track C builds full event detail with "Ask to join". */
export function PostDetailScreen() {
  const { postId } = useParams();
  const post = useStore(selectPost(postId));
  const host = useStore(selectUser(post?.hostId));
  if (!post) {
    return (
      <Screen>
        <BackBar title="Event" />
        <EmptyState emoji="🍽️" title="Event not found" />
      </Screen>
    );
  }
  const meta = POST_TYPE_META[post.type];
  return (
    <Screen>
      <BackBar title={meta.label} />
      <div className="space-y-4 px-4 pb-8">
        <Card>
          <Badge className={meta.classes}>
            {meta.emoji} {meta.label}
          </Badge>
          <h2 className="mt-2 font-display text-2xl font-bold">{post.title}</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Hosted by {host?.firstName ?? 'someone'} · {formatRange(post.startAt, post.endAt)}
          </p>
          <p className="mt-3 text-ink-soft">{post.description}</p>
        </Card>
        {post.type !== 'budmergency' && (
          <Button block size="lg" disabled>
            Ask to join (Track C)
          </Button>
        )}
      </div>
    </Screen>
  );
}
