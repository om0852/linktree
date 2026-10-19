'use client';

import React from 'react';
import { 
  X, 
  Eye, 
  MapPin, 
  Smartphone, 
  Languages, 
  Check, 
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';

export const SIMULATION_LOCATIONS = [
  { id: 'global', name: 'Global (Auto Detect)', flag: '🌍', currency: 'USD ($)', region: 'Worldwide' },
  { id: 'us', name: 'United States', flag: '🇺🇸', currency: 'USD ($)', region: 'North America' },
  { id: 'uk', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP (£)', region: 'Europe' },
  { id: 'eu', name: 'European Union', flag: '🇪🇺', currency: 'EUR (€)', region: 'Europe' },
  { id: 'in', name: 'India', flag: '🇮🇳', currency: 'INR (₹)', region: 'Asia' },
  { id: 'ca', name: 'Canada', flag: '🇨🇦', currency: 'CAD ($)', region: 'North America' },
  { id: 'au', name: 'Australia', flag: '🇦🇺', currency: 'AUD ($)', region: 'Oceania' },
  { id: 'jp', name: 'Japan', flag: '🇯🇵', currency: 'JPY (¥)', region: 'Asia' },
];

export const SIMULATION_PLATFORMS = [
  { id: 'all', name: 'All Devices & OS', icon: '🌐', description: 'Standard responsive responsive layout' },
  { id: 'ios', name: 'Apple iOS (iPhone Safari / In-App)', icon: '🍎', description: 'Simulates iOS viewport & in-app webviews' },
  { id: 'android', name: 'Android (Chrome / WebView)', icon: '🤖', description: 'Simulates Android Chrome navigation & safe area' },
  { id: 'desktop', name: 'Desktop / Laptop (Wide View)', icon: '💻', description: 'Tests horizontal 2-column or wide canvas layout' },
];

export const SIMULATION_LANGUAGES = [
  { id: 'en', name: 'English (US / UK)', native: 'English' },
  { id: 'es', name: 'Spanish (Español)', native: 'Español' },
  { id: 'fr', name: 'French (Français)', native: 'Français' },
  { id: 'de', name: 'German (Deutsch)', native: 'Deutsch' },
  { id: 'hi', name: 'Hindi (हिन्दी)', native: 'हिन्दी' },
  { id: 'ja', name: 'Japanese (日本語)', native: '日本語' },
];

export default function ViewAsModal({ 
  isOpen, 
  onClose, 
  simulation, 
  onUpdateSimulation,
  onResetSimulation
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content max-w-md w-full rounded-2xl bg-[#FFFEFA] border border-[#CAD8CE] shadow-2xl overflow-hidden flex flex-col text-[#28352F] animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#E0DCD3] flex items-center justify-between bg-[#F5F3ED]/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#52796F]/10 border border-[#52796F]/20 flex items-center justify-center text-[#52796F]">
              <Eye className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-sans text-base font-bold text-[#28352F] leading-tight flex items-center gap-2">
                <span>View as...</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E8EFEA] text-[#52796F] border border-[#CAD8CE]">
                  Simulator
                </span>
              </h3>
              <p className="text-xs text-[#5C6B64] mt-0.5 font-medium">
                Test how your profile renders for different visitors worldwide
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-[#5C6B64] hover:text-[#28352F] hover:bg-[#EAE7DE] flex items-center justify-center transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-[#5C6B64]" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="p-4 mx-5 mt-4 rounded-xl bg-[#F5F3ED]/90 border border-[#CAD8CE] flex items-start gap-3 text-xs text-[#5C6B64]">
          <Info className="w-4 h-4 text-[#52796F] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-[#28352F]">Audience Simulation:</strong> Preview rules, geo-targeted links, localized dates, and safe-area margins based on visitor location, operating system, and language.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[65vh]">
          {/* 1. Location Selector */}
          <div>
            <label className="text-xs font-bold text-[#28352F] flex items-center gap-1.5 mb-2">
              <MapPin className="w-3.5 h-3.5 text-[#52796F]" /> Visitor Country / Location
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SIMULATION_LOCATIONS.map((loc) => {
                const isSelected = simulation.location === loc.id;
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => onUpdateSimulation('location', loc.id)}
                    className={`p-2.5 rounded-xl text-left transition-all border flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#52796F] text-white border-[#3D5C54] shadow-xs'
                        : 'bg-[#F5F3ED] text-[#28352F] border-[#CAD8CE] hover:bg-[#EAE7DE]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">{loc.flag}</span>
                      <div className="min-w-0">
                        <span className="font-bold text-xs block truncate leading-tight">
                          {loc.name}
                        </span>
                        <span className={`text-[10px] font-mono ${isSelected ? 'text-white/80' : 'text-[#5C6B64]'}`}>
                          {loc.currency}
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Platform / Device Simulation */}
          <div>
            <label className="text-xs font-bold text-[#28352F] flex items-center gap-1.5 mb-2">
              <Smartphone className="w-3.5 h-3.5 text-[#52796F]" /> Platform / In-App WebView
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SIMULATION_PLATFORMS.map((plat) => {
                const isSelected = simulation.platform === plat.id;
                return (
                  <button
                    key={plat.id}
                    type="button"
                    onClick={() => onUpdateSimulation('platform', plat.id)}
                    className={`p-2.5 rounded-xl text-left transition-all border flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#52796F] text-white border-[#3D5C54] shadow-xs'
                        : 'bg-[#F5F3ED] text-[#28352F] border-[#CAD8CE] hover:bg-[#EAE7DE]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">{plat.icon}</span>
                      <div className="min-w-0">
                        <span className="font-bold text-xs block truncate leading-tight">
                          {plat.name}
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Language Selector */}
          <div>
            <label className="text-xs font-bold text-[#28352F] flex items-center gap-1.5 mb-2">
              <Languages className="w-3.5 h-3.5 text-[#52796F]" /> Browser Language
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SIMULATION_LANGUAGES.map((lang) => {
                const isSelected = simulation.language === lang.id;
                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => onUpdateSimulation('language', lang.id)}
                    className={`p-2 rounded-xl text-center transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-[#52796F] text-white border-[#3D5C54] shadow-xs font-bold'
                        : 'bg-[#F5F3ED] text-[#28352F] border-[#CAD8CE] hover:bg-[#EAE7DE]'
                    }`}
                  >
                    <span className="font-bold text-xs block truncate leading-tight">
                      {lang.name.split(' ')[0]}
                    </span>
                    <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-[#5C6B64]'}`}>
                      {lang.native}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-[#E0DCD3] flex items-center justify-between bg-[#F5F3ED]/70">
          <button
            type="button"
            onClick={onResetSimulation}
            className="flex items-center gap-1.5 text-xs text-[#5C6B64] hover:text-[#28352F] font-semibold cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#52796F] hover:bg-[#3D5C54] text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 fill-white" />
            <span>Apply Simulation</span>
          </button>
        </div>
      </div>
    </div>
  );
}
