import mongoose from 'mongoose';

const NewsletterSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  isSubscribed: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Newsletter || mongoose.model('Newsletter', NewsletterSchema);