import React from 'react';
import { SimulationMode, Language } from '../types';
import { getTranslation } from '../utils/i18n';
import { soundFx } from '../utils/audio';
import { Volume2, VolumeX, Globe, Maximize, Minimize } from 'lucide-react';

interface HeaderProps {
  currentMode: SimulationMode;
  onSelectMode: (mode: SimulationMode) => void;
  lang: Language;
  onToggleLang: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  lang,
  onToggleLang,
  soundEnabled,
  onToggleSound,
  isFullscreen,
  onToggleFullscreen
}) => {
  const t = getTranslation(lang);

  const tabs: { id: SimulationMode; label: string }[] = [
    { id: 'explorer', label: t.tabExplorer },
    { id: 'tunnel', label: t.tabTunnel },
    { id: 'rotation', label: t.tabRotation }
  ];

  return (
    <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between z-30 shrink-0 gap-4 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-600 shrink-0 shadow-xs">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
            </svg>
          </div>
          <h1 className="text-sm md:text-base font-extrabold text-slate-900 tracking-tight whitespace-nowrap">
            {t.appTitle}
          </h1>
        </div>

      {/* Center: Mode Tabs */}
      <nav className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
        {tabs.map(tab => {
          const isActive = currentMode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                soundFx.playClick();
                onSelectMode(tab.id);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-white text-cyan-800 border border-slate-200 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Right: Actions & UDVASH Educational Badge */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">

        {/* Language Toggle */}
        <button
          onClick={() => {
            soundFx.playClick();
            onToggleLang();
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 rounded-lg border border-slate-200 text-xs font-medium transition-colors cursor-pointer"
          title="Switch Language"
        >
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-mono text-xs uppercase font-semibold">{lang}</span>
        </button>

        {/* Sound Toggle */}
        <button
          onClick={() => {
            onToggleSound();
          }}
          className="p-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 rounded-lg border border-slate-200 text-xs transition-colors cursor-pointer"
          title={soundEnabled ? 'Mute Audio' : 'Enable Audio'}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-600" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={() => {
            soundFx.playClick();
            onToggleFullscreen();
          }}
          className="p-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 rounded-lg border border-slate-200 text-xs transition-colors cursor-pointer flex items-center gap-1"
          title={isFullscreen ? (lang === 'bn' ? 'ফুল স্ক্রিন বন্ধ করুন' : 'Exit Full Screen') : (lang === 'bn' ? 'ফুল স্ক্রিন করুন' : 'Full Screen')}
        >
          {isFullscreen ? <Minimize className="w-3.5 h-3.5 text-cyan-700" /> : <Maximize className="w-3.5 h-3.5 text-slate-600" />}
          <span className="hidden xl:inline text-[11px] font-semibold">{t.fullscreen}</span>
        </button>

        {/* UDVASH Educational Badge */}
        <div className="relative group flex items-center justify-center pl-1">
          <div className="px-2.5 py-1 bg-gradient-to-r from-red-600 to-rose-700 text-white font-extrabold text-xs tracking-wider rounded border border-rose-500 shadow-sm select-none">
            {t.udvashBadge}
          </div>
        </div>
      </div>
    </header>
  );
};
