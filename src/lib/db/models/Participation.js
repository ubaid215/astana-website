import mongoose from 'mongoose';

const ParticipationSchema = new mongoose.Schema({
  collectorName: { type: String, required: true },
  whatsappNumber: { type: String, required: true },
  country: { type: String, required: true },
  cowQuality: { 
    type: String, 
    enum: ['Standard', 'Medium', 'Premium'], 
    required: true 
  },
  timeSlot: { type: String },
  day: { type: Number, enum: [1, 2], required: true },
  shares: { type: Number, required: true },
  members: [{ type: String, required: true }],
  totalAmount: { type: Number, required: true },
  slotAssigned: { type: Boolean, default: false },
  slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Participation || mongoose.model('Participation', ParticipationSchema);