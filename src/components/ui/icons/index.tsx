import type { SVGProps } from 'react';
import { ICON_PATHS, type IconName } from './paths';

export { ICON_PATHS, type IconName };

export interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

/**
 * Hand-drawn line icon. Colour comes from the parent via `currentColor`:
 * kraft when inactive, tomato when active, white on tomato fills.
 */
export function Icon({ name, size = 24, strokeWidth = 2, ...rest }: IconProps) {
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
      focusable="false"
      {...rest}
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

type NamedIconProps = Omit<IconProps, 'name'>;

function named(name: IconName) {
  const C = (props: NamedIconProps) => <Icon name={name} {...props} />;
  C.displayName = `${name[0].toUpperCase()}${name.slice(1)}Icon`;
  return C;
}

// Named components for the sketch-kit icons (sketch 1) and the most common UI ones.
export const MapIcon = named('map');
export const ForumIcon = named('forum');
export const ChatsIcon = named('chat');
export const ProfileIcon = named('user');
export const PlusIcon = named('plus');
export const TimerIcon = named('timer');
export const ReplyIcon = named('reply');
export const WarningIcon = named('warning');
export const SproutIcon = named('sprout');
export const BellIcon = named('bell');
export const LockIcon = named('lock');
export const CheckIcon = named('check');
export const CloseIcon = named('close');
export const SendIcon = named('send');
export const BackIcon = named('chevronLeft');
