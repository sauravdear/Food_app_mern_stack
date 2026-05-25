import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { bcryptSaltRounds } from '../config/auth.js';

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8 },
    role: {
      type: String,
      enum: ['admin', 'regional_manager', 'store_manager', 'staff'],
      default: 'staff',
    },
    assignedStoreId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', default: null },
    refreshToken: { type: String, default: null },
    passwordResetToken: { type: String, default: null },
    passwordResetExpires: { type: Date, default: null },
    lastLogin: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    preferredLanguage: { type: String, enum: ['en', 'es'], default: 'en' },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, bcryptSaltRounds);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return obj;
};

export default mongoose.model('User', userSchema);
