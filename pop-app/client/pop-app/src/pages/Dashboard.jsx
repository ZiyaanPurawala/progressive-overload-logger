import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, axios } from '../context/AuthContext';

const StatCard = ({ label, value, sub, accent }) => (
  <div className={`stat-card${accent ? ' stat-card-accent' : ''}`}>
    <p className="stat-label">{label}</p>
    <p className="stat-value">{value}</p>
    {sub && <p className="stat-sub">{sub}</p>}
  </div>
);

const SkeletonCard = () => (
  <div className="stat-card">
    <div className="skeleton" style={{ height: 12, width: 80, marginBottom: 10 }} />
    <div className="skeleton" style={{ height: 36, width: 100 }} />
  </div>
);

const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const formatVolume = (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : Math.round(v);

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [records, setRecords]   = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, rRes] = await Promise.all([
          axios.get('/sessions?limit=5'),
          axios.get('/records'),
        ]);
        setSessions(sRes.data.sessions || sRes.data || []);
        setRecords(rRes.data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const totalSessions = sessions.length;
  const totalVolume = sessions.reduce((s, sess) => s + (sess.totalVolume || 0), 0);
  const uniqueExercises = [...new Set(sessions.flatMap(s => s.exercises?.map(e => e.exercise?.name || '') || []))].length;
  const prCount = records.length;

  const prTypeMeta = { weight: 'Weight PR', estimated1RM: '1RM PR', reps: 'Reps PR', volume: 'Volume PR' };
  const prTypeClass = { weight: 'pr-type-weight', estimated1RM: 'pr-type-orm', reps: 'pr-type-reps', volume: 'pr-type-volume' };

  return (
    <div>
      <div className="page-header">
        <h1>Hey, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-muted" style={{ marginTop: 4 }}>Here's your training overview</p>
      </div>

      {/* ── Stats ── */}
      <div className="grid-4 mb-6">
        {loading ? (
          [1,2,3,4].map(i => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard label="Sessions logged" value={totalSessions} sub="Recent 5 shown" />
            <StatCard label="Total volume" value={`${formatVolume(totalVolume)} kg`} sub="Across all sessions" />
            <StatCard label="Exercises tracked" value={uniqueExercises} sub="Unique movements" />
            <StatCard label="Personal records" value={prCount} sub="All time" accent />
          </>
        )}
      </div>

      <div className="grid-2">
        {/* ── Recent Sessions ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="section-title">Recent workouts</p>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/history')}>View all</button>
          </div>

          {loading ? (
            [1,2,3].map(i => (
              <div key={i} className="card card-sm mb-2">
                <div className="skeleton" style={{ height: 14, width: 120, marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 11, width: 80 }} />
              </div>
            ))
          ) : sessions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏋️</div>
              <h3>No workouts yet</h3>
              <p>Log your first session to get started</p>
              <button className="btn btn-primary mt-4" onClick={() => navigate('/log')}>Log workout</button>
            </div>
          ) : (
            sessions.map(session => (
              <div key={session._id} className="card card-sm mb-2" style={{ cursor: 'pointer' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: 2 }}>
                      {session.name || 'Workout'}
                    </p>
                    <p className="text-sm text-muted">
                      {formatDate(session.date)} · {session.exercises?.length || 0} exercises · {formatVolume(session.totalVolume || 0)} kg
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 120 }}>
                    {session.exercises?.some(e => e.hasPR) && (
                      <span className="pr-badge">🏆 PR</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Top PRs ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="section-title">Latest PRs</p>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/records')}>All records</button>
          </div>

          {loading ? (
            [1,2,3].map(i => (
              <div key={i} className="card card-sm mb-2">
                <div className="skeleton" style={{ height: 12, width: 60, marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 22, width: 100 }} />
              </div>
            ))
          ) : records.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">⭐</div>
              <h3>No PRs yet</h3>
              <p>Break a record on your next lift</p>
            </div>
          ) : (
            records.slice(0, 4).map((pr, i) => (
              <div key={i} className="pr-card mb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`pr-type-pill ${prTypeClass[pr.prType]}`}>
                      {prTypeMeta[pr.prType]}
                    </span>
                    <p className="pr-exercise">{pr.exercise?.name || 'Exercise'}</p>
                    <p className="pr-value">
                      {pr.prType === 'reps' ? `${pr.reps} reps` :
                       pr.prType === 'volume' ? `${Math.round(pr.volume)} kg` :
                       `${pr.weight || pr.estimated1RM} kg`}
                    </p>
                  </div>
                  {pr.improvement > 0 && (
                    <p className="pr-improvement">+{pr.improvement?.toFixed(1)} kg</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Quick Log CTA ── */}
      {!loading && sessions.length > 0 && (
        <div className="card mt-4" style={{ borderColor: 'rgba(200,255,0,0.15)', background: 'rgba(200,255,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 2 }}>Ready to train?</p>
            <p className="text-sm text-muted">Start logging your next session and beat your PRs.</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/log')} style={{ flexShrink: 0 }}>
            Start workout
          </button>
        </div>
      )}
    </div>
  );
}
