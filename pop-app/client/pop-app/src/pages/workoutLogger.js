import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { axios } from '../context/AuthContext';

const emptySet = () => ({ weight: '', reps: '', rpe: '', isWarmup: false });

const ExerciseBlock = ({ entry, index, onRemove, onSetChange, onAddSet, onRemoveSet, onExerciseChange, exercises }) => {
  const { exerciseId, sets } = entry;

  return (
    <div className="exercise-block">
      <div className="exercise-header">
        <div className="flex items-center gap-3" style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            width: 26, height: 26, background: 'var(--accent-dim)', color: 'var(--accent)',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-display)', flexShrink: 0
          }}>{index + 1}</span>
          <select
            className="form-input form-input-sm"
            value={exerciseId}
            onChange={e => onExerciseChange(index, e.target.value)}
            style={{ flex: 1, maxWidth: 280 }}
          >
            <option value="">-- Select exercise --</option>
            {exercises.map(ex => (
              <option key={ex._id} value={ex._id}>{ex.name}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => onRemove(index)} title="Remove exercise">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <table className="sets-table">
        <thead>
          <tr>
            <th style={{ width: 50 }}>Set</th>
            <th>Weight (kg)</th>
            <th>Reps</th>
            <th>RPE</th>
            <th>Warmup</th>
            <th style={{ width: 40 }}></th>
          </tr>
        </thead>
        <tbody>
          {sets.map((set, si) => (
            <tr key={si} className={set.isWarmup ? 'warmup-row' : ''}>
              <td>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div className="set-number">{si + 1}</div>
                </div>
              </td>
              <td>
                <input
                  type="number" min="0" step="0.5"
                  className="form-input form-input-sm input-number"
                  placeholder="0"
                  value={set.weight}
                  onChange={e => onSetChange(index, si, 'weight', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="number" min="1" max="100"
                  className="form-input form-input-sm input-number"
                  placeholder="0"
                  value={set.reps}
                  onChange={e => onSetChange(index, si, 'reps', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="number" min="1" max="10" step="0.5"
                  className="form-input form-input-sm input-number"
                  placeholder="—"
                  value={set.rpe}
                  onChange={e => onSetChange(index, si, 'rpe', e.target.value)}
                />
              </td>
              <td>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <input
                    type="checkbox"
                    checked={set.isWarmup}
                    onChange={e => onSetChange(index, si, 'isWarmup', e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }}
                  />
                </div>
              </td>
              <td>
                <button
                  className="btn btn-ghost btn-sm btn-icon"
                  onClick={() => onRemoveSet(index, si)}
                  disabled={sets.length === 1}
                  title="Remove set"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ padding: '0.625rem 0.75rem', display: 'flex', gap: 8 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => onAddSet(index)}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add set
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => { onAddSet(index, true); }}
          style={{ color: 'var(--text-muted)' }}
        >
          + Warmup set
        </button>
      </div>
    </div>
  );
};

export default function WorkoutLogger() {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [mood, setMood] = useState('');
  const [entries, setEntries] = useState([{ exerciseId: '', sets: [emptySet()] }]);
  const [saving, setSaving] = useState(false);
  const [newPRs, setNewPRs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/exercises').then(r => setExercises(r.data || [])).catch(() => {});
  }, []);

  const addExercise = () => setEntries(e => [...e, { exerciseId: '', sets: [emptySet()] }]);
  const removeExercise = (i) => setEntries(e => e.filter((_, idx) => idx !== i));
  const changeExercise = (i, val) => setEntries(e => e.map((en, idx) => idx === i ? { ...en, exerciseId: val } : en));

  const addSet = (ei, warmup = false) => setEntries(e => e.map((en, idx) =>
    idx === ei ? { ...en, sets: [...en.sets, { ...emptySet(), isWarmup: warmup }] } : en
  ));
  const removeSet = (ei, si) => setEntries(e => e.map((en, idx) =>
    idx === ei ? { ...en, sets: en.sets.filter((_, s) => s !== si) } : en
  ));
  const changeSet = (ei, si, field, val) => setEntries(e => e.map((en, idx) =>
    idx === ei ? { ...en, sets: en.sets.map((s, i) => i === si ? { ...s, [field]: val } : s) } : en
  ));

  const handleSave = async () => {
    const valid = entries.filter(en => en.exerciseId && en.sets.some(s => s.weight && s.reps));
    if (!valid.length) { setError('Add at least one exercise with a completed set.'); return; }
    setError('');
    setSaving(true);

    const payload = {
      name: name || 'Workout',
      date: new Date(),
      notes,
      mood: mood ? Number(mood) : undefined,
      exercises: valid.map(en => ({
        exercise: en.exerciseId,
        sets: en.sets.map((s, i) => ({
          setNumber: i + 1,
          weight: parseFloat(s.weight) || 0,
          reps: parseInt(s.reps) || 0,
          rpe: s.rpe ? parseFloat(s.rpe) : undefined,
          isWarmup: s.isWarmup,
        })).filter(s => s.weight > 0 && s.reps > 0 || s.isWarmup)
      }))
    };

    try {
      const { data } = await axios.post('/sessions', payload);
      if (data.prs?.length) setNewPRs(data.prs);
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save session');
    } finally {
      setSaving(false);
    }
  };

  if (newPRs.length > 0) {
    return (
      <div style={{ maxWidth: 520, margin: '4rem auto', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
        <h1 style={{ marginBottom: '0.5rem' }}>New PRs!</h1>
        <p className="text-muted mb-6">You crushed it today</p>
        <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '2rem' }}>
          {newPRs.map((pr, i) => (
            <div key={i} className="card" style={{ borderColor: 'rgba(200,255,0,0.3)', background: 'rgba(200,255,0,0.05)', textAlign: 'left' }}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="pr-badge mb-2" style={{ display: 'inline-flex', marginBottom: 6 }}>
                    {pr.prType === 'estimated1RM' ? 'New 1RM PR' : `New ${pr.prType} PR`}
                  </span>
                  <p style={{ fontWeight: 600 }}>{pr.exerciseName || 'Exercise'}</p>
                  {pr.improvement > 0 && <p className="text-sm" style={{ color: 'var(--success)' }}>+{pr.improvement?.toFixed(1)} kg improvement</p>}
                </div>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.5rem', color: 'var(--accent)' }}>
                  {pr.value?.toFixed(1)} {pr.prType === 'reps' ? 'reps' : 'kg'}
                </p>
              </div>
            </div>
          ))}
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/')}>Back to dashboard</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 780 }}>
      <div className="page-header">
        <h1>Log Workout</h1>
        <p className="text-muted">Track every set. Let the data show your progress.</p>
      </div>

      {/* Session meta */}
      <div className="card mb-4">
        <div className="grid-2">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Session name</label>
            <input className="form-input" placeholder="e.g. Push A, Leg Day" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Mood (1–5)</label>
            <select className="form-input" value={mood} onChange={e => setMood(e.target.value)}>
              <option value="">Skip</option>
              <option value="1">1 — Rough</option>
              <option value="2">2 — Below average</option>
              <option value="3">3 — Okay</option>
              <option value="4">4 — Good</option>
              <option value="5">5 — Beast mode</option>
            </select>
          </div>
        </div>
        <div className="form-group mt-4" style={{ marginBottom: 0 }}>
          <label className="form-label">Notes (optional)</label>
          <input className="form-input" placeholder="Sleep 7hrs, feeling strong..." value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
      </div>

      {/* Exercises */}
      {entries.map((entry, i) => (
        <ExerciseBlock
          key={i} index={i} entry={entry}
          exercises={exercises}
          onRemove={removeExercise}
          onSetChange={changeSet}
          onAddSet={addSet}
          onRemoveSet={removeSet}
          onExerciseChange={changeExercise}
        />
      ))}

      <button className="btn btn-ghost w-full mb-4" onClick={addExercise} style={{ borderStyle: 'dashed', borderColor: 'var(--border-hover)' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add exercise
      </button>

      {error && (
        <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>
      )}

      <div className="flex gap-3">
        <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save session'}
        </button>
        <button className="btn btn-ghost btn-lg" onClick={() => navigate('/')}>Cancel</button>
      </div>
    </div>
  );
}
