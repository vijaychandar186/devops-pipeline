import { useEffect, useRef, useState } from 'react';
import { ModelCard } from './components/ModelCard';

export interface Model {
  id: string;
  downloads: number | null;
  likes: number | null;
  trendingScore: number | null;
  lastModified: string;
  tags: string[];
}

const PAGE_SIZE   = 24;
const FETCH_LIMIT = 500;

const FILTERS = [
  { value: 'text-generation',              label: 'Text Generation'  },
  { value: 'text-classification',          label: 'Classification'   },
  { value: 'translation',                  label: 'Translation'      },
  { value: 'summarization',                label: 'Summarization'    },
  { value: 'question-answering',           label: 'Q & A'            },
  { value: 'automatic-speech-recognition', label: 'Speech'           },
  { value: 'image-classification',         label: 'Image Class.'     },
  { value: 'fill-mask',                    label: 'Fill-Mask'        },
  { value: 'sentence-similarity',          label: 'Embeddings'       },
  { value: 'token-classification',         label: 'Token Class.'     },
];

const SORTS = [
  { value: 'downloads',    label: 'Downloads'       },
  { value: 'likes',        label: 'Likes'           },
  { value: 'trendingScore',label: 'Trending'        },
  { value: 'lastModified', label: 'Recent'          },
];

export default function App() {
  const [allModels, setAllModels] = useState<Model[]>([]);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [filter, setFilter]       = useState('text-generation');
  const [sort, setSort]           = useState('downloads');
  const [draft, setDraft]         = useState('');
  const [query, setQuery]         = useState('');
  const inputRef                  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setPage(1);
    const qs = new URLSearchParams({ filter, sort, limit: String(FETCH_LIMIT) });
    if (query) qs.set('search', query);
    fetch(`/api/models?${qs}`)
      .then((r) => r.json())
      .then((d) => setAllModels(d.data ?? []))
      .catch(() => setError('Failed to load models'))
      .finally(() => setLoading(false));
  }, [filter, sort, query]);

  const totalPages = Math.max(1, Math.ceil(allModels.length / PAGE_SIZE));
  const visible    = allModels.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const commitSearch = () => setQuery(draft.trim());
  const clearSearch  = () => { setDraft(''); setQuery(''); };

  return (
    <div style={s.container}>

      {/* ── Header ── */}
      <header style={s.head}>
        <h1 style={s.title}>🤗 Model Explorer</h1>
        <div style={s.searchRow}>
          <input
            ref={inputRef}
            style={s.searchInput}
            type="text"
            placeholder="Search models..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && commitSearch()}
          />
          <button style={s.searchBtn} onClick={commitSearch}>Search</button>
          {query && <button style={s.clearBtn} onClick={clearSearch}>Clear</button>}
        </div>
      </header>

      {/* ── Task filter chips ── */}
      <div style={s.filterBar}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            style={{ ...s.chip, ...(filter === f.value ? s.chipActive : {}) }}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Toolbar: count + sort ── */}
      <div style={s.toolbar}>
        <span style={s.count}>
          {loading ? 'Loading...' : `${allModels.length} models`}
          {query && !loading && <span style={s.queryTag}> — "{query}"</span>}
        </span>
        <div style={s.sortRow}>
          <span style={s.sortLabel}>Sort:</span>
          {SORTS.map((o) => (
            <button
              key={o.value}
              style={{ ...s.sortChip, ...(sort === o.value ? s.sortChipActive : {}) }}
              onClick={() => setSort(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Error / empty ── */}
      {error && <p style={s.error}>{error}</p>}
      {!loading && !error && allModels.length === 0 && (
        <p style={s.empty}>No models found{query ? ` for "${query}"` : ''}.</p>
      )}

      {/* ── Grid ── */}
      <div style={s.grid}>
        {visible.map((m) => <ModelCard key={m.id} model={m} />)}
        {loading && Array.from({ length: 12 }).map((_, i) => (
          <div key={i} style={s.skeleton} />
        ))}
      </div>

      {/* ── Pagination ── */}
      {!loading && !error && allModels.length > 0 && (
        <div style={s.pagination}>
          <button
            style={{ ...s.pageBtn, ...(page <= 1 ? s.pageBtnDisabled : {}) }}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </button>
          <span style={s.pageInfo}>Page {page} of {totalPages}</span>
          <button
            style={{ ...s.pageBtn, ...(page >= totalPages ? s.pageBtnDisabled : {}) }}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '20px 16px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#e2e8f0',
    background: '#0f1117',
    minHeight: '100vh',
    boxSizing: 'border-box',
  },
  head: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 10,
  },
  title: { fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: '-0.3px' },
  searchRow: { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' },
  searchInput: {
    background: '#1e2130',
    border: '1px solid #2d3148',
    borderRadius: 8,
    color: '#e2e8f0',
    padding: '7px 12px',
    fontSize: 13,
    width: 'clamp(140px, 30vw, 220px)',
    outline: 'none',
    boxSizing: 'border-box',
  },
  searchBtn: {
    background: '#4f46e5',
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    padding: '7px 14px',
    fontSize: 13,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  clearBtn: {
    background: '#374151',
    border: 'none',
    borderRadius: 8,
    color: '#9ca3af',
    padding: '7px 10px',
    fontSize: 12,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  filterBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  chip: {
    background: '#1e2130',
    border: '1px solid #2d3148',
    borderRadius: 999,
    color: '#94a3b8',
    padding: '5px 13px',
    fontSize: 12,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  chipActive: {
    background: '#4f46e5',
    border: '1px solid #4f46e5',
    color: '#fff',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 8,
    minHeight: 28,
  },
  count:    { fontSize: 13, color: '#64748b' },
  queryTag: { color: '#a5b4fc' },
  sortRow:  { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' },
  sortLabel:{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' },
  sortChip: {
    background: '#1e2130',
    border: '1px solid #2d3148',
    borderRadius: 6,
    color: '#94a3b8',
    padding: '4px 10px',
    fontSize: 12,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  sortChipActive: {
    background: '#1e3a5f',
    border: '1px solid #3b82f6',
    color: '#93c5fd',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: 12,
  },
  skeleton: {
    background: '#1e2130',
    borderRadius: 12,
    height: 160,
    opacity: 0.5,
  },
  error: { textAlign: 'center', padding: 48, color: '#f87171', margin: 0 },
  empty: { textAlign: 'center', padding: 48, color: '#64748b', margin: 0 },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    marginTop: 20,
    paddingBottom: 20,
  },
  pageBtn: {
    background: '#1e2130',
    border: '1px solid #2d3148',
    borderRadius: 8,
    color: '#a5b4fc',
    padding: '8px 20px',
    fontSize: 13,
    cursor: 'pointer',
  },
  pageBtnDisabled: {
    opacity: 0.35,
    cursor: 'default',
  },
  pageInfo: {
    fontSize: 13,
    color: '#64748b',
    whiteSpace: 'nowrap' as const,
  },
};
