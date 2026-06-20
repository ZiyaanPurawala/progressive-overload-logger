const jwt = require('jsonwebtoken');
const User = require('../models/User');
 
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
 
// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, unitPreference } = req.body;
 
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });
 
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already in use' });
 
    const user = await User.create({ name, email, password, unitPreference });
 
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      unitPreference: user.unitPreference,
      token: generateToken(user._id),
    });
  } catch (err) {
  console.error("REGISTER ERROR:");
  console.error(err);

  res.status(500).json({
    message: err.message,
    stack: err.stack
  });
}
};
 
// POST /api/auth/login
const login = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    const { email, password } = req.body;
    const user = await User.findOne({ email });
 
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });
 
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      unitPreference: user.unitPreference,
      token: generateToken(user._id),
    });
  } catch (err) {
  console.error("REGISTER ERROR:", err);
  res.status(500).json({
    message: err.message,
    stack: err.stack
  });
}
};
 
// GET /api/auth/me
const getMe = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json(user);
};
 
module.exports = { register, login, getMe };