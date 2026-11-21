import { useParams } from 'react-router-dom';
import { BackBar } from '@/app/TopBar';
import { Screen } from '@/app/Screen';
import { EmptyState } from '@/components/ui';
import { useStore } from '@/store';
import { cn } from '@/lib/cn';

/** Placeholder — Track D builds the room (pinned event, members, composer, end event). */
export function ChatRoomScreen() {
  const { roomId = '' } = useParams();
  const room = useStore((s) => s.rooms.find((r) => r.id === roomId));
  const post = useStore((s) => s.posts.find((p) => p.id === room?.postId));
  const messages = useStore((s) => s.messages[roomId]);
  const users = useStore((s) => s.users);
  const meId = useStore((s) => s.me?.id);

  if (!room) {
    return (
      <Screen>
        <BackBar title="Chat" />
        <EmptyState
          emoji="🚪"
          title="Chat not available"
          body="You may not be a member of this kitchen."
        />
      </Screen>
    );
  }
  return (
    <Screen>
      <BackBar title={post?.title ?? 'Chat'} />
      <div className="space-y-2 px-4 pb-6">
        {(messages ?? []).map((m) =>
          m.kind === 'system' ? (
            <p key={m.id} className="py-1 text-center text-xs font-semibold text-ink-muted">
              {m.text}
            </p>
          ) : (
            <div
              key={m.id}
              className={cn('flex', m.senderId === meId ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-soft',
                  m.senderId === meId ? 'bg-mcgill text-white' : 'bg-white',
                )}
              >
                {m.senderId !== meId && (
                  <p className="text-xs font-semibold text-ink-muted">
                    {users.find((u) => u.id === m.senderId)?.firstName}
                  </p>
                )}
                {m.text}
              </div>
            </div>
          ),
        )}
      </div>
    </Screen>
  );
}
