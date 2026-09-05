function seeded(i: number, seed: number): number {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function Wave({
  bars = 24,
  seed = 1,
  width = 200,
  height = 32,
  className,
}: {
  bars?: number;
  seed?: number;
  width?: number;
  height?: number;
  className?: string;
}) {
  const gap = (width / bars) * 0.32;
  const barWidth = (width - gap * (bars - 1)) / bars;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      {Array.from({ length: bars }, (_, i) => {
        const amp = 0.22 + seeded(i, seed) * 0.72;
        const barHeight = Math.max(2, height * amp);
        const y = (height - barHeight) / 2;
        const x = i * (barWidth + gap);
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={Math.max(1.5, barWidth)}
            height={barHeight}
            rx={Math.min(3, barWidth / 2)}
            fill="currentColor"
            style={{ animationDelay: `${i * 0.045}s` }}
          />
        );
      })}
    </svg>
  );
}
