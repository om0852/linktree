import mongoose from 'mongoose';

const CustomDomainSchema = new mongoose.Schema({
  hostname: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
  },
  username: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true,
  },
  verified: {
    type: Boolean,
    default: false,
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'failed'],
    default: 'pending',
  },
  target: {
    type: String,
    default: 'linktree.work.gd',
  },
  expectedIp: {
    type: String,
    default: '159.54.139.45',
  },
  verificationMethod: {
    type: String,
    enum: ['cname', 'a_record', 'both'],
    default: 'cname',
  },
  dnsResolvedCnames: {
    type: [String],
    default: [],
  },
  dnsResolvedIps: {
    type: [String],
    default: [],
  },
  lastDnsCheckError: {
    type: String,
    default: '',
  },
  verifiedAt: {
    type: Date,
    default: null,
  },
  lastCheckedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

export default mongoose.models.CustomDomain || mongoose.model('CustomDomain', CustomDomainSchema);
