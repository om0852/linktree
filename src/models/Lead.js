import mongoose from 'mongoose';

const LeadSchema = new mongoose.Schema({
  creatorUsername: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  fullName: {
    type: String,
    trim: true,
    default: '',
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: '',
    index: true,
  },
  phone: {
    type: String,
    trim: true,
    default: '',
    index: true,
  },
  isWhatsApp: {
    type: Boolean,
    default: false,
  },
  company: {
    type: String,
    trim: true,
    default: '',
  },
  note: {
    type: String,
    trim: true,
    default: '',
  },
  customData: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  source: {
    type: String,
    default: 'bio_form_dialog',
  },
  syncedToGoogleContacts: {
    type: Boolean,
    default: false,
    index: true,
  },
  googleContactId: {
    type: String,
    default: '',
  },
  syncStatus: {
    type: String,
    enum: ['synced', 'pending', 'failed', 'not_configured'],
    default: 'pending',
  },
  syncNote: {
    type: String,
    default: '',
  },
  syncedAt: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'closed', 'archived'],
    default: 'new',
  },
}, { timestamps: true });

if (mongoose.models && mongoose.models.Lead) {
  delete mongoose.models.Lead;
}

export default mongoose.models.Lead || mongoose.model('Lead', LeadSchema);
