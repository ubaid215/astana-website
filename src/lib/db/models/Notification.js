import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true, 
    enum: ['payment', 'slot', 'completion', 'general'] 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  participationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Participation',
    required: true 
  },
  transactionId: { type: String, required: true },
  amount: { type: Number },
  // Support both single screenshot (backward compatibility) and multiple screenshots
  screenshot: { type: String }, // Keep for backward compatibility
  screenshots: [{ type: String }], // New field for multiple screenshots
  message: { type: String },
  read: { type: Boolean, default: false },
  readAt: { type: Date }, // Track when notification was read
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Add a virtual field to get all screenshots (both single and multiple)
notificationSchema.virtual('allScreenshots').get(function() {
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
notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

// Add indexes for better query performance
notificationSchema.index({ read: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });



export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema);