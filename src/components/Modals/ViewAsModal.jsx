'use client';

import React from 'react';
import Modal, { ModalButton } from '@/components/ui/Modal';
import { InfoTip } from '@/components/ui/patterns';
import { GEO_COUNTRIES, isLinkVisibleInCountry } from '@/lib/geoTargeting';

// "View as" previews the page for a visitor from another country, so
// geo-targeted links appear or disappear exactly as they do on the live page.
export const SIMULATION_LOCATIONS = [
  { code: 'global', name: 'Everyone', flag: '🌍' },
  ...GEO_COUNTRIES,
];

const tileClass = (isSelected) =>
  `flex min-w-0 items-center gap-[8px] text-left rounded-[5px] border-[0.5px] px-[10px] py-[8px] text-[12px] hover:bg-[#F8F8F9BF] ${
    isSelected ? 'border-[#000] bg-[#F8F8F9BF] text-black' : 'border-[#DCDCDC] bg-white text-[#333333]'
  }`;

export default function ViewAsModal({
  isOpen,
  onClose,
  simulation,
  links = [],
  onUpdateSimulation,
  onResetSimulation,
}) {
  if (!isOpen) return null;

  const liveLinks = links.filter((link) => !link.disabled && !link.isArchived && link.active !== false);
  const targetedCount = liveLinks.filter((link) => link.geoTargeting?.enabled && link.geoTargeting.countries?.length).length;
  const visibleCount = (code) => liveLinks.filter((link) => isLinkVisibleInCountry(link, code)).length;

  return (
    <Modal
      onClose={onClose}
      title="View As"
      width="md"
      headerExtra={<InfoTip content="Preview your page as a visitor from another country. Links with location rules show or hide here exactly as they do on your live page." />}
      bodyClassName="flex flex-col gap-[15px]"
      footer={
        <>
          <ModalButton variant="secondary" className="w-[50%]" onClick={onResetSimulation}>
            Reset
          </ModalButton>
          <ModalButton variant="primary" className="w-[50%]" onClick={onClose}>
            Done
          </ModalButton>
        </>
      }
    >
      <p className="text-[12px] text-[#808080]">
        {targetedCount
          ? `${targetedCount} of your ${liveLinks.length} links have location rules. Pick a country to see what its visitors get.`
          : 'None of your links have location rules yet, so every visitor sees the same page. Add a rule from a link’s Location targeting setting.'}
      </p>

      <div className="flex flex-col gap-[5px]">
        <span className="text-[14px] font-medium text-black">Visitor location</span>
        <div className="grid grid-cols-2 gap-[8px]">
          {SIMULATION_LOCATIONS.map((loc) => {
            const isSelected = (simulation.location || 'global').toUpperCase() === loc.code.toUpperCase();
            return (
              <button
                key={loc.code}
                type="button"
                onClick={() => onUpdateSimulation('location', loc.code)}
                className={tileClass(isSelected)}
              >
                <span className="shrink-0 text-[14px] leading-none">{loc.flag}</span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">{loc.name}</span>
                  <span className="text-[10px] text-[#808080]">
                    {visibleCount(loc.code)} of {liveLinks.length} links
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
