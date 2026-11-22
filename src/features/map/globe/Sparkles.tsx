import { GLOBE_COLORS } from './theme';

/** A handful of four-point sparkles that twinkle slowly behind the globe. */
const SPARKLES = [
  { left: '9%', top: '14%', size: 14, delay: 0 },
  { left: '84%', top: '9%', size: 10, delay: 1.1 },
  { left: '90%', top: '58%', size: 12, delay: 2.2 },
  { left: '6%', top: '66%', size: 9, delay: 0.6 },
  { left: '70%', top: '86%', size: 8, delay: 1.7 },
];

export function Sparkles() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {SPARKLES.map((s, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          width={s.size}
          height={s.size}
          className="tb-sparkle absolute"
          style={{ left: s.left, top: s.top, animationDelay: `${s.delay}s` }}
        >
          <path
            d="M10 0 C11 7 13 9 20 10 C13 11 11 13 10 20 C9 13 7 11 0 10 C7 9 9 7 10 0 Z"
            fill={GLOBE_COLORS.glow}
            stroke={GLOBE_COLORS.ocean}
            strokeWidth={1}
          />
        </svg>
      ))}
    </div>
  );
}
