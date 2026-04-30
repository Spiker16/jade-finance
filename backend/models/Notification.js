import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['budget_warning', 'goal_success', 'reminder'], required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Si el modelo ya existe, úsalo. Si no, créalo.
export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema);