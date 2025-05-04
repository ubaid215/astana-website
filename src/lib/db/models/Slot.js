import mongoose from 'mongoose';

const SlotSchema = new mongoose.Schema({
  timeSlot: { type: String, required: true },
  day: { type: Number, enum: [1, 2], required: true },
  cowQuality: { type: String, enum: ['Standard', 'Medium', 'Premium'], required: true },
  country: { type: String, required: true },
  participants: [
    {
      participationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Participation' },
      collectorName: { type: String },
      members: [{ type: String }],
      shares: { type: Number },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Slot || mongoose.model('Slot', SlotSchema);
