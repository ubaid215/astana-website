import mongoose from 'mongoose';

const ShareLimitSchema = new mongoose.Schema({
  standard: { type: Number, required: true, default: 7, min: 0 },
  medium: { type: Number, required: true, default: 7, min: 0 },
  premium: { type: Number, required: true, default: 7, min: 0 },
  participatedShares: {
    standard: { type: Number, default: 0, min: 0 },
    medium: { type: Number, default: 0, min: 0 },
    premium: { type: Number, default: 0, min: 0 }
  },
  remainingShares: {
    standard: { type: Number, default: 7, min: 0 },
    medium: { type: Number, default: 7, min: 0 },
    premium: { type: Number, default: 7, min: 0 }
  },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.ShareLimit || mongoose.model('ShareLimit', ShareLimitSchema);