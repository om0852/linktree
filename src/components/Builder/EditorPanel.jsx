'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  User, 
  Palette, 
  Layout, 
  Link as LinkIcon, 
  Layers, 
  Sparkles, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Video, 
  Coffee, 
  Mail, 
  BarChart, 
  Zap, 
  Wand2,
  Globe,
  PhoneCall,
  Users,
  Calendar,
  Clock,
  CalendarCheck2
} from 'lucide-react';
import { PERSONA_TAGLINES } from '../../utils/aiScoring';

const AVAILABLE_ICONS = [
  'Video', 'Star', 'Mail', 'FileText', 'Music', 'ShoppingBag', 
  'Zap', 'Briefcase', 'BookOpen', 'Calendar', 'MessageSquare', 'TrendingUp', 'Ticket', 'Globe'
];

export default function EditorPanel({ 
  profile, 
  onChangeProfile, 
  ctrData, 
  onAutoOptimize, 
  onOpenAIModal,
  onOpenCustomDomain,
  onOpenLeadsManager,
  onOpenBookingsManager
}) {
  const [activeTab, setActiveTab] = useState('links');
  const [isAddingLink, setIsAddingLink] = useState(false);
  
  // New link form state
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newBadge, setNewBadge] = useState('');
  const [newIcon, setNewIcon] = useState('Star');
  const [newSize, setNewSize] = useState('large');

  const updateField = (field, value) => {
    onChangeProfile({
      ...profile,
      [field]: value
    });
  };

  const updateWidget = (widgetKey, value) => {
    onChangeProfile({
      ...profile,
      widgets: {
        ...profile.widgets,
        [widgetKey]: value
      }
    });
  };

  const updateLeadCapture = (key, value) => {
    onChangeProfile({
      ...profile,
      leadCapture: {
        ...(profile.leadCapture || {}),
        [key]: value,
      },
    });
  };

  const updateLeadField = (fieldName, fieldKey, value) => {
    const currentFields = profile.leadCapture?.fields || {};
    const fieldObj = currentFields[fieldName] || {};
    onChangeProfile({
      ...profile,
      leadCapture: {
        ...(profile.leadCapture || {}),
        fields: {
          ...currentFields,
          [fieldName]: {
            ...fieldObj,
            [fieldKey]: value,
          },
        },
      },
    });
  };

  const updateScheduleMeeting = (key, value) => {
    onChangeProfile({
      ...profile,
      scheduleMeeting: {
        ...(profile.scheduleMeeting || {}),
        [key]: value,
      },
    });
  };

  const toggleAvailableDay = (day) => {
    const currentDays = profile.scheduleMeeting?.availableDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const updated = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    updateScheduleMeeting('availableDays', updated);
  };

  const handleAddLink = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newLinkObj = {
      id: `link_${Date.now()}`,
      title: newTitle,
      url: newUrl || '#',
      badge: newBadge.toUpperCase() || '',
      icon: newIcon,
      size: newSize,
      clicks: 0
    };

    onChangeProfile({
      ...profile,
      links: [newLinkObj, ...profile.links]
    });

    setNewTitle('');
    setNewUrl('');
    setNewBadge('');
    setIsAddingLink(false);
  };

  const handleDeleteLink = (id) => {
    onChangeProfile({
      ...profile,
      links: profile.links.filter(l => l.id !== id)
    });
  };

  const handleMoveLink = (index, direction) => {
    const newLinks = [...profile.links];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= newLinks.length) return;
    const temp = newLinks[index];
    newLinks[index] = newLinks[targetIdx];
    newLinks[targetIdx] = temp;
    onChangeProfile({ ...profile, links: newLinks });
  };

  const handleQuickAiBio = () => {
    const suggestions = PERSONA_TAGLINES[profile.niche] || PERSONA_TAGLINES.influencer;
    const randomBio = suggestions[Math.floor(Math.random() * suggestions.length)];
    updateField('bio', randomBio);
  };

  return (
    <div className="flex flex-col h-full bg-[#06140e] overflow-hidden">
      {/* Real-Time ML CTR Intelligence Banner */}
      <div className="tb-ctr-banner">
        <div className="tb-ctr-row">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white">AI Predicted CTR:</span>
                <span className="text-xs font-mono font-bold text-amber-300">{ctrData.score}%</span>
                <span className="tb-ctr-badge-exceptional">
                  {ctrData.rating}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">
                {ctrData.recommendations.length > 0 
                  ? ctrData.recommendations[0] 
                  : '✨ Profile conversion parameters fully optimized!'}
              </p>
            </div>
          </div>
          <button
            onClick={onAutoOptimize}
            className="tb-auto-boost-btn"
            title="Auto-apply optimal layout, badges and conversion widgets"
          >
            <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
            Auto Boost
          </button>
        </div>

        {/* Progress Bar (Emerald to Gold) */}
        <div className="w-full h-1.5 rounded-full bg-slate-900 mt-2.5 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-300 to-amber-400 rounded-full transition-all duration-500"
            style={{ width: `${ctrData.score}%` }}
          />
        </div>
      </div>

      {/* Editor Navigation Tabs */}
      <div className="tb-tabs-container">
        {[
          { id: 'links', label: 'Links', icon: LinkIcon, count: profile.links.length },
          { id: 'design', label: 'Design', icon: Palette },
          { id: 'widgets', label: 'Widgets', icon: Layers },
          { id: 'leads', label: 'Lead Form', icon: PhoneCall },
          { id: 'schedule', label: 'Meetings', icon: Calendar },
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'domains', label: 'Domains', icon: Globe },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'domains' && onOpenCustomDomain) {
                  onOpenCustomDomain();
                } else {
                  setActiveTab(tab.id);
                }
              }}
              className={`tb-tab-btn ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-950 border border-emerald-500/30 text-[9px] font-mono text-emerald-300">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Scrollable Tab Content Area */}
      <div className="tb-editor-body">
        {/* TAB 1: LINKS MANAGER */}
        {activeTab === 'links' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider">Bio-Link Blocks</h3>
                <p className="text-[11px] text-emerald-200/70">Add, reorder, or customize your bento cards</p>
              </div>
              <button
                onClick={() => setIsAddingLink(!isAddingLink)}
                className="tb-btn tb-btn-primary"
              >
                <Plus className="w-3.5 h-3.5" /> Add Link
              </button>
            </div>

            {/* Inline Add Link Form */}
            {isAddingLink && (
              <form onSubmit={handleAddLink} className="p-4 rounded-2xl bg-[#0a1f16] border border-emerald-500/40 space-y-3 shadow-2xl">
                <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add New Card / Link
                </h4>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300">Card Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 🎬 2026 Acting Showreel"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="tb-input mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300">URL / Destination</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      className="tb-input mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300">Badge (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. NEW REEL, TRENDING"
                      value={newBadge}
                      onChange={(e) => setNewBadge(e.target.value)}
                      className="tb-input mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300">Icon</label>
                    <select
                      value={newIcon}
                      onChange={(e) => setNewIcon(e.target.value)}
                      className="tb-input mt-1 cursor-pointer"
                    >
                      {AVAILABLE_ICONS.map((ic) => (
                        <option key={ic} value={ic}>{ic}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300">Bento Card Span</label>
                    <select
                      value={newSize}
                      onChange={(e) => setNewSize(e.target.value)}
                      className="tb-input mt-1 cursor-pointer"
                    >
                      <option value="large">Full Width (2 Columns)</option>
                      <option value="small">Compact (1 Column)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingLink(false)}
                    className="tb-btn tb-btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="tb-btn tb-btn-primary"
                  >
                    Save Card
                  </button>
                </div>
              </form>
            )}

            {/* Links List */}
            <div className="space-y-2">
              {profile.links.map((link, idx) => (
                <div key={link.id} className="tb-link-card">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Reorder Buttons */}
                    <div className="flex flex-col gap-0.5 text-slate-400">
                      <button 
                        onClick={() => handleMoveLink(idx, -1)}
                        disabled={idx === 0}
                        className="hover:text-emerald-300 disabled:opacity-20 cursor-pointer"
                        title="Move Up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleMoveLink(idx, 1)}
                        disabled={idx === profile.links.length - 1}
                        className="hover:text-emerald-300 disabled:opacity-20 cursor-pointer"
                        title="Move Down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">{link.title}</span>
                        {link.badge && (
                          <span className="tb-pill-badge">
                            {link.badge}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span className="truncate max-w-[170px]">{link.url}</span>
                        <span className="text-amber-400 font-mono font-bold">
                          {link.clicks || 0} clicks
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Bento size toggle */}
                    <button
                      onClick={() => {
                        const newLinks = [...profile.links];
                        newLinks[idx] = {
                          ...link,
                          size: link.size === 'large' ? 'small' : 'large'
                        };
                        onChangeProfile({ ...profile, links: newLinks });
                      }}
                      className={`tb-bento-toggle-chip ${link.size === 'large' ? 'active' : ''}`}
                      title="Toggle Bento card size (1 vs 2 columns)"
                    >
                      {link.size === 'large' ? '2-Col' : '1-Col'}
                    </button>

                    {/* Delete Link */}
                    <button
                      onClick={() => handleDeleteLink(link.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                      title="Delete Link"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: DESIGN & LAYOUT */}
        {activeTab === 'design' && (
          <div className="space-y-5">
            {/* Dual-Engine Layout Switcher */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5 text-emerald-400" /> Dual-Engine Layout Mode
              </label>
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#040e09] rounded-xl border border-emerald-500/20">
                <button
                  type="button"
                  onClick={() => updateField('layout', 'bento')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    profile.layout === 'bento'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  Bento Box Grid 2.0
                </button>
                <button
                  type="button"
                  onClick={() => updateField('layout', 'stack')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    profile.layout === 'stack'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Classic Stack
                </button>
              </div>
            </div>

            {/* Curated Theme Swatches */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-400" /> Curated Theme Tokens
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: 'emerald-gold', name: 'Emerald & Gold (Primary)', preview: 'bg-gradient-to-r from-emerald-600 to-amber-500' },
                  { id: 'emerald', name: 'Emerald Forest Glass', preview: 'bg-emerald-950 border border-emerald-500' },
                  { id: 'sunset', name: 'Golden Amber Cyberpunk', preview: 'bg-gradient-to-r from-amber-600 to-yellow-500' },
                  { id: 'dark-glass', name: 'Obsidian Emerald Glass', preview: 'bg-slate-900 border border-emerald-500/40' },
                  { id: 'minimal-light', name: 'Clean White & Mint', preview: 'bg-slate-100 text-slate-900 border border-emerald-300' },
                  { id: 'neon', name: 'Matrix Cyber Green', preview: 'bg-black text-green-400 border border-green-500' },
                ].map((th) => (
                  <button
                    key={th.id}
                    onClick={() => updateField('theme', th.id)}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      profile.theme === th.id
                        ? 'border-amber-400 bg-emerald-950/60 shadow-lg shadow-emerald-500/20'
                        : 'border-emerald-500/20 bg-[#0a1f16] hover:border-emerald-400/50'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold text-white block">{th.name}</span>
                      <span className="text-[10px] text-emerald-300/70">Preset Token</span>
                    </div>
                    <div className={`w-6 h-6 rounded-full border border-white/20 ${th.preview}`}></div>
                  </button>
                ))}
              </div>
            </div>

            {/* Button Shapes */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                Interactive Button & Card Shapes
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'rounded', label: 'Rounded' },
                  { id: 'pill', label: 'Pill' },
                  { id: 'sharp', label: 'Sharp' },
                  { id: 'brutalism', label: 'Brutalist' }
                ].map((sh) => (
                  <button
                    key={sh.id}
                    onClick={() => updateField('buttonShape', sh.id)}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      profile.buttonShape === sh.id
                        ? 'bg-emerald-600 text-white border-amber-400 shadow-md'
                        : 'bg-[#0a1f16] text-slate-300 border-emerald-500/20 hover:border-emerald-400/40'
                    }`}
                  >
                    {sh.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Typography */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                Typography Font Family
              </label>
              <select
                value={profile.font || 'Plus Jakarta Sans'}
                onChange={(e) => updateField('font', e.target.value)}
                className="tb-input cursor-pointer"
              >
                <option value="Plus Jakarta Sans">Plus Jakarta Sans (Modern Studio)</option>
                <option value="Outfit">Outfit (Clean Geometric)</option>
                <option value="Space Grotesk">Space Grotesk (Tech Editorial)</option>
                <option value="Fira Code">Fira Code (Developer / Matrix)</option>
                <option value="Inter">Inter (Classic Standard)</option>
              </select>
            </div>
          </div>
        )}

        {/* TAB 3: WIDGETS & CONVERSION */}
        {activeTab === 'widgets' && (
          <div className="space-y-4">
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Interactive Conversion Widgets</h3>

            {/* 1. Showreel Video Embed */}
            <div className="p-4 rounded-xl bg-[#0a1f16] border border-emerald-500/25 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Hero Showreel Video Embed</span>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(profile.heroVideo)}
                  onChange={(e) => {
                    updateField('heroVideo', e.target.checked ? 'https://www.youtube.com/embed/dQw4w9WgXcQ' : '');
                  }}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>
              {profile.heroVideo && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-300">Embed URL (YouTube/Vimeo)</label>
                  <input
                    type="text"
                    value={profile.heroVideo}
                    onChange={(e) => updateField('heroVideo', e.target.value)}
                    placeholder="https://www.youtube.com/embed/..."
                    className="tb-input mt-1"
                  />
                </div>
              )}
            </div>

            {/* 2. Tip Jar / Fan Support */}
            <div className="p-4 rounded-xl bg-[#0a1f16] border border-emerald-500/25 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">1-Click Tip Jar & Confetti</span>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(profile.widgets?.hasTipJar)}
                  onChange={(e) => updateWidget('hasTipJar', e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>
              {profile.widgets?.hasTipJar && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-300">Tip Jar Header Title</label>
                  <input
                    type="text"
                    value={profile.widgets?.tipJarTitle || ''}
                    onChange={(e) => updateWidget('tipJarTitle', e.target.value)}
                    placeholder="Support My Creative Projects"
                    className="tb-input mt-1"
                  />
                </div>
              )}
            </div>

            {/* 3. Lead Magnet Newsletter */}
            <div className="p-4 rounded-xl bg-[#0a1f16] border border-emerald-500/25 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Newsletter Lead Capture</span>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(profile.widgets?.hasNewsletter)}
                  onChange={(e) => updateWidget('hasNewsletter', e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>
              {profile.widgets?.hasNewsletter && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-300">Newsletter Callout</label>
                  <input
                    type="text"
                    value={profile.widgets?.newsletterTitle || ''}
                    onChange={(e) => updateWidget('newsletterTitle', e.target.value)}
                    placeholder="Get Weekly Growth Strategies"
                    className="tb-input mt-1"
                  />
                </div>
              )}
            </div>

            {/* 4. Live Media Kit Stats Bar */}
            <div className="p-4 rounded-xl bg-[#0a1f16] border border-emerald-500/25 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">Live Media Kit Metrics Bar</span>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(profile.widgets?.mediaKitStats)}
                  onChange={(e) => {
                    updateWidget('mediaKitStats', e.target.checked ? { followers: '0', engagement: '0%', monthlyViews: '0' } : null);
                  }}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>
              {profile.widgets?.mediaKitStats && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-300">Followers</label>
                    <input
                      type="text"
                      value={profile.widgets.mediaKitStats.followers}
                      onChange={(e) => {
                        updateWidget('mediaKitStats', {
                          ...profile.widgets.mediaKitStats,
                          followers: e.target.value
                        });
                      }}
                      className="tb-input mt-1 text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-300">Engagement</label>
                    <input
                      type="text"
                      value={profile.widgets.mediaKitStats.engagement}
                      onChange={(e) => {
                        updateWidget('mediaKitStats', {
                          ...profile.widgets.mediaKitStats,
                          engagement: e.target.value
                        });
                      }}
                      className="tb-input mt-1 text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-300">Monthly Views</label>
                    <input
                      type="text"
                      value={profile.widgets.mediaKitStats.monthlyViews}
                      onChange={(e) => {
                        updateWidget('mediaKitStats', {
                          ...profile.widgets.mediaKitStats,
                          monthlyViews: e.target.value
                        });
                      }}
                      className="tb-input mt-1 text-center"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: PROFILE INFO */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Creator Credentials</h3>

            <div>
              <label className="text-[11px] font-semibold text-slate-300">Full Name</label>
              <input
                type="text"
                value={profile.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="tb-input mt-1"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300">Avatar Image URL</label>
              <input
                type="text"
                value={profile.avatar}
                onChange={(e) => updateField('avatar', e.target.value)}
                className="tb-input mt-1"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-300">Bio / Tagline</label>
                <button
                  type="button"
                  onClick={handleQuickAiBio}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5" /> Quick AI Suggest
                </button>
              </div>
              <textarea
                rows={3}
                value={profile.bio}
                onChange={(e) => updateField('bio', e.target.value)}
                className="tb-input tb-textarea mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300">Location</label>
                <input
                  type="text"
                  value={profile.location || ''}
                  onChange={(e) => updateField('location', e.target.value)}
                  placeholder="e.g. Los Angeles, CA"
                  className="tb-input mt-1"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#0a1f16] border border-emerald-500/25 mt-1">
                <span className="text-xs font-semibold text-slate-200">Verified Badge</span>
                <input
                  type="checkbox"
                  checked={profile.verified}
                  onChange={(e) => updateField('verified', e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Custom Domain & SSL Connection Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#092518] to-[#04140c] border border-emerald-500/40 space-y-2.5 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
                    <Globe className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">Custom Domain & SSL</h4>
                    <p className="text-[10px] text-emerald-200/70">Connect branded domain with automatic Caddy TLS</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenCustomDomain}
                  className="tb-btn tb-btn-primary text-xs py-1.5 px-3"
                >
                  Configure
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: LEAD CAPTURE & CONTACT FORM */}
        {activeTab === 'leads' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-400" /> Contact Dialog & Lead Capture
                </h3>
                <p className="text-[11px] text-emerald-200/70">
                  Collect phone numbers, emails, and sync to Google Contacts / Gmail
                </p>
              </div>

              {onOpenLeadsManager && (
                <button
                  type="button"
                  onClick={onOpenLeadsManager}
                  className="tb-btn tb-btn-ghost text-emerald-300 text-xs py-1 px-2.5 flex items-center gap-1.5"
                  title="View and export captured contact leads"
                >
                  <Users className="w-3.5 h-3.5 text-emerald-400" /> View Leads
                </button>
              )}
            </div>

            {/* Master Toggle */}
            <div className="p-3.5 rounded-2xl bg-[#0a2318] border border-emerald-500/30 flex items-center justify-between shadow-lg">
              <div>
                <h4 className="text-xs font-bold text-white">Enable Contact Form Dialog</h4>
                <p className="text-[10px] text-emerald-200/60">Shows popup dialog or floating connect button on your bio</p>
              </div>
              <input
                type="checkbox"
                checked={profile.leadCapture?.enabled !== false}
                onChange={(e) => updateLeadCapture('enabled', e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            {profile.leadCapture?.enabled !== false && (
              <div className="space-y-3.5">
                {/* Form Titles */}
                <div className="space-y-2 p-3.5 rounded-2xl bg-[#081f14] border border-emerald-500/20">
                  <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">Dialog Text Content</span>
                  
                  <div>
                    <label className="text-[10px] text-slate-300 font-medium">Dialog Title</label>
                    <input
                      type="text"
                      value={profile.leadCapture?.title || "Let's Connect"}
                      onChange={(e) => updateLeadCapture('title', e.target.value)}
                      placeholder="e.g. Let's Connect"
                      className="tb-input mt-1 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-300 font-medium">Subtitle / Prompt</label>
                    <input
                      type="text"
                      value={profile.leadCapture?.subtitle || "Drop your contact info to get in touch directly"}
                      onChange={(e) => updateLeadCapture('subtitle', e.target.value)}
                      placeholder="e.g. Leave your contact info to schedule a call"
                      className="tb-input mt-1 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] text-slate-300 font-medium">CTA Button Text</label>
                      <input
                        type="text"
                        value={profile.leadCapture?.buttonText || "Exchange Contact"}
                        onChange={(e) => updateLeadCapture('buttonText', e.target.value)}
                        placeholder="e.g. Exchange Contact"
                        className="tb-input mt-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-300 font-medium">Trigger Mode</label>
                      <select
                        value={profile.leadCapture?.triggerMode || 'button_only'}
                        onChange={(e) => updateLeadCapture('triggerMode', e.target.value)}
                        className="tb-select-input mt-1 text-xs w-full"
                      >
                        <option value="button_only">On-Click Only (Button & Banner — No Auto Popup)</option>
                        <option value="auto">Auto Popup Dialog on Page Open</option>
                        <option value="both">Both (On-Click Button + Auto Popup)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Form Field Customizer */}
                <div className="p-3.5 rounded-2xl bg-[#081f14] border border-emerald-500/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">Form Fields to Collect</span>
                    <span className="text-[10px] text-slate-400">Enable & set required</span>
                  </div>

                  {/* 1. Full Name */}
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={profile.leadCapture?.fields?.name?.enabled !== false}
                        onChange={(e) => updateLeadField('name', 'enabled', e.target.checked)}
                        className="w-3.5 h-3.5 accent-emerald-500"
                      />
                      <span className="font-semibold text-white">Full Name</span>
                    </div>
                    <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile.leadCapture?.fields?.name?.required !== false}
                        onChange={(e) => updateLeadField('name', 'required', e.target.checked)}
                        className="w-3 h-3 accent-emerald-500"
                      />
                      Required
                    </label>
                  </div>

                  {/* 2. Phone Number */}
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={profile.leadCapture?.fields?.phone?.enabled !== false}
                        onChange={(e) => updateLeadField('phone', 'enabled', e.target.checked)}
                        className="w-3.5 h-3.5 accent-emerald-500"
                      />
                      <span className="font-semibold text-white">Phone Number</span>
                    </div>
                    <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile.leadCapture?.fields?.phone?.required !== false}
                        onChange={(e) => updateLeadField('phone', 'required', e.target.checked)}
                        className="w-3 h-3 accent-emerald-500"
                      />
                      Required
                    </label>
                  </div>

                  {/* 3. Email Address */}
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={profile.leadCapture?.fields?.email?.enabled !== false}
                        onChange={(e) => updateLeadField('email', 'enabled', e.target.checked)}
                        className="w-3.5 h-3.5 accent-emerald-500"
                      />
                      <span className="font-semibold text-white">Email Address</span>
                    </div>
                    <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile.leadCapture?.fields?.email?.required !== false}
                        onChange={(e) => updateLeadField('email', 'required', e.target.checked)}
                        className="w-3 h-3 accent-emerald-500"
                      />
                      Required
                    </label>
                  </div>

                  {/* 4. Company / Brand */}
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Boolean(profile.leadCapture?.fields?.company?.enabled)}
                        onChange={(e) => updateLeadField('company', 'enabled', e.target.checked)}
                        className="w-3.5 h-3.5 accent-emerald-500"
                      />
                      <span className="font-semibold text-white">Company / Organization</span>
                    </div>
                    <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(profile.leadCapture?.fields?.company?.required)}
                        onChange={(e) => updateLeadField('company', 'required', e.target.checked)}
                        className="w-3 h-3 accent-emerald-500"
                      />
                      Required
                    </label>
                  </div>

                  {/* 5. Message / Note */}
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={profile.leadCapture?.fields?.note?.enabled !== false}
                        onChange={(e) => updateLeadField('note', 'enabled', e.target.checked)}
                        className="w-3.5 h-3.5 accent-emerald-500"
                      />
                      <span className="font-semibold text-white">Message / Reason for Contact</span>
                    </div>
                    <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(profile.leadCapture?.fields?.note?.required)}
                        onChange={(e) => updateLeadField('note', 'required', e.target.checked)}
                        className="w-3 h-3 accent-emerald-500"
                      />
                      Required
                    </label>
                  </div>
                </div>

                {/* Google Contacts & Gmail Sync */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#0c281c] to-[#06170f] border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-white">Auto-Sync to Google Contacts / Gmail</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={profile.leadCapture?.syncToGoogleContacts !== false}
                      onChange={(e) => updateLeadCapture('syncToGoogleContacts', e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Automatically adds phone numbers and emails to your connected Google Contacts address book via Composio whenever a visitor submits the form.
                  </p>
                  <Link
                    href="/connectors"
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-300 hover:text-white font-bold underline"
                  >
                    Manage Google Account in Connectors Hub ↗
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Schedule & Meetings Tab */}
        {activeTab === 'schedule' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  1:1 Meeting & Call Scheduler
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Let visitors schedule video calls and consultations directly during your free time.
                </p>
              </div>

              {onOpenBookingsManager && (
                <button
                  type="button"
                  onClick={onOpenBookingsManager}
                  className="px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <CalendarCheck2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>View Bookings</span>
                </button>
              )}
            </div>

            {/* Master Toggle */}
            <div className="p-4 rounded-2xl bg-[#091a26] border border-blue-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Enable Meeting Booking on Profile</h4>
                  <p className="text-[10px] text-blue-200/70">
                    Displays an interactive appointment booking card on your public bio
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={profile.scheduleMeeting?.enabled !== false}
                onChange={(e) => updateScheduleMeeting('enabled', e.target.checked)}
                className="w-5 h-5 accent-blue-500 rounded cursor-pointer"
              />
            </div>

            {profile.scheduleMeeting?.enabled !== false && (
              <div className="space-y-4">
                {/* Meeting Information */}
                <div className="p-3.5 rounded-2xl bg-[#081824] border border-blue-500/20 space-y-3">
                  <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider block">
                    Meeting Details & Copy
                  </span>

                  <div>
                    <label className="text-[10px] text-slate-300 font-medium">Card Title</label>
                    <input
                      type="text"
                      value={profile.scheduleMeeting?.title || "Book a 1:1 Consultation"}
                      onChange={(e) => updateScheduleMeeting('title', e.target.value)}
                      placeholder="e.g. 1:1 Consultation, Brand Deal Call"
                      className="tb-input mt-1 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-300 font-medium">Subtitle / Purpose</label>
                    <textarea
                      rows={2}
                      value={profile.scheduleMeeting?.subtitle || "Pick a free time slot for a private video session or collaboration."}
                      onChange={(e) => updateScheduleMeeting('subtitle', e.target.value)}
                      placeholder="Describe what the call is for..."
                      className="tb-input mt-1 text-xs resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-300 font-medium">Duration</label>
                      <select
                        value={profile.scheduleMeeting?.durationMinutes || 30}
                        onChange={(e) => updateScheduleMeeting('durationMinutes', Number(e.target.value))}
                        className="tb-select-input mt-1 text-xs w-full"
                      >
                        <option value={15}>15 Mins</option>
                        <option value={30}>30 Mins</option>
                        <option value={45}>45 Mins</option>
                        <option value={60}>60 Mins</option>
                        <option value={90}>90 Mins</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-300 font-medium">Price / Fee</label>
                      <input
                        type="text"
                        value={profile.scheduleMeeting?.price || "Free"}
                        onChange={(e) => updateScheduleMeeting('price', e.target.value)}
                        placeholder="Free or $50"
                        className="tb-input mt-1 text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-300 font-medium">Platform</label>
                      <select
                        value={profile.scheduleMeeting?.platform || 'google_meet'}
                        onChange={(e) => updateScheduleMeeting('platform', e.target.value)}
                        className="tb-select-input mt-1 text-xs w-full"
                      >
                        <option value="google_meet">Google Meet</option>
                        <option value="zoom">Zoom Video</option>
                        <option value="phone">Phone Call</option>
                        <option value="custom">Custom Link</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-300 font-medium">Button Text</label>
                    <input
                      type="text"
                      value={profile.scheduleMeeting?.buttonText || "Schedule Call"}
                      onChange={(e) => updateScheduleMeeting('buttonText', e.target.value)}
                      placeholder="e.g. Schedule Call"
                      className="tb-input mt-1 text-xs"
                    />
                  </div>
                </div>

                {/* Free Time & Availability Schedule */}
                <div className="p-3.5 rounded-2xl bg-[#081824] border border-blue-500/20 space-y-3">
                  <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider block">
                    Working Days & Free Hours
                  </span>

                  <div>
                    <label className="text-[10px] text-slate-300 font-medium block mb-1.5">
                      Available Days of the Week
                    </label>
                    <div className="grid grid-cols-7 gap-1">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                        const isAvailable = (profile.scheduleMeeting?.availableDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']).includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleAvailableDay(day)}
                            className={`py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isAvailable
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                                : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-300'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-300 font-medium">Start Hour</label>
                      <input
                        type="time"
                        value={profile.scheduleMeeting?.startHour || '09:00'}
                        onChange={(e) => updateScheduleMeeting('startHour', e.target.value)}
                        className="tb-input mt-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-300 font-medium">End Hour</label>
                      <input
                        type="time"
                        value={profile.scheduleMeeting?.endHour || '17:00'}
                        onChange={(e) => updateScheduleMeeting('endHour', e.target.value)}
                        className="tb-input mt-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-300 font-medium">Slot Interval</label>
                      <select
                        value={profile.scheduleMeeting?.slotIntervalMinutes || 30}
                        onChange={(e) => updateScheduleMeeting('slotIntervalMinutes', Number(e.target.value))}
                        className="tb-select-input mt-1 text-xs w-full"
                      >
                        <option value={15}>Every 15m</option>
                        <option value={30}>Every 30m</option>
                        <option value={45}>Every 45m</option>
                        <option value={60}>Every 60m</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Google Calendar Sync Info Box */}
                <div className="p-3.5 rounded-2xl bg-[#06121b] border border-blue-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-white">Google Calendar Auto-Sync</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={profile.scheduleMeeting?.googleCalendarSync !== false}
                      onChange={(e) => updateScheduleMeeting('googleCalendarSync', e.target.checked)}
                      className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Automatically syncs confirmed meetings into your connected Google Calendar account and auto-blocks booked slots to prevent scheduling conflicts.
                  </p>
                  <Link
                    href="/connectors"
                    className="inline-flex items-center gap-1 text-[11px] text-blue-300 hover:text-white font-bold underline"
                  >
                    Manage Google Calendar in Connectors Hub ↗
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
