const mongoose = require('mongoose');
 
/**
 * PersonalRecord — immutable record of a PR moment.
 * Created automatically by PR detection logic; never edited manually.
 *
 * prType:
 *  - 'weight'    — heaviest weight for any rep count (e.g. 100kg × 3)
 *  - 'reps'      — most reps at a given weight (e.g. 80kg × 12)
 *  - 'estimated1RM' — highest Epley 1RM estimate ever
 *  - 'volume'    — most total volume in a single session for this exercise
 */
const personalRecordSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    exercise: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', required: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkoutSession', required: true },
    date: { type: Date, required: true },
 
    prType: {
      type: String,
      enum: ['weight', 'reps', 'estimated1RM', 'volume'],
      required: true,
    },
 
    // The actual values that set the PR
    weight: { type: Number },       // kg
    reps: { type: Number },
    estimated1RM: { type: Number }, // Epley value
    volume: { type: Number },
 
    // Previous best (for "improved by X" display)
    previousBest: { type: Number },
    improvement: { type: Number },  // absolute improvement (new - previous)
  },
  { timestamps: true }
);
 
// One PR record per user + exercise + prType (we overwrite on new PRs)
personalRecordSchema.index({ user: 1, exercise: 1, prType: 1 });
 
module.exports = mongoose.model('PersonalRecord', personalRecordSchema);