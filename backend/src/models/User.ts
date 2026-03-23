import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['admin', 'supervisor', 'expectador'],
      default: 'expectador',
    },
    supervisorId: {
      type: String,
      default: null,
    },
    // Array de funcionários (para supervisores)
    employees: [
      {
        name: String,
        role: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
