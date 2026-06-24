function hashColor(str) {
  // Steel-blue palette - harmonious with the dark/blue theme
  const colors = [
    '#3b82f6', // blue
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#14b8a6', // teal
    '#22c55e', // green
    '#f59e0b', // amber
    '#ec4899', // pink
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function Avatar({ name = '?', size = 32, style = {} }) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const bg = hashColor(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.max(size * 0.36, 9) + 'px',
      fontWeight: 700, flexShrink: 0, userSelect: 'none',
      letterSpacing: '-0.02em',
      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      ...style,
    }}>
      {initials}
    </div>
  );
}
