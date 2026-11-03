'use client';

import React, { useState } from 'react';
import {
  X,
  Upload,
  Sparkles,
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
} from '@/components/icons';
import { ModalButton, inputClass } from '@/components/ui/Modal';
import { PillTab, SearchPill } from '@/components/ui/patterns';

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

  const itemClass = (active) =>
    `rounded-[5px] px-[8px] py-[6px] text-[12px] hover:bg-[#F8F8F9] ${active ? 'bg-[#F8F8F9] text-black' : 'text-[#333333]'}`;
  const sectionLabel = 'mb-[6px] text-[10px] text-[#808080]';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-[10px]"
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-label="Thumbnail"
        className="flex max-h-[90vh] w-[340px] max-w-full flex-col rounded-[10px] border-[0.5px] border-[#DCDCDC] bg-white p-[8px] text-[12px] text-[#333333] shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-[10px] px-[8px] pb-[8px] pt-[4px]">
          <div className="flex min-w-0 flex-col">
            <span className="text-[14px] font-medium text-black">Thumbnail</span>
            <span className="truncate text-[10px] text-[#808080]" title={link.title || 'Untitled link'}>
              {link.title || 'Untitled link'}
            </span>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="shrink-0 text-[#808080] hover:text-black">
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-[8px] border-b-[0.5px] border-[#DCDCDC] px-[8px] pb-[8px]">
          <PillTab active={activeTab === 'image'} onClick={() => setActiveTab('image')}>Image</PillTab>
          <PillTab active={activeTab === 'icon'} onClick={() => setActiveTab('icon')}>Icon</PillTab>
          <PillTab active={activeTab === 'none'} onClick={() => setActiveTab('none')}>None</PillTab>
        </div>

        <div className="customScrollBar flex max-h-[460px] flex-col gap-[12px] overflow-y-auto px-[8px] pt-[8px]">
          {activeTab === 'image' && (
            <>
              <div className="flex gap-[2px]">
                <button type="button" onClick={() => setImageSource('upload')} className={itemClass(imageSource === 'upload')}>Upload</button>
                <button type="button" onClick={() => setImageSource('canva')} className={itemClass(imageSource === 'canva')}>Canva</button>
                <button type="button" onClick={() => setImageSource('giphy')} className={itemClass(imageSource === 'giphy')}>GIPHY</button>
                <button type="button" onClick={() => setImageSource('ai')} className={itemClass(imageSource === 'ai')}>AI Icon</button>
              </div>

              {imageSource === 'upload' && (
                <div className="flex flex-col gap-[10px]">
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-[4px] rounded-[5px] border-[0.5px] border-dashed border-[#C4C4C4] bg-[#FAFAFA] py-[20px] hover:border-[#404040]">
                    <Upload size={16} className="text-[#808080]" />
                    <span className="text-[12px]">{isUploading ? 'Processing...' : 'Upload image'}</span>
                    <span className="text-[10px] text-[#808080]">PNG, JPG, GIF, WebP</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>

                  <div className="flex flex-col gap-[5px]">
                    <span className="text-[10px] text-[#808080]">Or paste an image URL</span>
                    <div className="flex gap-[8px]">
                      <input
                        type="url"
                        placeholder="https://example.com/cover.jpg"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        className={`${inputClass} min-w-0 flex-1`}
                      />
                      <ModalButton variant="secondary" className="w-auto shrink-0 px-[12px]" onClick={handleApplyUrl}>
                        Apply
                      </ModalButton>
                    </div>
                  </div>
                </div>
              )}

              {imageSource === 'canva' && (
                <div className="flex flex-col gap-[10px]">
                  <p className="text-[12px] text-[#808080]">Design a square logo in Canva, then upload it.</p>
                  <ModalButton
                    variant="dark"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.open('https://canva.com/create/logos/', '_blank', 'noopener,noreferrer');
                      }
                    }}
                  >
                    Open Canva
                  </ModalButton>
                </div>
              )}

              {imageSource === 'giphy' && (
                <div className="flex flex-col gap-[10px]">
                  <SearchPill value={giphySearch} onChange={setGiphySearch} placeholder="Search stickers" className="w-full" />
                  <div className="grid grid-cols-3 gap-[8px]">
                    {filteredGifs.map((gif) => (
                      <button
                        key={gif.id}
                        type="button"
                        onClick={() => handleSelectPresetImage(gif.url)}
                        title={gif.title}
                        className="aspect-square overflow-hidden rounded-[5px] border-[0.5px] border-[#dcdcdc] hover:border-[#404040]"
                      >
                        <img src={gif.url} alt={gif.title} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {imageSource === 'ai' && (
                <div className="flex flex-col gap-[5px]">
                  <span className="text-[12px] font-medium text-black">Prompt</span>
                  <div className="flex gap-[8px]">
                    <input
                      type="text"
                      placeholder="e.g. Vintage cassette tape"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className={`${inputClass} min-w-0 flex-1`}
                    />
                    <ModalButton
                      className="w-auto shrink-0 px-[12px]"
                      onClick={handleGenerateAi}
                      disabled={isGeneratingAi || !aiPrompt.trim()}
                    >
                      {isGeneratingAi ? 'Creating...' : 'Generate'}
                    </ModalButton>
                  </div>
                </div>
              )}

              {link.thumbnail && link.thumbnailType === 'image' && (
                <div className="flex items-center gap-[10px] rounded-[5px] border-[0.5px] border-[#dcdcdc] p-[8px]">
                  <img src={link.thumbnail} alt="Current thumbnail" className="size-[34px] rounded-[5px] object-cover" />
                  <span className="min-w-0 flex-1 truncate text-[12px]">Current thumbnail</span>
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="rounded-[5px] px-[8px] py-[6px] text-[12px] text-[#FF4359] hover:bg-[#FF43591A]"
                  >
                    Remove
                  </button>
                </div>
              )}
            </>
          )}

          {activeTab === 'icon' && (
            <>
              <SearchPill value={iconSearch} onChange={setIconSearch} placeholder="Search icons" className="w-full" />

              <div>
                <p className={sectionLabel}>Icons</p>
                <div className="grid grid-cols-5 gap-[4px]">
                  {filteredIcons.map((item) => {
                    const IconComp = item.icon;
                    const isSelected = selectedIcon === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectIcon(item.id)}
                        title={item.label}
                        className={`flex flex-col items-center justify-center gap-[4px] rounded-[5px] border-[0.5px] px-[4px] py-[8px] hover:bg-[#F8F8F9] ${
                          isSelected ? 'border-[#000] bg-[#F8F8F9] text-black' : 'border-transparent text-[#333333]'
                        }`}
                      >
                        <IconComp size={16} />
                        <span className="max-w-full truncate text-[10px]">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className={sectionLabel}>Emojis</p>
                <div className="grid grid-cols-8 gap-[4px]">
                  {POPULAR_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleSelectEmoji(emoji)}
                      className={`rounded-[5px] border-[0.5px] py-[4px] text-[18px] hover:bg-[#F8F8F9] ${
                        selectedEmoji === emoji ? 'border-[#000] bg-[#F8F8F9]' : 'border-transparent'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'none' && (
            <div className="flex flex-col gap-[10px] py-[8px]">
              <p className="text-center text-[12px] text-[#808080]">No thumbnail will be shown for this link.</p>
              <ModalButton variant="danger" onClick={handleRemove}>Remove Thumbnail</ModalButton>
            </div>
          )}
        </div>
        <div className="h-[8px] shrink-0" />
      </div>
    </div>
  );
}
