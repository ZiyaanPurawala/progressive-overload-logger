const mongoose = require('mongoose');
 
/**
 * SET — a single effort within an exercise.
 * weight is stored in kg always; conversion happens in the frontend.
 * rpe (Rate of Perceived Exertion) 1-10 is optional but enables fatigue analytics.
 */
const setSchema = new mongoose.Schema(
  {
    setNumber: { type: Number, required: true },
    weight: { type: Number, required: true, min: 0 },   // kg
    reps: { type: Number, required: true, min: 1 },
    rpe: { type: Number, min: 1, max: 10 },              // optional
    isWarmup: { type: Boolean, default: false },
    isPR: { type: Boolean, default: false },             // set by PR detection on save
  },
  { _id: false }
);
 
/**
 * EXERCISE ENTRY — one exercise block within a session.
 * Holds all sets + computed fields updated on each save.
 */
const exerciseEntrySchema = new mongoose.Schema(
  {
    exercise: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', required: true },
    sets: [setSchema],
 
    // ── Computed fields (recalculated on every save) ──────────────────
    // Best 1RM estimate this session (Epley: weight × (1 + reps/30))
    estimated1RM: { type: Number },
    // Total volume for this exercise: sum(weight × reps) for working sets
    totalVolume: { type: Number },
    // Whether ANY set in this entry is a PR (convenience flag for quick queries)
    hasPR: { type: Boolean, default: false },
  },
  { _id: false }
);
 
/**
 * WORKOUT SESSION — top-level document.
 * One session = one trip to the gym (or one home workout).
 */
const workoutSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, trim: true },               // e.g. "Push A", "Leg Day"
    date: { type: Date, required: true, default: Date.now },
    exercises: [exerciseEntrySchema],
 
    // ── Session-level metrics ─────────────────────────────────────────
    durationMinutes: { type: Number },
    notes: { type: String, trim: true },
    totalVolume: { type: Number, default: 0 },        // sum of all exercise volumes
    mood: { type: Number, min: 1, max: 5 },           // 1=terrible 5=great
    bodyWeight: { type: Number },                     // snapshot of BW on this day
  },
  { timestamps: true }
);
 
// Index for fast per-user chronological queries
workoutSessionSchema.index({ user: 1, date: -1 });
 
module.exports = mongoose.model('WorkoutSession', workoutSessionSchema);