import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'attendance_update',
      'justification_create',
      'justification_update',
      'justification_delete',
      'period_unlock',
      'period_lock',
    ],
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  userName: {
    type: String,
    default: '',
  },
  userRole: {
    type: String,
    default: '',
  },
  // What was affected
  targetType: {
    type: String,
    enum: ['attendance', 'justification', 'period'],
    required: true,
  },
  // Human-readable description
  description: {
    type: String,
    default: '',
  },
  // Contextual details (employeeId, day, month, etc.)
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, { timestamps: true });

// Index for querying logs by date range
auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
