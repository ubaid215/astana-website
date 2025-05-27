import mongoose from 'mongoose';

// Log mongoose state for debugging
console.log('[Slot Model] Mongoose state:', {
  isConnected: mongoose.connection.readyState,
  modelsDefined: !!mongoose.models,
});

// Clear cached Slot model to prevent using old schema
if (mongoose.models.Slot) {
  delete mongoose.models.Slot;
}

// Define the Slot schema
const SlotSchema = new mongoose.Schema({
  timeSlot: { type: String, required: true },
  day: { type: Number, enum: [1, 2], required: true },
  cowQuality: { type: String, enum: ['Standard', 'Medium', 'Premium'], required: true },
  participants: [
    {
      participationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Participation', required: true },
      collectorName: { type: String, required: true },
      participantNames: [{ type: String }],
      shares: { type: Number, required: true, min: 1 },
    },
  ],
  completed: { type: Boolean, default: false },
  mergeMetadata: [
    {
      participationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Participation' },
      shares: { type: Number, required: true, min: 1 },
      participantNames: [{ type: String }],
      collectorName: { type: String, required: true },
      originalTimeSlot: { type: String, required: true },
      originalDay: { type: Number, enum: [1, 2], required: true },
      sourceSlotId: { type: mongoose.Schema.Types.ObjectId, required: true },
    },
  ],
}, { timestamps: true });

// Update updatedAt on save
SlotSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Export the model
const SlotModel = mongoose.model('Slot', SlotSchema);

export default SlotModel;