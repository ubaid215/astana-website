import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ['payment'] },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String, required: true },
  userEmail: { type: String },
  participationId: { type: String, required: true },
  transactionId: { type: String, required: true },
  amount: { type: Number },
  screenshot: { type: String },
  read: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema);