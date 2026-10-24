import React from 'react';
import { Challenge, SimulationMode, Language } from '../types';
import { Trophy, CheckCircle, ArrowRight, X, Sparkles } from 'lucide-react';

interface ChallengesModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenges: Challenge[];
  completedMap: Record<string, boolean>;
  onSelectChallengeMode: (mode: SimulationMode) => void;
  lang: Language;
}

export const ChallengesModal: React.FC<ChallengesModalProps> = ({
  isOpen,
  onClose,
  challenges,
  completedMap,
  onSelectChallengeMode,
  lang
}) => {
  if (!isOpen) return null;

  const total = challenges.length;
  const completedCount = Object.values(completedMap).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {lang === 'bn' ? 'শিক্ষার্থী পদার্থবিজ্ঞান চ্যালেঞ্জ' : 'Student Physics Challenges'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {lang === 'bn' ? 'সিলেবাস ভিত্তিক সক্রিয় পরীক্ষণ ও যাচাইকরণ' : 'Interactive syllabus verification experiments'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-mono font-bold">
              {completedCount}/{total} {lang === 'bn' ? 'সম্পন্ন' : 'Solved'}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Challenge Cards List */}
        <div className="p-6 overflow-y-auto space-y-4 bg-slate-50/50">
          {challenges.map((ch, idx) => {
            const isDone = !!completedMap[ch.id];
            return (
              <div
                key={ch.id}
                className={`p-4 rounded-xl border transition-all ${
                  isDone
                    ? 'bg-emerald-50/70 border-emerald-300 text-slate-800 shadow-2xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                      0{idx + 1}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {lang === 'bn' ? ch.titleBn : ch.titleEn}
                    </h4>
                  </div>
                  {isDone ? (
                    <div className="flex items-center gap-1 text-emerald-700 text-xs font-bold shrink-0">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>{lang === 'bn' ? 'যাচাইকৃত' : 'Verified'}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 shrink-0 font-medium">
                      {lang === 'bn' ? 'অসম্পূর্ণ' : 'Pending'}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  {lang === 'bn' ? ch.descBn : ch.descEn}
                </p>

                <div className="p-2.5 bg-slate-50 rounded-lg text-xs text-slate-600 mb-3 font-mono border border-slate-200">
                  <span className="text-cyan-700 font-bold">{lang === 'bn' ? 'ইঙ্গিত: ' : 'Hint: '}</span>
                  {lang === 'bn' ? ch.hintBn : ch.hintEn}
                </div>

                <div className="flex items-center justify-end">
                  <button
                    onClick={() => {
                      onSelectChallengeMode(ch.targetMode);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                  >
                    <span>{lang === 'bn' ? 'ল্যাবে পরীক্ষা শুরু করুন' : 'Launch In Lab'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {completedCount === total && (
            <div className="p-4 bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-300 rounded-xl text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-amber-900 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>{lang === 'bn' ? 'অভিনন্দন! সকল চ্যালেঞ্জ সফলভাবে সম্পন্ন!' : 'Mastery Achieved! All 3 Challenges Completed!'}</span>
              </div>
              <p className="text-xs text-slate-600">
                {lang === 'bn'
                  ? 'আপনি পৃথিবীর মহাকর্ষ, টানেল স্পন্দন ও আহ্নিক গতির সমীকরণগুলো ব্যবহারিকভাবে প্রমাণ করেছেন।'
                  : 'You have experimentally verified Earth gravity, SHM tunnel dynamics, and rotational weightlessness.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
