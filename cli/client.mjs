/**
 * TreeInBio Universal SDK & API Client
 * Works in Node.js 18+ (Fetch API) for CLI, MCP Server, and programmatic integrations.
 */
export class TreeInBioClient {
  constructor(config = {}) {
    this.apiUrl = (config.apiUrl || process.env.TREEINBIO_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
    this.apiKey = config.apiKey || process.env.TREEINBIO_API_KEY || null;
    this.token = config.token || process.env.TREEINBIO_TOKEN || null;
    this.username = config.username || process.env.TREEINBIO_USERNAME || null;
  }

  setToken(token) {
    this.token = token;
  }

  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  setUsername(username) {
    this.username = username;
  }

  /**
   * Internal HTTP Request dispatcher
   */
  async request(endpoint, options = {}) {
    const url = `${this.apiUrl}${endpoint}`;
    const headers = {
      'Accept': 'application/json',
      ...options.headers,
    };

    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey;
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    } else if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (this.username) {
      headers['x-target-user'] = this.username;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/csv')) {
      const text = await response.text();
      return { success: response.ok, status: response.status, data: text };
    }

    let payload;
    try {
      payload = await response.json();
    } catch {
      const text = await response.text();
      payload = { success: response.ok, raw: text };
    }

    if (!response.ok) {
      const errorMessage = payload?.error || payload?.message || `HTTP ${response.status}: ${response.statusText}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  }

  // ==========================================
  // AUTHENTICATION
  // ==========================================

  async login({ emailOrUsername, password }) {
    const res = await this.request('/api/auth/login', {
      method: 'POST',
      body: { emailOrUsername, password },
    });
    if (res.token) {
      this.token = res.token;
    }
    if (res.user?.username) {
      this.username = res.user.username;
    }
    return res;
  }

  async register({ email, username, password, name }) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: { email, username, password, name },
    });
  }

  async logout() {
    const res = await this.request('/api/auth/logout', { method: 'POST' });
    this.token = null;
    return res;
  }

  async getMe() {
    return this.request('/api/auth/me', { method: 'GET' });
  }

  // ==========================================
  // PROFILE & WORKSPACES
  // ==========================================

  async getProfile(targetUsername = null) {
    const user = targetUsername || this.username;
    const path = user ? `/api/profile?username=${encodeURIComponent(user)}` : '/api/profile';
    return this.request(path, { method: 'GET' });
  }

  async updateProfile(profileData) {
    return this.request('/api/profile', {
      method: 'POST',
      body: profileData,
    });
  }

  async listWorkspaces() {
    return this.request('/api/profile/workspaces', { method: 'GET' });
  }

  async createWorkspace({ username, name }) {
    return this.request('/api/profile/create-workspace', {
      method: 'POST',
      body: { username, name },
    });
  }

  async switchWorkspace(username) {
    const res = await this.request('/api/profile/switch', {
      method: 'POST',
      body: { username },
    });
    this.username = username;
    return res;
  }

  // ==========================================
  // LINKS MANAGEMENT
  // ==========================================

  async listLinks(targetUsername = null) {
    const res = await this.getProfile(targetUsername);
    const profile = res.profile;
    return {
      success: true,
      username: profile?.username || targetUsername || this.username,
      links: profile?.links || [],
      collections: profile?.collections || [],
    };
  }

  async addLink(linkInput, targetUsername = null) {
    const user = targetUsername || this.username;
    const res = await this.getProfile(user);
    const profile = res.profile;
    if (!profile) throw new Error(`Profile not found for username "${user}"`);

    const existingLinks = profile.links || [];
    const newLink = {
      id: linkInput.id || `l_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: linkInput.title || 'New Link',
      url: linkInput.url || '#',
      type: linkInput.type || 'standard',
      badge: linkInput.badge || '',
      icon: linkInput.icon || 'Globe',
      size: linkInput.size === 'large' ? 'large' : 'small',
      clicks: 0,
      active: linkInput.active !== undefined ? linkInput.active : true,
      disabled: Boolean(linkInput.disabled),
      isArchived: Boolean(linkInput.isArchived),
      subtitle: linkInput.subtitle || '',
      ...linkInput,
    };

    const updatedLinks = [...existingLinks, newLink];
    const updateRes = await this.updateProfile({
      ...profile,
      username: profile.username,
      links: updatedLinks,
    });

    return {
      success: true,
      message: 'Link created successfully',
      link: newLink,
      profile: updateRes.profile,
    };
  }

  async updateLink(linkId, updates, targetUsername = null) {
    const user = targetUsername || this.username;
    const res = await this.getProfile(user);
    const profile = res.profile;
    if (!profile) throw new Error(`Profile not found for username "${user}"`);

    const existingLinks = profile.links || [];
    const index = existingLinks.findIndex((l) => l.id === linkId);
    if (index === -1) {
      throw new Error(`Link with ID "${linkId}" was not found.`);
    }

    existingLinks[index] = { ...existingLinks[index], ...updates };

    const updateRes = await this.updateProfile({
      ...profile,
      username: profile.username,
      links: existingLinks,
    });

    return {
      success: true,
      message: 'Link updated successfully',
      link: existingLinks[index],
      profile: updateRes.profile,
    };
  }

  async deleteLink(linkId, targetUsername = null) {
    const user = targetUsername || this.username;
    const res = await this.getProfile(user);
    const profile = res.profile;
    if (!profile) throw new Error(`Profile not found for username "${user}"`);

    const existingLinks = profile.links || [];
    const filteredLinks = existingLinks.filter((l) => l.id !== linkId);
    if (filteredLinks.length === existingLinks.length) {
      throw new Error(`Link with ID "${linkId}" was not found.`);
    }

    const updateRes = await this.updateProfile({
      ...profile,
      username: profile.username,
      links: filteredLinks,
    });

    return {
      success: true,
      message: `Link "${linkId}" deleted successfully`,
      profile: updateRes.profile,
    };
  }

  async toggleArchiveLink(linkId, targetUsername = null) {
    const user = targetUsername || this.username;
    const res = await this.getProfile(user);
    const profile = res.profile;
    if (!profile) throw new Error(`Profile not found for username "${user}"`);

    const existingLinks = profile.links || [];
    const link = existingLinks.find((l) => l.id === linkId);
    if (!link) throw new Error(`Link with ID "${linkId}" was not found.`);

    link.isArchived = !link.isArchived;

    const updateRes = await this.updateProfile({
      ...profile,
      username: profile.username,
      links: existingLinks,
    });

    return {
      success: true,
      message: `Link "${linkId}" archive status set to ${link.isArchived}`,
      isArchived: link.isArchived,
      profile: updateRes.profile,
    };
  }

  // ==========================================
  // ANALYTICS & TELEMETRY
  // ==========================================

  async getAnalytics(targetUsername = null, range = '30d') {
    const user = targetUsername || this.username;
    if (!user) throw new Error('Username is required for analytics');
    return this.request(`/api/v1/analytics?username=${encodeURIComponent(user)}&range=${encodeURIComponent(range)}`, {
      method: 'GET',
    });
  }

  async exportAnalyticsCsv(targetUsername = null, range = '30d') {
    const user = targetUsername || this.username;
    if (!user) throw new Error('Username is required for analytics export');
    return this.request(`/api/v1/analytics/export?username=${encodeURIComponent(user)}&range=${encodeURIComponent(range)}`, {
      method: 'GET',
    });
  }

  async getSocialProof(targetUsername = null) {
    const user = targetUsername || this.username;
    if (!user) throw new Error('Username is required for social proof');
    return this.request(`/api/v1/social-proof/${encodeURIComponent(user)}`, {
      method: 'GET',
    });
  }

  // ==========================================
  // LEADS & DIGITAL DOWNLOADS
  // ==========================================

  async listLeads(targetUsername = null, status = 'all', query = '') {
    const user = targetUsername || this.username;
    let endpoint = `/api/leads?status=${encodeURIComponent(status)}`;
    if (user) endpoint += `&username=${encodeURIComponent(user)}`;
    if (query) endpoint += `&q=${encodeURIComponent(query)}`;
    return this.request(endpoint, { method: 'GET' });
  }

  async exportLeadsCsv(targetUsername = null) {
    const user = targetUsername || this.username;
    const endpoint = user ? `/api/leads/export?username=${encodeURIComponent(user)}` : '/api/leads/export';
    return this.request(endpoint, { method: 'GET' });
  }

  async syncLeads(targetUsername = null, leadIds = []) {
    const user = targetUsername || this.username;
    return this.request('/api/leads/sync', {
      method: 'POST',
      body: { username: user, leadIds },
    });
  }

  async submitLead(payload) {
    return this.request('/api/leads', {
      method: 'POST',
      body: payload,
    });
  }

  async deleteLead(id, targetUsername = null) {
    const user = targetUsername || this.username;
    let endpoint = `/api/leads?id=${encodeURIComponent(id)}`;
    if (user) endpoint += `&username=${encodeURIComponent(user)}`;
    return this.request(endpoint, { method: 'DELETE' });
  }

  // ==========================================
  // BOOKINGS & SERVICES
  // ==========================================

  async listBookings(targetUsername = null, date = '') {
    const user = targetUsername || this.username;
    let endpoint = '/api/bookings';
    const params = new URLSearchParams();
    if (user) params.set('creator', user);
    if (date) params.set('date', date);
    if (params.toString()) endpoint += `?${params.toString()}`;
    return this.request(endpoint, { method: 'GET' });
  }

  async createBooking(bookingData) {
    return this.request('/api/bookings', {
      method: 'POST',
      body: bookingData,
    });
  }

  async updateBooking(id, updates) {
    return this.request(`/api/bookings/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: updates,
    });
  }

  async cancelBooking(id) {
    return this.request(`/api/bookings/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  // ==========================================
  // CUSTOM DOMAINS
  // ==========================================

  async listDomains(targetUsername = null) {
    const user = targetUsername || this.username;
    const endpoint = user ? `/api/v1/domains?username=${encodeURIComponent(user)}` : '/api/v1/domains';
    return this.request(endpoint, { method: 'GET' });
  }

  async addDomain(hostname, targetUsername = null) {
    const user = targetUsername || this.username;
    return this.request('/api/v1/domains', {
      method: 'POST',
      body: { hostname, username: user },
    });
  }

  async verifyDomain(hostname) {
    return this.request('/api/v1/domains/verify', {
      method: 'POST',
      body: { hostname },
    });
  }

  async deleteDomain(id) {
    return this.request(`/api/v1/domains?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  // ==========================================
  // API KEYS MANAGEMENT
  // ==========================================

  async listApiKeys(targetUsername = null) {
    const user = targetUsername || this.username;
    const endpoint = user ? `/api/v1/api-keys?username=${encodeURIComponent(user)}` : '/api/v1/api-keys';
    return this.request(endpoint, { method: 'GET' });
  }

  async createApiKey(name, permissions = ['*'], targetUsername = null) {
    const user = targetUsername || this.username;
    return this.request('/api/v1/api-keys', {
      method: 'POST',
      body: { name, permissions, username: user },
    });
  }

  async revokeApiKey(id) {
    return this.request(`/api/v1/api-keys?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  // ==========================================
  // CONNECTORS & INTEGRATIONS
  // ==========================================

  async listConnectedAccounts(targetUsername = null) {
    const user = targetUsername || this.username;
    const endpoint = user ? `/api/connectors/accounts?username=${encodeURIComponent(user)}` : '/api/connectors/accounts';
    return this.request(endpoint, { method: 'GET' });
  }

  async listAvailableTools(category = '') {
    const endpoint = category ? `/api/connectors/tools?category=${encodeURIComponent(category)}` : '/api/connectors/tools';
    return this.request(endpoint, { method: 'GET' });
  }

  // ==========================================
  // PRODUCT SCRAPER & MEDIA KIT
  // ==========================================

  async scrapeProduct(url) {
    return this.request('/api/scrape-product', {
      method: 'POST',
      body: { url },
    });
  }

  async getMediaKit(targetUsername = null) {
    const user = targetUsername || this.username;
    if (!user) throw new Error('Username is required for media kit');
    return this.request(`/api/media-kit/${encodeURIComponent(user)}`, {
      method: 'GET',
    });
  }

  async toggleMediaKit(targetUsername, enabled) {
    const user = targetUsername || this.username;
    if (!user) throw new Error('Username is required for media kit toggle');
    return this.request(`/api/media-kit/${encodeURIComponent(user)}`, {
      method: 'PATCH',
      body: { enabled },
    });
  }
}
