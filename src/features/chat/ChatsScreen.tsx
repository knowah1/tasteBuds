import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '@/app/TopBar';
import { Screen } from '@/app/Screen';
import { Card, EmptyState, SkeletonList } from '@/components/ui';
import { useStore, type ChatsSegment } from '@/store';
import { cn } from '@/lib/cn';
import { useFakeLoading } from '@/lib/useFakeLoading';

const SEGMENTS: { id: ChatsSegment; label: string }[] = [
  { id: 'active', label: 'Active' },
  { id: 'archived', label: 'Archived' },
];

/** Placeholder — Track D builds the chat list and rooms. */
export function ChatsScreen() {
  const navigate = useNavigate();
  const loading = useFakeLoading();
  const rooms = useStore((s) => s.rooms);
  const posts = useStore((s) => s.posts);
  const messages = useStore((s) => s.messages);
  const segment = useStore((s) => s.chatsSegment);
  const setSegment = useStore((s) => s.setChatsSegment);
  const list = rooms.filter((r) => (segment === 'archived' ? r.archived : !r.archived));

  return (
    <Screen>
      <TopBar title="Chats" />
      <div className="mx-4 mb-3 flex rounded-full bg-cream-200 p-1">
        {SEGMENTS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSegment(s.id)}
            className={cn(
              'relative flex-1 rounded-full py-2 font-display text-sm font-semibold',
              segment === s.id ? 'text-ink' : 'text-ink-muted',
            )}
          >
            {segment === s.id && (
              <motion.span
                layoutId="chat-seg"
                className="absolute inset-0 rounded-full bg-white shadow-soft"
              />
            )}
            <span className="relative">{s.label}</span>
          </button>
        ))}
      </div>
      <div className="space-y-3 px-4 pb-6">
        {loading ? (
          <SkeletonList count={3} />
        ) : list.length === 0 ? (
          <EmptyState
            emoji={segment === 'active' ? '🍳' : '🗄️'}
            title={segment === 'active' ? 'No kitchens yet' : 'Nothing archived'}
            body={
              segment === 'active'
                ? 'Post an event or ask to join one — chats appear here once someone’s in.'
                : 'Archived chats from past events live here.'
            }
          />
        ) : (
          list.map((r) => {
            const post = posts.find((p) => p.id === r.postId);
            const last = messages[r.id]?.at(-1);
            return (
              <Card key={r.id} interactive onClick={() => navigate(`/chats/${r.id}`)}>
                <p className="font-display font-semibold">{post?.title ?? 'Chat'}</p>
                <p className="truncate text-sm text-ink-muted">{last?.text ?? 'No messages yet'}</p>
              </Card>
            );
          })
        )}
      </div>
    </Screen>
  );
}
