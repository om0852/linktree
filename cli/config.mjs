import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_FILENAME = '.treeinbiorc.json';

function getConfigPath() {
  // Check local project directory first, then user's home directory
  const localPath = path.join(process.cwd(), CONFIG_FILENAME);
  if (fs.existsSync(localPath)) {
    return localPath;
  }
  return path.join(os.homedir(), CONFIG_FILENAME);
}

export function loadStoredConfig() {
  try {
    const configPath = getConfigPath();
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(raw);
    }
  } catch {
    // Ignore corrupt or unreadable files
  }
  return {};
}

export function saveStoredConfig(updates) {
  try {
    const configPath = getConfigPath();
    const existing = loadStoredConfig();
    const merged = { ...existing, ...updates };
    fs.writeFileSync(configPath, JSON.stringify(merged, null, 2), 'utf8');
    return merged;
  } catch (err) {
    console.error('Failed to save TreeInBio CLI configuration:', err.message);
    return null;
  }
}

export function clearStoredConfig() {
  try {
    const configPath = getConfigPath();
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
    return true;
  } catch {
    return false;
  }
}

export function resolveConfig(overrides = {}) {
  const stored = loadStoredConfig();

  const apiUrl = overrides.apiUrl ||
    process.env.TREEINBIO_API_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    stored.apiUrl ||
    'http://localhost:3000';

  const apiKey = overrides.apiKey ||
    process.env.TREEINBIO_API_KEY ||
    process.env.PLATFORM_API_KEY ||
    stored.apiKey ||
    null;

  const token = overrides.token ||
    process.env.TREEINBIO_TOKEN ||
    stored.token ||
    null;

  const username = overrides.username ||
    process.env.TREEINBIO_USERNAME ||
    stored.username ||
    null;

  return {
    apiUrl: apiUrl.replace(/\/+$/, ''),
    apiKey,
    token,
    username,
  };
}
