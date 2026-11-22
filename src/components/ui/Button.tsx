import { forwardRef, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'leaf' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-mcgill text-white shadow-chunky hover:bg-mcgill-dark',
  secondary: 'bg-white text-ink shadow-chunky ring-2 ring-cream-300 hover:bg-cream-50',
  ghost: 'bg-transparent text-ink-soft hover:bg-cream-200',
  leaf: 'bg-leaf-500 text-white shadow-chunky hover:bg-leaf-600',
  danger: 'bg-white text-mcgill ring-2 ring-mcgill-light shadow-chunky hover:bg-mcgill-light',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-sm rounded-full gap-1.5',
  md: 'h-12 px-5 text-base rounded-2xl gap-2',
  lg: 'h-14 px-6 text-lg rounded-chunky gap-2',
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
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-leaf-200',
        VARIANTS[variant],
        SIZES[size],
        block && 'w-full',
        isDisabled && 'cursor-not-allowed opacity-50',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span className="h-5 w-5 animate-spin rounded-full border-[3px] border-current border-t-transparent" />
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
        'relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink shadow-soft',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-leaf-200',
        className,
      )}
      {...rest}
    >
      {children}
      {!!badge && badge > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-mcgill px-1 font-display text-xs leading-none text-white ring-2 ring-cream">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </motion.button>
  );
}
