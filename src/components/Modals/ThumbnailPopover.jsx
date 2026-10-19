'use client';

import React, { useState } from 'react';
import {
  X,
  Upload,
  Sparkles,
  Search,
  Check,
  Globe,
  Video,
  Music,
  BookOpen,
  Mail,
  ShoppingBag,
  Heart,
  Star,
  MessageCircle,
  Camera,
  Tv,
  Send,
  Code2,
  Briefcase,
  Smile,
  ImageIcon,
  Ban,
  EyeOff,
  Palette,
  Bot,
  Film,
  Loader2,
  ExternalLink,
} from 'lucide-react';

const ICON_LIBRARY = [
  { id: 'globe', label: 'Globe', icon: Globe },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'book', label: 'Book', icon: BookOpen },
  { id: 'mail', label: 'Email', icon: Mail },
  { id: 'shop', label: 'Shop', icon: ShoppingBag },
  { id: 'heart', label: 'Heart', icon: Heart },
  { id: 'star', label: 'Star', icon: Star },
  { id: 'sparkles', label: 'Sparkles', icon: Sparkles },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'camera', label: 'Camera', icon: Camera },
  { id: 'tv', label: 'Screen', icon: Tv },
  { id: 'send', label: 'Send', icon: Send },
  { id: 'code', label: 'Code', icon: Code2 },
  { id: 'work', label: 'Work', icon: Briefcase },
];

const POPULAR_EMOJIS = ['🔥', '✨', '⚡', '🚀', '💖', '💡', '🎵', '📸', '📚', '💼', '🛒', '🎙️', '🎮', '🌟', '🎯', '🥑'];

const GIPHY_PRESETS = [
  { id: 'g1', title: 'Sparkles Star', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=150&auto=format&fit=crop&q=80' },
  { id: 'g2', title: 'Fire Flame', url: 'https://images.unsplash.com/photo-1527489377706-5bf97e608852?w=150&auto=format&fit=crop&q=80' },
  { id: 'g3', title: 'Rocket Blast', url: 'https://images.unsplash.com/photo-1517976487541-032906b3a31c?w=150&auto=format&fit=crop&q=80' },
  { id: 'g4', title: 'Neon Disco', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80' },
  { id: 'g5', title: 'Morning Coffee', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=150&auto=format&fit=crop&q=80' },
  { id: 'g6', title: 'Creator Merch', url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=150&auto=format&fit=crop&q=80' },
];

export default function ThumbnailPopover({
  isOpen,
  onClose,
  link,
  onUpdateThumbnail,
}) {
  const [activeTab, setActiveTab] = useState(link?.thumbnailType || (link?.thumbnail ? 'image' : 'none'));
  const [imageSource, setImageSource] = useState('upload'); // 'upload' | 'canva' | 'giphy' | 'ai'
  const [iconSearch, setIconSearch] = useState('');
  const [giphySearch, setGiphySearch] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState(link?.thumbnail || '');
  const [selectedIcon, setSelectedIcon] = useState(link?.thumbnailIcon || '');
  const [selectedEmoji, setSelectedEmoji] = useState(link?.thumbnail && !link?.thumbnail.startsWith('http') && !link?.thumbnail.startsWith('data:') ? link.thumbnail : '');
  const [isUploading, setIsUploading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  if (!isOpen || !link) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl === 'string') {
        setImageUrlInput(dataUrl);
        onUpdateThumbnail(link.id, {
          thumbnail: dataUrl,
          thumbnailType: 'image',
          thumbnailIcon: '',
        });
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (!imageUrlInput.trim()) return;
    onUpdateThumbnail(link.id, {
      thumbnail: imageUrlInput.trim(),
      thumbnailType: 'image',
      thumbnailIcon: '',
    });
    onClose();
  };

  const handleSelectPresetImage = (url) => {
    setImageUrlInput(url);
    onUpdateThumbnail(link.id, {
      thumbnail: url,
      thumbnailType: 'image',
      thumbnailIcon: '',
    });
    onClose();
  };

  const handleGenerateAi = () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingAi(true);
    setTimeout(() => {
      // Deterministic SVG AI avatar generator based on prompt
      const colors = ['#10b981', '#6366f1', '#ec4899', '#f59e0b', '#3b82f6'];
      const bg = colors[Math.abs(aiPrompt.length) % colors.length];
      const letter = aiPrompt.trim().charAt(0).toUpperCase();
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${bg}"/><stop offset="100%" stop-color="#0f172a"/></linearGradient></defs><rect width="100" height="100" rx="28" fill="url(#g)"/><text x="50" y="58" font-family="sans-serif" font-weight="900" font-size="36" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${letter}</text></svg>`;
      const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
      setImageUrlInput(dataUri);
      onUpdateThumbnail(link.id, {
        thumbnail: dataUri,
        thumbnailType: 'image',
        thumbnailIcon: '',
      });
      setIsGeneratingAi(false);
      onClose();
    }, 450);
  };

  const handleSelectIcon = (iconId) => {
    setSelectedIcon(iconId);
    setSelectedEmoji('');
    onUpdateThumbnail(link.id, {
      thumbnail: '',
      thumbnailType: 'icon',
      thumbnailIcon: iconId,
    });
    onClose();
  };

  const handleSelectEmoji = (emoji) => {
    setSelectedEmoji(emoji);
    setSelectedIcon('');
    onUpdateThumbnail(link.id, {
      thumbnail: emoji,
      thumbnailType: 'icon',
      thumbnailIcon: emoji,
    });
    onClose();
  };

  const handleRemove = () => {
    setActiveTab('none');
    setImageUrlInput('');
    setSelectedIcon('');
    setSelectedEmoji('');
    onUpdateThumbnail(link.id, {
      thumbnail: '',
      thumbnailType: 'none',
      thumbnailIcon: '',
    });
    onClose();
  };

  const filteredIcons = ICON_LIBRARY.filter((item) =>
    item.label.toLowerCase().includes(iconSearch.toLowerCase())
  );

  const filteredGifs = GIPHY_PRESETS.filter((item) =>
    item.title.toLowerCase().includes(giphySearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800">
          <div>
            <h3 className="text-base font-semibold text-white">Add Thumbnail</h3>
            <p className="text-xs text-stone-400 truncate max-w-[280px]">
              {link.title || 'Untitled link'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Tab Segmented Control */}
        <div className="p-4 border-b border-stone-800 bg-stone-950/40">
          <div className="grid grid-cols-3 gap-1 p-1 bg-stone-800/80 rounded-xl border border-stone-700/50">
            <button
              onClick={() => setActiveTab('image')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-lg transition ${
                activeTab === 'image'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Image
            </button>
            <button
              onClick={() => setActiveTab('icon')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-lg transition ${
                activeTab === 'icon'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Smile className="w-3.5 h-3.5" />
              Icon
            </button>
            <button
              onClick={() => setActiveTab('none')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-lg transition ${
                activeTab === 'none'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <EyeOff className="w-3.5 h-3.5" />
              None
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-5 max-h-[460px] overflow-y-auto space-y-4">
          {/* TAB 1: IMAGE */}
          {activeTab === 'image' && (
            <div className="space-y-4">
              {/* 4 Square Source Action Cards */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setImageSource('upload')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                    imageSource === 'upload'
                      ? 'bg-emerald-600/20 border-emerald-500 text-white'
                      : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:text-white hover:border-stone-700'
                  }`}
                >
                  <Upload className="w-5 h-5 mb-1 text-emerald-400" />
                  <span className="text-[11px] font-semibold">Upload</span>
                </button>

                <button
                  type="button"
                  onClick={() => setImageSource('canva')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                    imageSource === 'canva'
                      ? 'bg-emerald-600/20 border-emerald-500 text-white'
                      : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:text-white hover:border-stone-700'
                  }`}
                >
                  <Palette className="w-5 h-5 mb-1 text-sky-400" />
                  <span className="text-[11px] font-semibold">Canva</span>
                </button>

                <button
                  type="button"
                  onClick={() => setImageSource('giphy')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                    imageSource === 'giphy'
                      ? 'bg-emerald-600/20 border-emerald-500 text-white'
                      : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:text-white hover:border-stone-700'
                  }`}
                >
                  <Film className="w-5 h-5 mb-1 text-purple-400" />
                  <span className="text-[11px] font-semibold">GIPHY</span>
                </button>

                <button
                  type="button"
                  onClick={() => setImageSource('ai')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                    imageSource === 'ai'
                      ? 'bg-emerald-600/20 border-emerald-500 text-white'
                      : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:text-white hover:border-stone-700'
                  }`}
                >
                  <Bot className="w-5 h-5 mb-1 text-amber-400" />
                  <span className="text-[11px] font-semibold">AI Icon</span>
                </button>
              </div>

              {/* Source View 1: Upload */}
              {imageSource === 'upload' && (
                <div className="space-y-3">
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-stone-700 hover:border-emerald-500 rounded-xl bg-stone-950/50 hover:bg-stone-950 cursor-pointer transition group">
                    <Upload className="w-7 h-7 text-stone-400 group-hover:text-emerald-400 mb-2 transition" />
                    <span className="text-xs font-medium text-stone-200">
                      {isUploading ? 'Processing...' : 'Upload an image from device'}
                    </span>
                    <span className="text-[10px] text-stone-500 mt-1">PNG, JPG, GIF, WebP</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <div>
                    <label className="block text-[11px] font-medium text-stone-400 mb-1">
                      Or Paste Image URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://example.com/cover.jpg"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        onClick={handleApplyUrl}
                        className="px-3 py-2 bg-stone-800 hover:bg-emerald-600 text-white rounded-xl text-xs font-medium transition"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Source View 2: Canva */}
              {imageSource === 'canva' && (
                <div className="p-4 bg-stone-950/60 rounded-xl border border-stone-800 text-center space-y-3">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Canva Design Studio</h4>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      Create a custom 1:1 square sticker or block logo in Canva.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.open('https://canva.com/create/logos/', '_blank', 'noopener,noreferrer');
                      }
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-medium transition shadow"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Canva Studio
                  </button>
                </div>
              )}

              {/* Source View 3: GIPHY */}
              {imageSource === 'giphy' && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search GIPHY stickers & animations..."
                      value={giphySearch}
                      onChange={(e) => setGiphySearch(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {filteredGifs.map((gif) => (
                      <button
                        key={gif.id}
                        type="button"
                        onClick={() => handleSelectPresetImage(gif.url)}
                        className="group relative rounded-xl overflow-hidden border border-stone-800 hover:border-emerald-500 transition aspect-square"
                      >
                        <img
                          src={gif.url}
                          alt={gif.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Source View 4: AI Prompt Generator */}
              {imageSource === 'ai' && (
                <div className="space-y-3 p-3 bg-stone-950/60 rounded-xl border border-stone-800">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                      AI Icon Generator Prompt
                    </label>
                    <p className="text-[10px] text-stone-500 mb-2">
                      Describe the visual icon (e.g. &quot;Holographic neon sneaker&quot; or &quot;Cyberpunk cassette&quot;)
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Vintage cassette tape, Golden microphone..."
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        className="flex-1 bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateAi}
                        disabled={isGeneratingAi || !aiPrompt.trim()}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-medium transition flex items-center gap-1.5"
                      >
                        {isGeneratingAi ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            Generate
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Current Preview */}
              {link.thumbnail && link.thumbnailType === 'image' && (
                <div className="flex items-center gap-3 p-3 bg-stone-950/80 rounded-xl border border-stone-800">
                  <img
                    src={link.thumbnail}
                    alt="Current thumbnail"
                    className="w-12 h-12 object-cover rounded-lg border border-stone-700"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">Active Thumbnail</p>
                    <p className="text-[11px] text-stone-500">Rendered on block left side</p>
                  </div>
                  <button
                    onClick={handleRemove}
                    className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1 rounded hover:bg-rose-950/30 transition"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ICON & EMOJI */}
          {activeTab === 'icon' && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search vector icons..."
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Vector Icons Grid */}
              <div>
                <p className="text-[11px] uppercase tracking-wider font-semibold text-stone-500 mb-2">
                  Vector Icons
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {filteredIcons.map((item) => {
                    const IconComp = item.icon;
                    const isSelected = selectedIcon === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectIcon(item.id)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition ${
                          isSelected
                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                            : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:text-white hover:border-stone-700'
                        }`}
                        title={item.label}
                      >
                        <IconComp className="w-5 h-5 mb-1" />
                        <span className="text-[10px] truncate max-w-full">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Popular Emojis */}
              <div>
                <p className="text-[11px] uppercase tracking-wider font-semibold text-stone-500 mb-2">
                  Popular Emojis
                </p>
                <div className="grid grid-cols-8 gap-1.5">
                  {POPULAR_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleSelectEmoji(emoji)}
                      className={`text-xl p-2 rounded-xl border transition ${
                        selectedEmoji === emoji
                          ? 'bg-emerald-600/30 border-emerald-500 scale-105'
                          : 'bg-stone-950/50 border-stone-800 hover:border-stone-700 hover:scale-105'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NONE */}
          {activeTab === 'none' && (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-stone-800/80 flex items-center justify-center text-stone-400">
                <EyeOff className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-200">No thumbnail</p>
                <p className="text-xs text-stone-400 max-w-xs mx-auto mt-1">
                  No thumbnail will be displayed for this link.
                </p>
              </div>
              <button
                onClick={handleRemove}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-xl text-xs font-medium transition cursor-pointer"
              >
                Confirm Remove
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
