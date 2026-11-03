import mongoose from 'mongoose';

// Every change an AI assistant makes through MCP: which key, which tool,
// what it asked for, and (for page edits) the page as it was before, so the
// owner can review it and undo it from the AI Assistants page. Kept 90 days.
const McpActivitySchema = new mongoose.Schema({
  accountUsername: { type: String, required: true, lowercase: true, index: true },
  workspace: { type: String, default: '', lowercase: true },
  apiKeyId: { type: String, default: '' },
  apiKeyName: { type: String, default: '' },
  tool: { type: String, required: true },
  args: { type: String, default: '' },
  ok: { type: Boolean, default: true },
  error: { type: String, default: '' },
  before: { type: mongoose.Schema.Types.Mixed, default: null },
  afterUpdatedAt: { type: Date, default: null },
  undoneAt: { type: Date, default: null },
}, { timestamps: true });

McpActivitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
McpActivitySchema.index({ accountUsername: 1, createdAt: -1 });

if (mongoose.models && mongoose.models.McpActivity) {
  delete mongoose.models.McpActivity;
}

export default mongoose.models.McpActivity || mongoose.model('McpActivity', McpActivitySchema);
