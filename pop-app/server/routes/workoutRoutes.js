const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getExercises,
  createSession,
  getSessions,
  deleteSession,
  getRecords,
  getStrengthCurve
} = require('../controllers/workoutController');

router.get('/exercises', protect, getExercises);
router.get('/records', protect, getRecords);

router.get('/sessions', protect, getSessions);
router.post('/sessions', protect, createSession);
router.delete('/sessions/:id', protect, deleteSession);
router.get('/sessions/strength-curve', protect, getStrengthCurve);

module.exports = router;
