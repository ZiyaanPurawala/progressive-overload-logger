const PersonalRecord = require('../models/PersonalRecord');
 
/**
 * Epley 1RM formula: weight × (1 + reps / 30)
 * Accurate for 1–12 reps; returns weight as-is for reps = 1.
 */
const epley1RM = (weight, reps) => {
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
};
 
/**
 * detectAndSavePRs
 * ─────────────────────────────────────────────────────────────────────
 * Called after a WorkoutSession is saved.
 * For each exercise entry in the session, compares the best set metrics
 * against all existing PRs for that user + exercise.
 *
 * Returns: { prs: [ { exerciseId, prType, value, improvement } ] }
 *   — an array of new/broken PR objects to surface in the UI.
 */
const detectAndSavePRs = async (session, userId) => {
  const newPRs = [];
 
  for (const entry of session.exercises) {
    const exerciseId = entry.exercise;
 
    // Only consider working sets (skip warmups)
    const workingSets = entry.sets.filter((s) => !s.isWarmup);
    if (!workingSets.length) continue;
 
    // ── 1. Best weight (any rep count) ──────────────────────────────
    const bestWeight = Math.max(...workingSets.map((s) => s.weight));
    const weightPR = await checkAndUpdatePR({
      userId,
      exerciseId,
      sessionId: session._id,
      date: session.date,
      prType: 'weight',
      value: bestWeight,
      valueField: 'weight',
    });
    if (weightPR) newPRs.push(weightPR);
 
    // ── 2. Best estimated 1RM ────────────────────────────────────────
    const best1RM = Math.max(...workingSets.map((s) => epley1RM(s.weight, s.reps)));
    const orm1PR = await checkAndUpdatePR({
      userId,
      exerciseId,
      sessionId: session._id,
      date: session.date,
      prType: 'estimated1RM',
      value: parseFloat(best1RM.toFixed(2)),
      valueField: 'estimated1RM',
    });
    if (orm1PR) newPRs.push(orm1PR);
 
    // ── 3. Most reps at any weight (volume endurance PR) ────────────
    const bestReps = Math.max(...workingSets.map((s) => s.reps));
    const repsPR = await checkAndUpdatePR({
      userId,
      exerciseId,
      sessionId: session._id,
      date: session.date,
      prType: 'reps',
      value: bestReps,
      valueField: 'reps',
    });
    if (repsPR) newPRs.push(repsPR);
 
    // ── 4. Session volume PR ─────────────────────────────────────────
    const sessionVolume = workingSets.reduce((sum, s) => sum + s.weight * s.reps, 0);
    const volumePR = await checkAndUpdatePR({
      userId,
      exerciseId,
      sessionId: session._id,
      date: session.date,
      prType: 'volume',
      value: parseFloat(sessionVolume.toFixed(2)),
      valueField: 'volume',
    });
    if (volumePR) newPRs.push(volumePR);
 
    // Mark the entry as having a PR (quick flag for list views)
    if (weightPR || orm1PR || repsPR || volumePR) {
      entry.hasPR = true;
      // Mark individual PR sets
      workingSets.forEach((s) => {
        if (s.weight === bestWeight || epley1RM(s.weight, s.reps) >= best1RM) {
          s.isPR = true;
        }
      });
    }
  }
 
  return { prs: newPRs };
};
 
/**
 * checkAndUpdatePR — compare a candidate value against the stored PR.
 * Upserts the PersonalRecord document if the new value is higher.
 * Returns the PR object if it's new/broken, null otherwise.
 */
const checkAndUpdatePR = async ({
  userId,
  exerciseId,
  sessionId,
  date,
  prType,
  value,
  valueField,
}) => {
  const existing = await PersonalRecord.findOne({
    user: userId,
    exercise: exerciseId,
    prType,
  });
 
  const previousBest = existing ? existing[valueField] : null;
 
  // No existing PR, or new value beats it
  if (!existing || value > previousBest) {
    const improvement = previousBest !== null ? parseFloat((value - previousBest).toFixed(2)) : null;
 
    await PersonalRecord.findOneAndUpdate(
      { user: userId, exercise: exerciseId, prType },
      {
        session: sessionId,
        date,
        [valueField]: value,
        previousBest: previousBest ?? 0,
        improvement,
      },
      { upsert: true, new: true }
    );
 
    return { exerciseId, prType, value, previousBest, improvement };
  }
 
  return null;
};
 
/**
 * computeSessionMetrics — call before saving a session.
 * Populates estimated1RM and totalVolume on each exercise entry,
 * and the session-level totalVolume.
 */
const computeSessionMetrics = (session) => {
  let sessionTotalVolume = 0;
 
  session.exercises = session.exercises.map((entry) => {
    const workingSets = entry.sets.filter((s) => !s.isWarmup);
 
    const best1RM = workingSets.length
      ? Math.max(...workingSets.map((s) => epley1RM(s.weight, s.reps)))
      : 0;
 
    const volume = workingSets.reduce((sum, s) => sum + s.weight * s.reps, 0);
 
    sessionTotalVolume += volume;
 
    return {
      ...entry,
      estimated1RM: parseFloat(best1RM.toFixed(2)),
      totalVolume: parseFloat(volume.toFixed(2)),
    };
  });
 
  session.totalVolume = parseFloat(sessionTotalVolume.toFixed(2));
  return session;
};
 
module.exports = { detectAndSavePRs, computeSessionMetrics, epley1RM };