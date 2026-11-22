import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@/components/ui';
import { cn } from '@/lib/cn';
import { EMERGENCY_CALLS, telHref, type PhoneContact } from './mcgillContacts';
import { PhoneIcon } from './SafetyIcons';

/** Big tappable row that's really a link (tel:, mailto:, https:). */
export function ContactLink({
  href,
  icon,
  label,
  note,
  tone = 'paper',
  external,
  onClick,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  note?: string;
  tone?: 'paper' | 'tomato' | 'blush';
  external?: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.a
      href={href}
      onClick={onClick}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      whileTap={{ scale: 0.96, y: 2 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      className={cn(
        'sketch-sm flex min-h-14 items-center gap-3 px-3 py-2.5',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sage',
        tone === 'tomato' && 'bg-tomato text-white',
        tone === 'blush' && 'border-2 border-tomato bg-paper text-tomato',
        tone === 'paper' && 'border-2 border-kraft bg-paper text-ink',
      )}
    >
      <span
        className={cn(
          'sketch-round flex h-10 w-10 shrink-0 items-center justify-center',
          tone === 'tomato' ? 'bg-paper text-tomato' : 'bg-cream',
          tone === 'paper' && 'text-leaf',
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-base leading-tight">{label}</span>
        {note && (
          <span
            className={cn(
              'block font-body text-sm',
              tone === 'tomato' ? 'text-white/90' : 'text-ink-muted',
            )}
          >
            {note}
          </span>
        )}
      </span>
      <Icon name={external ? 'arrowRight' : 'chevronRight'} size={18} className="shrink-0" />
    </motion.a>
  );
}

export function CallLink({
  contact,
  tone,
}: {
  contact: PhoneContact;
  tone?: 'paper' | 'tomato' | 'blush';
}) {
  return (
    <ContactLink
      href={telHref(contact)}
      icon={<PhoneIcon size={20} />}
      label={`${contact.label} · ${contact.display}`}
      note={contact.note}
      tone={tone}
    />
  );
}

/** "In danger right now" card: 911 first, then McGill Security's emergency lines. */
export function EmergencyCard({ className }: { className?: string }) {
  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 24 }}
      className={cn('sketch-2 border-[3px] border-tomato bg-blush p-4', className)}
    >
      <div className="mb-3 flex items-center gap-2 text-tomato">
        <Icon name="warning" size={24} strokeWidth={2.4} />
        <h3 className="font-display text-lg leading-tight">
          Call 911 first, then McGill Security.
        </h3>
      </div>
      <div className="space-y-2">
        {EMERGENCY_CALLS.map((c, i) => (
          <CallLink key={c.tel} contact={c} tone={i === 0 ? 'tomato' : 'blush'} />
        ))}
      </div>
    </motion.div>
  );
}
