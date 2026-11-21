import { Avatar, Badge, Card, ProgressBar } from '@/components/ui';
import { CUISINE_META, TONE_CLASSES } from '@/lib/cuisine';
import { levelProgress } from '@/lib/xp';
import type { User } from '@/types';

/** Shared profile header (Bud, name, level, cuisines). Track C extends this. */
export function ProfileView({ user, isMe }: { user: User; isMe?: boolean }) {
  const lv = levelProgress(user.xp);
  return (
    <div className="space-y-4 px-4 pb-8">
      <div className="flex flex-col items-center pt-2 text-center">
        <Avatar bud={user.bud} size={132} ring={isMe} />
        <h2 className="mt-4 font-display text-2xl font-bold">
          {user.firstName} {user.lastName}
        </h2>
        <p className="text-ink-muted">@{user.username}</p>
        {user.bio && <p className="mt-2 max-w-xs text-sm text-ink-soft">{user.bio}</p>}
      </div>
      <Card>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="font-display text-lg font-semibold">Level {lv.level}</span>
          <span className="text-sm text-ink-muted">
            {lv.current} / {lv.needed} XP
          </span>
        </div>
        <ProgressBar value={lv.progress} label="Level progress" />
      </Card>
      <Card>
        <h3 className="mb-2 font-display font-semibold">Cuisines</h3>
        <div className="flex flex-wrap gap-2">
          {user.cuisines.map((c) => (
            <Badge key={c.cuisine} className={TONE_CLASSES[CUISINE_META[c.cuisine].tone]}>
              {CUISINE_META[c.cuisine].emoji} {c.cuisine} · {c.level}
            </Badge>
          ))}
          {user.cuisines.length === 0 && <p className="text-sm text-ink-muted">No cuisines yet.</p>}
        </div>
      </Card>
    </div>
  );
}
