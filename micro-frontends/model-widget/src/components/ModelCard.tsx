import type { Model } from '../App';

interface Props { model: Model }

const fmt = (n: number | null | undefined) => {
  if (n == null || isNaN(n)) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
};

const timeAgo = (iso: string) => {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (d < 1)   return 'today';
  if (d < 7)   return `${d}d ago`;
  if (d < 30)  return `${Math.floor(d / 7)}w ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
};

const SKIP = new Set([
  'transformers','safetensors','pytorch','tf','jax','onnx','rust',
  'endpoints_compatible','text-generation-inference','region:us','deploy:azure',
  'has_space',
]);
const cleanTags = (tags: string[]) =>
  tags
    .filter((t) =>
      !SKIP.has(t) &&
      !t.startsWith('arxiv:') &&
      !t.startsWith('dataset:') &&
      !t.startsWith('base_model:') &&
      !t.startsWith('license:') &&
      !t.startsWith('region:') &&
      !t.startsWith('deploy:')
    )
    .slice(0, 4);

export function ModelCard({ model }: Props) {
  const tags   = cleanTags(model.tags ?? []);
  const author = model.id.includes('/') ? model.id.split('/')[0] : null;
  const name   = model.id.includes('/') ? model.id.split('/')[1] : model.id;

  return (
    <div style={s.card}>

      {/* Name + trending badge */}
      <div style={s.header}>
        <div style={s.nameBlock}>
          {author && <div style={s.author}>{author}</div>}
          <div style={s.name} title={model.id}>{name}</div>
        </div>
        {model.trendingScore != null && (
          <span style={s.trendBadge}>Trending {fmt(model.trendingScore)}</span>
        )}
      </div>

      {/* Stats */}
      <div style={s.stats}>
        <div style={s.stat}>
          <div style={s.statLabel}>Downloads</div>
          <div style={s.statValue}>{fmt(model.downloads)}</div>
        </div>
        <div style={s.stat}>
          <div style={s.statLabel}>Likes</div>
          <div style={s.statValue}>{fmt(model.likes)}</div>
        </div>
        <div style={s.stat}>
          <div style={s.statLabel}>Updated</div>
          <div style={s.statValue}>{timeAgo(model.lastModified)}</div>
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div style={s.tags}>
          {tags.map((t) => <span key={t} style={s.tag}>{t}</span>)}
        </div>
      )}

      {/* Link */}
      <a
        href={`https://huggingface.co/${model.id}`}
        target="_blank"
        rel="noopener noreferrer"
        style={s.link}
      >
        View on HuggingFace
      </a>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  card: {
    background: '#1e2130',
    borderRadius: 10,
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    border: '1px solid #2d3148',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  nameBlock: { flex: 1, minWidth: 0 },
  author: { fontSize: 11, color: '#64748b', marginBottom: 1 },
  name: {
    fontWeight: 600,
    fontSize: 14,
    color: '#a5b4fc',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  trendBadge: {
    background: '#1a1035',
    border: '1px solid #7c3aed',
    color: '#c4b5fd',
    fontSize: 10,
    padding: '2px 7px',
    borderRadius: 999,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  stats: { display: 'flex', gap: 16 },
  stat:  { display: 'flex', flexDirection: 'column', gap: 1 },
  statLabel: { fontSize: 10, color: '#475569', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
  statValue: { fontSize: 15, fontWeight: 700, color: '#e2e8f0' },
  tags: { display: 'flex', flexWrap: 'wrap', gap: 4 },
  tag: {
    background: '#0f172a',
    border: '1px solid #1e3a5f',
    borderRadius: 999,
    fontSize: 11,
    padding: '2px 8px',
    color: '#7dd3fc',
  },
  link: {
    fontSize: 12,
    color: '#6366f1',
    textDecoration: 'none',
    marginTop: 2,
  },
};
