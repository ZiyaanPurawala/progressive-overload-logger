const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
 
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    bodyWeight: { type: Number }, // kg, optional for bodyweight exercise % tracking
    unitPreference: { type: String, enum: ['kg', 'lbs'], default: 'kg' },
  },
  { timestamps: true }
);
 
// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});
 
// Compare plain password to hashed
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
 
module.exports = mongoose.model('User', userSchema);