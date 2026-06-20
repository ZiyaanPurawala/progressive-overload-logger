import { useState, useEffect } from 'react';
import { axios } from '../context/AuthContext';

const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const formatVolume = (v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : Math.round(v || 0);

const moodLabel = { 1: '😓', 2: '😐', 3: '🙂', 4: '😄', 5: '🔥' };

export default function SessionHistory() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    axios.get('/sessions')
      .then(r => setSessions(r.data?.sessions || r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this session? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await axios.delete(`/sessions/${id}`);
      setSessions(s => s.filter(sess => sess._id !== id));
    } catch (e) { alert('Failed to delete session'); }
    finally { setDeleting(null); }
  };

  const toggle = (id) => setExpanded(e => e === id ? null : id);

  if (loading) return (
    <div>
      <div className="page-header"><h1>Workout History</h1></div>
      {[1,2,3,4].map(i => (
        <div key={i} className="card mb-3">
          <div className="skeleton" style={{ height: 16, width: 180, marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 11, width: 120 }} />
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h1>Workout History</h1>
        <p className="text-muted">{sessions.length} session{sessions.length !== 1 ? 's' : ''} logged</p>
      </div>

      {sessions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No sessions yet</h3>
          <p>Your workout history will appear here</p>
        </div>
      ) : (
        sessions.map(session => (
          <div key={session._id} className="card mb-3" style={{ cursor: 'pointer' }}>
            {/* Header row */}
            <div className="flex items-center justify-between" onClick={() => toggle(session._id)}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center gap-2 mb-1">
                  <p style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{session.name || 'Workout'}</p>
                  {session.exercises?.some(e => e.hasPR) && <span className="pr-badge">🏆 PR</span>}
                  {session.mood && <span style={{ fontSize: '1rem' }}>{moodLabel[session.mood]}</span>}
                </div>
                <p className="text-sm text-muted">
                  {formatDate(session.date)} · {session.exercises?.length || 0} exercises · {formatVolume(session.totalVolume)} kg volume
                  {session.durationMinutes ? ` · ${session.durationMinutes} min` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="btn btn-danger btn-sm btn-icon"
                  onClick={e => { e.stopPropagation(); handleDelete(session._id); }}
                  disabled={deleting === session._id}
                  title="Delete session"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                </button>
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  style={{ color: 'var(--text-muted)', transition: 'transform 0.2s', transform: expanded === session._id ? 'rotate(180deg)' : 'rotate(0)' }}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>

            {/* Expanded exercises */}
            {expanded === session._id && (
              <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                {session.notes && (
                  <p className="text-sm text-muted mb-4" style={{ fontStyle: 'italic' }}>"{session.notes}"</p>
                )}
                {session.exercises?.map((entry, ei) => (
                  <div key={ei} style={{ marginBottom: '1rem' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        {entry.exercise?.name || 'Exercise'}
                      </p>
                      {entry.hasPR && <span className="pr-badge">PR</span>}
                      {entry.estimated1RM > 0 && (
                        <span className="text-xs text-muted">· Est. 1RM: {entry.estimated1RM?.toFixed(1)} kg</span>
                      )}
                    </div>
                    <table style={{ width: '100%', fontSize: '0.8125rem', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {['Set','Weight','Reps','RPE','Type'].map(h => (
                            <th key={h} style={{ textAlign: h === 'Set' ? 'left' : 'center', padding: '4px 8px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {entry.sets?.map((set, si) => (
                          <tr key={si} style={{ opacity: set.isWarmup ? 0.6 : 1 }}>
                            <td style={{ padding: '5px 8px', color: 'var(--text-secondary)' }}>{si + 1}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 500 }}>{set.weight} kg</td>
                            <td style={{ padding: '5px 8px', textAlign: 'center' }}>{set.reps}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>{set.rpe || '—'}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                              {set.isPR ? <span className="pr-badge" style={{ fontSize: '0.6rem' }}>PR</span> :
                               set.isWarmup ? <span className="text-xs text-muted">Warmup</span> :
                               <span className="text-xs text-muted">Work</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
