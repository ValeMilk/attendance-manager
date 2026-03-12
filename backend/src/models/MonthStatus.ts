import mongoose from 'mongoose';

const monthStatusSchema = new mongoose.Schema({
  month: {
    type: String, // Format: YYYY-MM (e.g., "2026-03")
    required: true,
    unique: true,
    index: true,
  },
  isLocked: {
    type: Boolean,
    default: true, // Default: locked (admin must explicitly unlock)
  },
  unlockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  unlockedAt: {
    type: Date,
    default: null,
  },
  lockedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

export const MonthStatus = mongoose.model('MonthStatus', monthStatusSchema);
