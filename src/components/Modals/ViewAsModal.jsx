'use client';

import React from 'react';
import Modal, { ModalButton } from '@/components/ui/Modal';
import { InfoTip } from '@/components/ui/patterns';

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

const tileClass = (isSelected, layout = 'items-center gap-[8px] text-left') =>
  `flex min-w-0 ${layout} rounded-[5px] border-[0.5px] px-[10px] py-[8px] text-[12px] hover:bg-[#F8F8F9BF] ${
    isSelected ? 'border-[#000] bg-[#F8F8F9BF] text-black' : 'border-[#DCDCDC] bg-white text-[#333333]'
  }`;

function Section({ label, children }) {
  return (
    <div className="flex flex-col gap-[5px]">
      <span className="text-[14px] font-medium text-black">{label}</span>
      {children}
    </div>
  );
}

export default function ViewAsModal({ 
  isOpen, 
  onClose, 
  simulation, 
  onUpdateSimulation,
  onResetSimulation
}) {
  if (!isOpen) return null;

  return (
    <Modal
      onClose={onClose}
      title="View As"
      width="md"
      headerExtra={<InfoTip content="Preview geo rules, localized dates and safe areas by visitor location, platform and language." />}
      bodyClassName="flex flex-col gap-[15px]"
      footer={
        <>
          <ModalButton variant="secondary" className="w-[50%]" onClick={onResetSimulation}>
            Reset
          </ModalButton>
          <ModalButton variant="primary" className="w-[50%]" onClick={onClose}>
            Apply
          </ModalButton>
        </>
      }
    >
      <Section label="Location">
        <div className="grid grid-cols-2 gap-[8px]">
          {SIMULATION_LOCATIONS.map((loc) => {
            const isSelected = simulation.location === loc.id;
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => onUpdateSimulation('location', loc.id)}
                className={tileClass(isSelected)}
              >
                <span className="shrink-0 text-[14px] leading-none">{loc.flag}</span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">{loc.name}</span>
                  <span className="text-[10px] text-[#808080]">{loc.currency}</span>
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section label="Platform">
        <div className="grid grid-cols-2 gap-[8px]">
          {SIMULATION_PLATFORMS.map((plat) => {
            const isSelected = simulation.platform === plat.id;
            return (
              <button
                key={plat.id}
                type="button"
                onClick={() => onUpdateSimulation('platform', plat.id)}
                className={tileClass(isSelected)}
                title={plat.name}
              >
                <span className="truncate">{plat.name}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section label="Language">
        <div className="grid grid-cols-3 gap-[8px]">
          {SIMULATION_LANGUAGES.map((lang) => {
            const isSelected = simulation.language === lang.id;
            return (
              <button
                key={lang.id}
                type="button"
                onClick={() => onUpdateSimulation('language', lang.id)}
                className={tileClass(isSelected, 'flex-col items-center text-center')}
              >
                <span className="w-full truncate">{lang.name.split(' ')[0]}</span>
                <span className="text-[10px] text-[#808080]">{lang.native}</span>
              </button>
            );
          })}
        </div>
      </Section>
    </Modal>
  );
}
