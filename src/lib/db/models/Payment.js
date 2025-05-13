import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  transactionId: { 
    type: String, 
    required: true,
    unique: true
  },
  participationId: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Rejected'],
    default: 'Pending'
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  screenshot: {
    type: String
  }
}, { timestamps: true });

export default mongoose.models.Payment || mongoose.model('Payment', paymentSchema);