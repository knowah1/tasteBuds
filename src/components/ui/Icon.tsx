import type { SVGProps } from 'react';

export type IconName =
  | 'map'
  | 'forum'
  | 'chat'
  | 'user'
  | 'plus'
  | 'bell'
  | 'close'
  | 'chevronLeft'
  | 'chevronRight'
  | 'more'
  | 'check'
  | 'lock'
  | 'send'
  | 'flag'
  | 'clock'
  | 'users'
  | 'sparkle';

const PATHS: Record<IconName, JSX.Element> = {
  map: (
    <>
      <path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4Z" />
      <path d="M9 4v14M15 6v14" />
    </>
  ),
  forum: (
    <>
      <path d="M4 5h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 3v-3H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
      <path d="M17 9h3a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-1v2.5L16 19h-4" />
    </>
  ),
  chat: (
    <path d="M12 3c5 0 9 3.4 9 7.6 0 4.2-4 7.6-9 7.6-1 0-2-.1-2.9-.4L4 20l1.4-4C4 14.6 3 12.7 3 10.6 3 6.4 7 3 12 3Z" />
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1-4 4.2-6 8-6s7 2 8 6" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  bell: (
    <>
      <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Z" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  chevronLeft: <path d="m15 5-7 7 7 7" />,
  chevronRight: <path d="m9 5 7 7-7 7" />,
  more: (
    <>
      <circle cx="5" cy="12" r="1.3" fill="currentColor" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" />
      <circle cx="19" cy="12" r="1.3" fill="currentColor" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  lock: (
    <>
      <rect x="5" y="10" width="14" height="10" rx="2.5" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
    </>
  ),
  send: <path d="M4 12 20 4l-6 16-2.5-6.5L4 12Z" />,
  flag: <path d="M5 21V4m0 0h11l-2 4 2 4H5" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.8-3.5 3.4-5.3 6.5-5.3s5.7 1.8 6.5 5.3" />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.9c1.8.7 3 2.4 3.5 5.1" />
    </>
  ),
  sparkle: (
    <path d="M12 3c.5 4.5 2 6.5 6.5 7-4.5.5-6 2.5-6.5 7-.5-4.5-2-6.5-6.5-7 4.5-.5 6-2.5 6.5-7Z" />
  ),
};

export interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 24, strokeWidth = 2.2, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
