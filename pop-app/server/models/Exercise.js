const mongoose = require('mongoose');
 
/**
 * Exercise — a named movement pattern.
 * Users can use global exercises (userId = null) or create custom ones.
 * muscleGroup drives filtering and chart grouping in the UI.
 */
const exerciseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    muscleGroup: {
      type: String,
      enum: ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'full body', 'cardio'],
      required: true,
    },
    equipment: {
      type: String,
      enum: ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'kettlebell', 'other'],
      default: 'barbell',
    },
    // null = global/shared exercise; ObjectId = user-created custom exercise
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isBodyweight: { type: Boolean, default: false },
  },
  { timestamps: true }
);
 
// Compound index: exercise names are unique per user (or globally for userId=null)
exerciseSchema.index({ name: 1, userId: 1 }, { unique: true });
 
module.exports = mongoose.model('Exercise', exerciseSchema);