import mongoose from 'mongoose';

// Log mongoose state for debugging
console.log('[Slot Model] Mongoose state:', {
  isConnected: mongoose.connection.readyState,
  modelsDefined: !!mongoose.models,
});

// Define the Slot schema
const SlotSchema = new mongoose.Schema({
  timeSlot: { type: String, required: true },
  day: { type: Number, enum: [1, 2], required: true },
  cowQuality: { type: String, enum: ['Standard', 'Medium', 'Premium'], required: true },
  country: { type: String, required: true },
  participants: [
    {
      participationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Participation' },
      collectorName: { type: String, required: true },
      participantNames: [{ type: String }], // Use participantNames as per requirements
      shares: { type: Number, required: true },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update updatedAt on save
SlotSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Export the model with a safeguard
const SlotModel = mongoose.models && mongoose.models.Slot 
  ? mongoose.models.Slot 
  : mongoose.model('Slot', SlotSchema);

export default SlotModel;