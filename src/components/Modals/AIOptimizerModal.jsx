'use client';

import React from 'react';
import { Sparkles, Zap, CheckCircle2, AlertCircle, X, Wand2 } from '@/components/icons';
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
      <div className="modal-content p-6 max-w-lg w-full relative border-[0.5px] border-line bg-white shadow-modal rounded-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-ink-500 hover:text-ink-700 hover:bg-surface-2 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b-[0.5px] border-line pb-4">
          <div className="w-10 h-10 rounded-full bg-brand-500/10 text-brand-500 border border-brand-500/20 flex items-center justify-center ">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[14px] font-sans font-semibold text-ink-700 flex items-center gap-2">
              TreeInBio Bio Optimizer
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-brand-500/10 text-brand-500 border border-brand-500/30 font-mono">
                PRO
              </span>
            </h3>
            <p className="text-xs text-ink-500">Smart Engagement &amp; Conversion Optimization</p>
          </div>
        </div>

        {/* Score Card */}
        <div className="mt-4 p-4 rounded-xl bg-surface-2 border-[0.5px] border-line flex items-center justify-between">
          <div>
            <span className="text-[11px] text-ink-500 uppercase tracking-wider font-semibold block">
              Estimated Bio CTR
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-semibold text-ink-700 font-mono">{ctrData.score}%</span>
              <span className="text-xs font-semibold text-brand-500">
                [{ctrData.rating}]
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              onAutoOptimize();
              onClose();
            }}
            className="px-4 py-2 rounded-sm bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-white" /> 1-Click Auto Boost
          </button>
        </div>

        {/* Recommendations */}
        <div className="mt-4 space-y-2">
          <h4 className="text-[12px] font-semibold text-ink-700 uppercase tracking-wider">
            Profile Recommendations ({ctrData.recommendations.length} items)
          </h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {ctrData.recommendations.length > 0 ? (
              ctrData.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-surface-2 border-[0.5px] border-line text-xs text-ink-700">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-brand-500/10 border border-brand-500/30 text-xs text-brand-500">
                <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                <span>All core conversion benchmarks are maximized for your persona!</span>
              </div>
            )}
          </div>
        </div>

        {/* AI Bio Generator Taglines */}
        <div className="mt-4 space-y-2">
          <h4 className="text-[12px] font-semibold text-ink-700 uppercase tracking-wider flex items-center gap-1.5">
            <Wand2 className="w-3.5 h-3.5 text-brand-500" /> AI Persona Bio Variations
          </h4>
          <div className="space-y-1.5">
            {bioSuggestions.map((bio, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-surface-2 border-[0.5px] border-line hover:border-brand-500 transition-all flex items-center justify-between gap-3 text-xs"
              >
                <p className="text-ink-700 flex-1 line-clamp-2">{bio}</p>
                <button
                  onClick={() => {
                    onApplyBio(bio);
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-sm bg-brand-500 hover:bg-brand-600 text-white text-[11px] font-semibold transition-all shrink-0 cursor-pointer"
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
