import { useState, useEffect } from 'react';
import { axios } from '../context/AuthContext';

const prTypeMeta = {
  weight:      { label: 'Max Weight',    cls: 'pr-type-weight', unit: 'kg',   field: 'weight' },
  estimated1RM:{ label: 'Est. 1RM',      cls: 'pr-type-orm',    unit: 'kg',   field: 'estimated1RM' },
  reps:        { label: 'Most Reps',     cls: 'pr-type-reps',   unit: 'reps', field: 'reps' },
  volume:      { label: 'Session Volume',cls: 'pr-type-volume', unit: 'kg',   field: 'volume' },
};

const formatVal = (pr) => {
  const meta = prTypeMeta[pr.prType];
  if (!meta) return '—';
  const val = pr[meta.field];
  if (val === undefined || val === null) return '—';
  return `${typeof val === 'number' ? val.toFixed(pr.prType === 'reps' ? 0 : 1) : val} ${meta.unit}`;
};

const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function PRHallOfFame() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');

  useEffect(() => {
    axios.get('/records')
      .then(r => setRecords(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? records : records.filter(r => r.prType === filter);

  const grouped = filtered.reduce((acc, pr) => {
    const name = pr.exercise?.name || 'Unknown';
    if (!acc[name]) acc[name] = [];
    acc[name].push(pr);
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <h1>PR Hall of Fame</h1>
        <p className="text-muted">Your all-time personal records</p>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-6" style={{ flexWrap: 'wrap' }}>
        {['all', 'weight', 'estimated1RM', 'reps', 'volume'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="btn btn-ghost btn-sm"
            style={filter === f ? { background: 'var(--accent-dim)', color: 'var(--accent)', borderColor: 'rgba(200,255,0,0.3)' } : {}}
          >
            {f === 'all' ? 'All PRs' : prTypeMeta[f]?.label || f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid-3">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="card">
              <div className="skeleton" style={{ height: 18, width: 60, marginBottom: 10 }} />
              <div className="skeleton" style={{ height: 12, width: 120, marginBottom: 10 }} />
              <div className="skeleton" style={{ height: 32, width: 90 }} />
            </div>
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏆</div>
          <h3>No personal records yet</h3>
          <p>Log your first workout and the PR engine will automatically detect and save your bests</p>
        </div>
      ) : (
        Object.entries(grouped).map(([exerciseName, prs]) => (
          <div key={exerciseName} style={{ marginBottom: '2rem' }}>
            <p className="section-title">{exerciseName}</p>
            <div className="grid-3">
              {prs.map((pr, i) => {
                const meta = prTypeMeta[pr.prType];
                return (
                  <div key={i} className="pr-card">
                    <span className={`pr-type-pill ${meta?.cls}`}>{meta?.label}</span>
                    <p className="pr-value">{formatVal(pr)}</p>
                    <p className="pr-exercise">{formatDate(pr.date)}</p>
                    {pr.improvement > 0 && (
                      <p className="pr-improvement">
                        ↑ +{pr.improvement.toFixed(pr.prType === 'reps' ? 0 : 1)} {meta?.unit} improvement
                      </p>
                    )}
                    {pr.previousBest > 0 && (
                      <p className="text-xs text-muted" style={{ marginTop: 4 }}>
                        Previous: {pr.previousBest.toFixed(pr.prType === 'reps' ? 0 : 1)} {meta?.unit}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
