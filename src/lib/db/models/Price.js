import mongoose from 'mongoose';

const PriceSchema = new mongoose.Schema({
  standard: { 
    price: { type: Number, required: true, default: 25000 },
    message: { type: String, default: '' }
  },
  medium: { 
    price: { type: Number, required: true, default: 30000 },
    message: { type: String, default: '' }
  },
  premium: { 
    price: { type: Number, required: true, default: 35000 },
    message: { type: String, default: '' }
  },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Price || mongoose.model('Price', PriceSchema);