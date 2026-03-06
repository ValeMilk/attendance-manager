import mongoose from 'mongoose';

const justificationSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, index: true },
  day: { type: String, required: true, index: true },
  text: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

export const Justification = mongoose.model('Justification', justificationSchema);
