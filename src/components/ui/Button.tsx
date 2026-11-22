import { forwardRef, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'leaf' | 'sage' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

/** Flat fills plus hand-drawn outlines. No shadows, no gradients. */
const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-tomato text-white hover:brightness-95',
  secondary: 'bg-paper text-ink border-2 border-kraft hover:bg-cream',
  ghost: 'bg-transparent text-ink-soft hover:bg-cream',
  leaf: 'bg-leaf text-white hover:brightness-95',
  /** The button inside mint hero cards (sketch 2). */
  sage: 'bg-sage text-ink border-2 border-kraft hover:brightness-95',
  danger: 'bg-paper text-tomato border-2 border-blush hover:bg-blush/40',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-sm sketch-pill gap-1.5',
  md: 'h-12 px-5 text-base sketch-sm gap-2',
  lg: 'h-14 px-6 text-lg sketch gap-2',
};

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    block,
    loading,
    leftIcon,
    rightIcon,
    disabled,
    className,
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;
  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={isDisabled}
      whileTap={isDisabled ? undefined : { scale: 0.95, y: 2 }}
      whileHover={isDisabled ? undefined : { scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      className={cn(
        'inline-flex select-none items-center justify-center font-display transition-colors',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sage',
        VARIANTS[variant],
        SIZES[size],
        block && 'w-full',
        isDisabled && 'cursor-not-allowed opacity-50',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span className="sketch-round h-5 w-5 animate-spin border-[3px] border-current border-t-transparent" />
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )}
    </motion.button>
  );
});

export interface IconButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  label: string;
  children: ReactNode;
  badge?: number;
}

export function IconButton({ label, children, badge, className, ...rest }: IconButtonProps) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      whileTap={{ scale: 0.88 }}
      className={cn(
        'sketch-round border-2 border-kraft inline-flex h-11 w-11 items-center justify-center bg-paper text-ink',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sage',
        className,
      )}
      {...rest}
    >
      {children}
      {!!badge && badge > 0 && (
        <span className="sketch-pill absolute -right-1 -top-1 z-10 flex h-5 min-w-5 items-center justify-center bg-tomato px-1 font-display text-xs leading-none text-white ring-2 ring-cream">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </motion.button>
  );
}
