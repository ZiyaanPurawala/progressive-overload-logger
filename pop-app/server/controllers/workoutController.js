const Exercise = require('../models/Exercise');
const WorkoutSession = require('../models/WorkoutSession');
const PersonalRecord = require('../models/PersonalRecord');
const { detectAndSavePRs, computeSessionMetrics } = require('../utils/prDetection');

// GET /api/exercises
const getExercises = async (req, res) => {
  try {
    let count = await Exercise.countDocuments();
    if (count === 0) {
      console.log('Seeding default exercises...');
      const defaultExercises = [
        { name: 'Bench Press', muscleGroup: 'chest', equipment: 'barbell' },
        { name: 'Incline Dumbbell Press', muscleGroup: 'chest', equipment: 'dumbbell' },
        { name: 'Pull-ups', muscleGroup: 'back', equipment: 'bodyweight', isBodyweight: true },
        { name: 'Barbell Row', muscleGroup: 'back', equipment: 'barbell' },
        { name: 'Overhead Press', muscleGroup: 'shoulders', equipment: 'barbell' },
        { name: 'Lateral Raise', muscleGroup: 'shoulders', equipment: 'dumbbell' },
        { name: 'Bicep Curl', muscleGroup: 'arms', equipment: 'dumbbell' },
        { name: 'Tricep Pushdown', muscleGroup: 'arms', equipment: 'cable' },
        { name: 'Barbell Squat', muscleGroup: 'legs', equipment: 'barbell' },
        { name: 'Romanian Deadlift', muscleGroup: 'legs', equipment: 'barbell' },
        { name: 'Plank', muscleGroup: 'core', equipment: 'bodyweight', isBodyweight: true }
      ];
      await Exercise.insertMany(defaultExercises);
    }

    const exercises = await Exercise.find({
      $or: [{ userId: null }, { userId: req.user._id }]
    }).sort({ name: 1 });

    res.json(exercises);
  } catch (err) {
    console.error('Error fetching exercises:', err);
    res.status(500).json({ message: 'Failed to retrieve exercises' });
  }
};

// POST /api/sessions
const createSession = async (req, res) => {
  try {
    const workoutSession = new WorkoutSession({
      ...req.body,
      user: req.user._id
    });

    // Compute session volumes and estimated 1RMs
    computeSessionMetrics(workoutSession);

    // Save session
    await workoutSession.save();

    // Detect and save any broken PRs
    const prResults = await detectAndSavePRs(workoutSession, req.user._id);

    // Populate exercise names for frontend celebration screen
    const prsWithNames = [];
    for (const pr of prResults.prs) {
      const ex = await Exercise.findById(pr.exerciseId);
      prsWithNames.push({
        ...pr,
        exerciseName: ex ? ex.name : 'Exercise'
      });
    }

    res.status(201).json({
      ...workoutSession.toObject(),
      prs: prsWithNames
    });
  } catch (err) {
    console.error('Error creating workout session:', err);
    res.status(500).json({ message: 'Failed to save workout session' });
  }
};

// GET /api/sessions
const getSessions = async (req, res) => {
  try {
    const query = WorkoutSession.find({ user: req.user._id })
      .sort({ date: -1 })
      .populate('exercises.exercise');

    if (req.query.limit) {
      query.limit(parseInt(req.query.limit));
    }

    const sessions = await query.exec();
    res.json(sessions);
  } catch (err) {
    console.error('Error fetching workout sessions:', err);
    res.status(500).json({ message: 'Failed to retrieve workout sessions' });
  }
};

// DELETE /api/sessions/:id
const deleteSession = async (req, res) => {
  try {
    const deleted = await WorkoutSession.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Workout session not found' });
    }

    // Clean up PRs associated with this session
    await PersonalRecord.deleteMany({ session: req.params.id });

    res.json({ message: 'Workout session deleted successfully' });
  } catch (err) {
    console.error('Error deleting workout session:', err);
    res.status(500).json({ message: 'Failed to delete workout session' });
  }
};

// GET /api/records
const getRecords = async (req, res) => {
  try {
    const records = await PersonalRecord.find({ user: req.user._id })
      .populate('exercise')
      .sort({ date: -1 });

    res.json(records);
  } catch (err) {
    console.error('Error fetching personal records:', err);
    res.status(500).json({ message: 'Failed to retrieve personal records' });
  }
};

// GET /api/sessions/strength-curve
const getStrengthCurve = async (req, res) => {
  try {
    const { exerciseId } = req.query;
    if (!exerciseId) {
      return res.status(400).json({ message: 'exerciseId query parameter is required' });
    }

    const sessions = await WorkoutSession.find({
      user: req.user._id,
      'exercises.exercise': exerciseId
    }).sort({ date: 1 });

    const chartData = sessions.map(session => {
      const entry = session.exercises.find(e => e.exercise.toString() === exerciseId);
      const workingSets = entry.sets.filter(s => !s.isWarmup);
      const maxWeight = workingSets.length ? Math.max(...workingSets.map(s => s.weight)) : 0;

      return {
        date: session.date,
        estimated1RM: entry.estimated1RM || 0,
        totalVolume: entry.totalVolume || 0,
        maxWeight
      };
    });

    res.json(chartData);
  } catch (err) {
    console.error('Error fetching strength curve data:', err);
    res.status(500).json({ message: 'Failed to retrieve progress data' });
  }
};

module.exports = {
  getExercises,
  createSession,
  getSessions,
  deleteSession,
  getRecords,
  getStrengthCurve
};
