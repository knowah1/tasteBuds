import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
  interactive?: boolean;
}

export function Card({ padded = true, interactive, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-chunky bg-white shadow-soft ring-1 ring-cream-200',
        padded && 'p-4',
        interactive && 'cursor-pointer transition-transform active:scale-[0.98]',
        className,
      )}
      {...rest}
    />
  );
}
