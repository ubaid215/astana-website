import mongoose from 'mongoose';

const PriceSchema = new mongoose.Schema({
  standard: { type: Number, required: true, default: 25000 },
  medium: { type: Number, required: true, default: 30000 },
  premium: { type: Number, required: true, default: 35000 },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Price || mongoose.model('Price', PriceSchema);