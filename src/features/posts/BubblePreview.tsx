import { motion } from 'framer-motion';
import { BudAvatar } from '@/features/bud';
import { POST_TYPE_META } from '@/lib/cuisine';
import { cn } from '@/lib/cn';
import type { ID, PostType } from '@/types';

const BACKDROP: Record<PostType, string> = {
  learn: 'from-learn-light',
  teach: 'from-teach-light',
  potluck: 'from-potluck-light',
  budmergency: 'from-emergency-light',
};

/**
 * Live preview of the map bubble while drafting: the user's own Bud with the
 * auto-generated title above its head. Re-pops whenever `popKey` changes.
 */
export function BubblePreview({
  userId,
  type,
  title,
  complete,
  popKey,
  size = 76,
  className,
}: {
  /** Whose Bud to show (resolved from their user record). */
  userId: ID | undefined;
  type: PostType;
  title: string;
  /** False while a title slot is still a placeholder (dims the bubble). */
  complete: boolean;
  popKey: string;
  size?: number;
  className?: string;
}) {
  const emergency = type === 'budmergency';
  return (
    <div
      className={cn(
        'relative flex flex-col items-center overflow-hidden rounded-chunky bg-gradient-to-b to-cream px-4 pb-3 ring-1 ring-cream-200',
        BACKDROP[type],
        className,
      )}
      style={{ paddingTop: size * 0.95 }}
    >
      <span className="absolute left-3 top-2.5 text-sm uppercase tracking-wide text-ink-muted">
        Live preview
      </span>
      <motion.div
        key={popKey}
        className={cn('transition-opacity', complete ? 'opacity-100' : 'opacity-60')}
      >
        <BudAvatar
          userId={userId}
          size={size}
          state={emergency ? 'panicked' : 'hasBubble'}
          bubble={title}
          bubbleType={type}
          ring
          label="Your Bud"
        />
      </motion.div>
      <span className={cn('mt-5 text-sm', emergency ? 'text-emergency' : 'text-ink-muted')}>
        {POST_TYPE_META[type].emoji} This is how your Bud will look on the map
      </span>
    </div>
  );
}
