'use client';

import React from 'react';
import { Modal, ModalButton } from '@/components/ui';
import { PERSONA_TAGLINES } from '../../utils/aiScoring';

export default function AIOptimizerModal({ 
  profile, 
  ctrData, 
  onClose, 
  onApplyBio, 
  onAutoOptimize 
}) {
  const bioSuggestions = PERSONA_TAGLINES[profile.niche] || PERSONA_TAGLINES.influencer;

  return (
    <Modal
      open
      onClose={onClose}
      title="Bio Optimizer"
      headerExtra={
        <span className="rounded-[4px] bg-[#16A34A1A] px-[6px] py-[2px] text-[10px] font-medium text-[#16A34A]">PRO</span>
      }
      width="md"
      footer={
        <>
          <ModalButton variant="secondary" className="w-[50%]" onClick={onClose}>
            Cancel
          </ModalButton>
          <ModalButton
            variant="primary"
            className="w-[50%]"
            onClick={() => {
              onAutoOptimize();
              onClose();
            }}
          >
            Auto Boost
          </ModalButton>
        </>
      }
    >
      <div className="flex flex-col gap-[15px]">
        <div className="flex items-center justify-between rounded-[10px] border-[0.5px] border-[#dcdcdc] p-[15px]">
          <div className="flex flex-col">
            <span className="text-[14px] font-semibold text-black">{ctrData.score}%</span>
            <span className="mt-[2px] text-[12px] text-[#808080]">Estimated CTR</span>
          </div>
          <span className="rounded-[4px] bg-[#F8F8F9] px-[6px] py-[2px] text-[10px] text-[#333333]">{ctrData.rating}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[12px] font-medium text-black">Recommendations ({ctrData.recommendations.length})</span>
          <div className="customScrollBar mt-[8px] flex max-h-[192px] flex-col overflow-y-auto border-t-[0.5px] border-[#f0f0f0]">
            {ctrData.recommendations.length > 0 ? (
              ctrData.recommendations.map((rec, i) => (
                <div key={i} className="border-b-[0.5px] border-[#f0f0f0] px-[6px] py-[8px] text-[12px] text-[#333333]">
                  {rec}
                </div>
              ))
            ) : (
              <p className="py-[8px] text-[12px] text-[#808080]">All benchmarks are met for your persona.</p>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-[12px] font-medium text-black">Bio Suggestions</span>
          <div className="mt-[8px] flex flex-col border-t-[0.5px] border-[#f0f0f0]">
            {bioSuggestions.map((bio, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-[10px] border-b-[0.5px] border-[#f0f0f0] px-[6px] py-[8px] text-[12px] hover:bg-[#F8F8F9]"
              >
                <p className="line-clamp-2 flex-1 text-[#333333]">{bio}</p>
                <button
                  type="button"
                  onClick={() => {
                    onApplyBio(bio);
                    onClose();
                  }}
                  className="shrink-0 rounded-[50px] border-[1px] border-[#C4C4C4] px-[10px] py-[4px] text-[10px] hover:bg-[#F8F8F9]"
                >
                  Apply
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
