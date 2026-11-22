import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/cn';

interface FieldChrome {
  label?: string;
  hint?: ReactNode;
  error?: string | null;
  success?: string | null;
  trailing?: ReactNode;
}

const inputBase =
  'w-full rounded-2xl bg-white px-4 text-base text-ink placeholder:text-ink-muted ring-2 transition-shadow focus:outline-none';

function ring(error?: string | null, success?: string | null) {
  if (error) return 'ring-mcgill focus:ring-mcgill';
  if (success) return 'ring-leaf-400 focus:ring-leaf-500';
  return 'ring-cream-300 focus:ring-leaf-400';
}

function Messages({ id, error, success, hint }: { id: string } & FieldChrome) {
  if (error)
    return (
      <p id={id} className="mt-1.5 pl-1 text-sm text-mcgill">
        {error}
      </p>
    );
  if (success)
    return (
      <p id={id} className="mt-1.5 pl-1 text-sm text-leaf-600">
        {success}
      </p>
    );
  if (hint)
    return (
      <div id={id} className="mt-1.5 pl-1 text-sm text-ink-muted">
        {hint}
      </div>
    );
  return null;
}

export type TextFieldProps = FieldChrome & InputHTMLAttributes<HTMLInputElement>;

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, success, trailing, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const msgId = `${inputId}-msg`;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block pl-1 text-sm text-ink-soft">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={msgId}
          className={cn(inputBase, 'h-12', ring(error, success), !!trailing && 'pr-12')}
          {...rest}
        />
        {trailing && <div className="absolute inset-y-0 right-3 flex items-center">{trailing}</div>}
      </div>
      <Messages id={msgId} error={error} success={success} hint={hint} />
    </div>
  );
});

export type TextAreaProps = FieldChrome &
  TextareaHTMLAttributes<HTMLTextAreaElement> & { maxLength?: number; showCount?: boolean };

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, hint, error, success, className, id, maxLength, showCount = true, value, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const len = typeof value === 'string' ? value.length : 0;
  const near = maxLength ? len >= maxLength * 0.9 : false;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block pl-1 text-sm text-ink-soft">
          {label}
        </label>
      )}
      <div className="relative">
        <textarea
          ref={ref}
          id={inputId}
          value={value}
          maxLength={maxLength}
          className={cn(inputBase, 'min-h-[96px] resize-none py-3', ring(error, success))}
          {...rest}
        />
        {maxLength && showCount && (
          <span
            className={cn(
              'pointer-events-none absolute bottom-2 right-3 text-sm',
              near ? 'text-mcgill' : 'text-ink-muted',
            )}
          >
            {len}/{maxLength}
          </span>
        )}
      </div>
      <Messages id={`${inputId}-msg`} error={error} success={success} hint={hint} />
    </div>
  );
});
