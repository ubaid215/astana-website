const mongoose = require('mongoose');

const mergeHistorySchema = new mongoose.Schema({
  sourceSlotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
  destSlotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot' },
  sourceDay: { type: Number, required: true },
  destDay: { type: Number, required: true },
  movedParticipants: [{
    participationId: { type: mongoose.Schema.Types.ObjectId, required: true },
    shares: { type: Number, required: true },
    participantNames: [{ type: String }],
    collectorName: { type: String },
    timeSlot: { type: String }, // Ensure timeSlot is included if needed
    cowQuality: { type: String }, // Ensure cowQuality is included if needed
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Prevent model overwrite by checking if the model exists
module.exports = mongoose.models.MergeHistory || mongoose.model('MergeHistory', mergeHistorySchema);