import type { SVGProps } from 'react';

/** Hand-drawn phone receiver in the same stroke style as the shared icon set. */
export function PhoneIcon({ size = 20, ...rest }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      <path d="M6.3 3.9Q8 3.6 9.4 4.4L10.6 7.9Q10.2 9.3 8.8 10.1Q10.4 13.6 13.9 15.3Q14.7 13.9 16.1 13.5L19.6 14.7Q20.4 16.1 20 17.8Q19.2 19.9 17 20.1Q11.3 19.8 7.7 16.3Q4.1 12.7 3.9 7Q4.1 4.7 6.3 3.9Z" />
    </svg>
  );
}
