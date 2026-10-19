'use client';

import React from 'react';
import { Sparkles, Zap, CheckCircle2, AlertCircle, X, Wand2 } from 'lucide-react';
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
    <div className="modal-overlay">
      <div className="modal-content p-6 max-w-lg w-full relative border border-[#CAD8CE] bg-[#FFFEFA] shadow-2xl rounded-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#5C6B64] hover:text-[#28352F] hover:bg-[#F5F3ED] transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[#E0DCD3] pb-4">
          <div className="w-10 h-10 rounded-full bg-[#52796F]/10 text-[#52796F] border border-[#52796F]/20 flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-sans text-base font-semibold text-[#28352F] flex items-center gap-2">
              TreeInBio Bio Optimizer
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-[#52796F]/10 text-[#52796F] border border-[#52796F]/30 font-mono">
                PRO
              </span>
            </h3>
            <p className="text-xs text-[#5C6B64]">Smart Engagement &amp; Conversion Optimization</p>
          </div>
        </div>

        {/* Score Card */}
        <div className="mt-4 p-4 rounded-xl bg-[#F5F3ED] border border-[#CAD8CE] flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[#5C6B64] uppercase tracking-wider font-semibold block">
              Estimated Bio CTR
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-bold text-[#28352F] font-mono">{ctrData.score}%</span>
              <span className="text-xs font-semibold text-[#52796F]">
                [{ctrData.rating}]
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              onAutoOptimize();
              onClose();
            }}
            className="px-4 py-2 rounded-sm bg-[#52796F] hover:bg-[#3D5C54] text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-white" /> 1-Click Auto Boost
          </button>
        </div>

        {/* Recommendations */}
        <div className="mt-4 space-y-2">
          <h4 className="text-xs font-semibold text-[#28352F] uppercase tracking-wider">
            Profile Recommendations ({ctrData.recommendations.length} items)
          </h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {ctrData.recommendations.length > 0 ? (
              ctrData.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-[#F5F3ED] border border-[#CAD8CE] text-xs text-[#28352F]">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[#52796F]/10 border border-[#52796F]/30 text-xs text-[#52796F]">
                <CheckCircle2 className="w-4 h-4 text-[#52796F] shrink-0" />
                <span>All core conversion benchmarks are maximized for your persona!</span>
              </div>
            )}
          </div>
        </div>

        {/* AI Bio Generator Taglines */}
        <div className="mt-4 space-y-2">
          <h4 className="text-xs font-semibold text-[#28352F] uppercase tracking-wider flex items-center gap-1.5">
            <Wand2 className="w-3.5 h-3.5 text-[#52796F]" /> AI Persona Bio Variations
          </h4>
          <div className="space-y-1.5">
            {bioSuggestions.map((bio, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-[#F5F3ED] border border-[#CAD8CE] hover:border-[#52796F] transition-all flex items-center justify-between gap-3 text-xs"
              >
                <p className="text-[#28352F] flex-1 line-clamp-2">{bio}</p>
                <button
                  onClick={() => {
                    onApplyBio(bio);
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-sm bg-[#52796F] hover:bg-[#3D5C54] text-white text-[11px] font-semibold transition-all shrink-0 cursor-pointer"
                >
                  Apply
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
