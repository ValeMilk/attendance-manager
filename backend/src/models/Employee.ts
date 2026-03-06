import mongoose from 'mongoose';

const EmployeeSchema = new mongoose.Schema({
  supervisorId: { type: String, required: true, index: true },
  slug: { type: String, required: true },
  name: { type: String, required: true },
  displayName: { type: String },
}, { timestamps: true });

EmployeeSchema.index({ supervisorId: 1, slug: 1 }, { unique: true });

export const Employee = mongoose.model('Employee', EmployeeSchema);
