export default function Skeleton({ width = '100%', height = '16px', style = {} }) {
  return (
    <div style={{
      width, height,
      borderRadius: 'var(--radius)',
      background: 'linear-gradient(90deg, var(--surface2) 25%, var(--surface3) 50%, var(--surface2) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.6s infinite',
      ...style,
    }} />
  );
}

export function SkeletonList({ count = 4, height = '64px' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} height={height} style={{ opacity: 1 - i * 0.15 }} />
      ))}
    </div>
  );
}
