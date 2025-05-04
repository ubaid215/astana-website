import mongoose from 'mongoose';

const ParticipationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  collectorName: { type: String, required: true },
  whatsappNumber: { type: String, required: true },
  country: { type: String, required: true },
  cowQuality: { type: String, enum: ['Standard', 'Medium', 'Premium'], required: true },
  timeSlot: { type: String },
  day: { type: Number, enum: [1, 2], required: true },
  shares: { type: Number, required: true },
  members: [{ type: String, required: true }],
  totalAmount: { type: Number, required: true },
  slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot' },
  slotAssigned: { type: Boolean, default: false },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed'],
    default: 'Pending',
  },
  paymentDate: { type: Date },
  transactionId: { type: String },
  screenshot: { type: String }, // URL or path to uploaded screenshot
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Participation || mongoose.model('Participation', ParticipationSchema);