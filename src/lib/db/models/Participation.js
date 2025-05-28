import mongoose from 'mongoose';

const PaymentSubmissionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true },
  // Support both single screenshot (backward compatibility) and multiple screenshots
  screenshot: { type: String }, // Keep for backward compatibility
  screenshots: [{ type: String }], // New field for multiple screenshots
  submittedAt: { type: Date, default: Date.now },
});

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
    enum: ['Pending', 'Completed', 'Rejected'],
    default: 'Pending',
  },
  paymentDate: { type: Date },
  paymentSubmissions: [PaymentSubmissionSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Add a virtual field to get all screenshots (both single and multiple)
PaymentSubmissionSchema.virtual('allScreenshots').get(function() {
  const screenshots = [];
  if (this.screenshot) {
    screenshots.push(this.screenshot);
  }
  if (this.screenshots && this.screenshots.length > 0) {
    screenshots.push(...this.screenshots);
  }
  return [...new Set(screenshots)]; // Remove duplicates
});

// Ensure virtual fields are serialized
PaymentSubmissionSchema.set('toJSON', { virtuals: true });
PaymentSubmissionSchema.set('toObject', { virtuals: true });

export default mongoose.models.Participation || mongoose.model('Participation', ParticipationSchema);