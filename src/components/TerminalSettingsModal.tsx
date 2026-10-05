import React from "react";
import {
  X,
  Palette,
  Check,
  RotateCcw,
  Sparkles,
  Sliders,
  Tv,
  Type,
  AlignJustify,
  Settings
} from "lucide-react";
import {
  TERMINAL_THEMES,
  TerminalThemeId,
  TerminalSettings,
  TerminalFontSize,
  TerminalLineHeight,
  TerminalCursorStyle
} from "../utils/terminalThemes";

interface TerminalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TerminalSettings;
  onUpdateSettings: (newSettings: TerminalSettings) => void;
  onResetSettings: () => void;
  onOpenGlobalSettings?: () => void;
}

export const TerminalSettingsModal: React.FC<TerminalSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetSettings,
  onOpenGlobalSettings,
}) => {
  if (!isOpen) return null;

  const currentTheme = TERMINAL_THEMES[settings.themeId] || TERMINAL_THEMES["replit-dark"];

  const handleSelectTheme = (themeId: TerminalThemeId) => {
    const targetTheme = TERMINAL_THEMES[themeId];
    // If selecting retro-green or cyberpunk for the first time, auto-suggest CRT glow if not set
    const shouldEnableCrt = targetTheme.crtEffectRecommended && !settings.crtGlow;
    onUpdateSettings({
      ...settings,
      themeId,
      crtGlow: shouldEnableCrt ? true : settings.crtGlow,
    });
  };

  const handleSetFontSize = (fontSize: TerminalFontSize) => {
    onUpdateSettings({ ...settings, fontSize });
  };

  const handleSetLineHeight = (lineHeight: TerminalLineHeight) => {
    onUpdateSettings({ ...settings, lineHeight });
  };

  const handleSetCursorStyle = (cursorStyle: TerminalCursorStyle) => {
    onUpdateSettings({ ...settings, cursorStyle });
  };

  const handleToggleCrtGlow = () => {
    onUpdateSettings({ ...settings, crtGlow: !settings.crtGlow });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 select-none animate-in fade-in duration-200">
      <div className="bg-[#121620] border border-[#273244] rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col text-xs text-gray-200 max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#212b3b] flex items-center justify-between bg-[#0e121a] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#3b82f6]/15 border border-[#3b82f6]/30 flex items-center justify-center text-[#60a5fa]">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-white">Thèmes & Paramètres du Terminal</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1e2738] text-blue-300 border border-[#2d3a52]">
                  {currentTheme.name}
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Personnalisez les couleurs, le contraste, la police et les effets rétro de votre console.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#1f2738] text-gray-400 hover:text-white transition cursor-pointer"
            title="Fermer (Échap)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* Section 1: Themes Grid */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                <span>Thèmes de Couleurs ({Object.keys(TERMINAL_THEMES).length})</span>
              </span>
              <span className="text-[10px] text-gray-400">
                Cliquez pour appliquer instantanément
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {Object.values(TERMINAL_THEMES).map((theme) => {
                const isSelected = theme.id === settings.themeId;
                return (
                  <button
                    key={theme.id}
                    onClick={() => handleSelectTheme(theme.id)}
                    style={{
                      backgroundColor: theme.colors.bg,
                      borderColor: isSelected
                        ? theme.colors.promptUser
                        : theme.colors.border,
                    }}
                    className={`relative p-3 rounded-lg border text-left transition-all cursor-pointer group flex flex-col justify-between ${
                      isSelected
                        ? "ring-2 ring-offset-2 ring-offset-[#121620] shadow-lg scale-[1.01]"
                        : "hover:border-gray-500/60 opacity-90 hover:opacity-100"
                    }`}
                  >
                    {/* Top Row: Title, Badge & Palette Swatches */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-bold text-xs"
                          style={{ color: theme.colors.stdout }}
                        >
                          {theme.name}
                        </span>
                        {theme.badge && (
                          <span
                            className="text-[9.5px] px-1.5 py-0.2 rounded font-mono font-medium border"
                            style={{
                              backgroundColor: theme.colors.toolbarBg,
                              color: theme.colors.stdin,
                              borderColor: theme.colors.toolbarBorder,
                            }}
                          >
                            {theme.badge}
                          </span>
                        )}
                      </div>

                      {/* 4 Swatch Circles */}
                      <div className="flex items-center gap-1 shrink-0 p-1 rounded bg-black/40 border border-white/10">
                        {theme.colors.previewDots.map((c, i) => (
                          <span
                            key={i}
                            className="w-2.5 h-2.5 rounded-full border border-black/30"
                            style={{ backgroundColor: c }}
                            title={`Couleur: ${c}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Description */}
                    <p
                      className="text-[11px] leading-relaxed mb-2"
                      style={{
                        color: theme.isDark ? "#9ca3af" : "#586e75",
                      }}
                    >
                      {theme.description}
                    </p>

                    {/* Mini Terminal Preview Strip */}
                    <div
                      className="px-2 py-1.5 rounded font-mono text-[10.5px] flex items-center justify-between border"
                      style={{
                        backgroundColor: theme.colors.inputBg,
                        borderColor: theme.colors.inputBorder,
                      }}
                    >
                      <div className="flex items-center gap-1 truncate">
                        <span style={{ color: theme.colors.promptUser }}>repl@</span>
                        <span style={{ color: theme.colors.promptPath }}>~</span>
                        <span style={{ color: theme.colors.promptSymbol }}>$</span>
                        <span style={{ color: theme.colors.stdout }} className="ml-1">
                          run main.py
                        </span>
                      </div>
                      {isSelected ? (
                        <span
                          className="flex items-center gap-1 font-bold text-[10px] uppercase font-sans shrink-0 px-1.5 py-0.5 rounded shadow-xs"
                          style={{
                            backgroundColor: theme.colors.promptUser,
                            color: theme.isDark ? "#000000" : "#ffffff",
                          }}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                          Actif
                        </span>
                      ) : (
                        <span
                          className="text-[10px] opacity-0 group-hover:opacity-100 transition shrink-0"
                          style={{ color: theme.colors.promptUser }}
                        >
                          Choisir →
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Display & Typography Options */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-400 mb-3 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>Options d'Affichage & Typographie</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0d1017] p-3.5 rounded-lg border border-[#202938]">
              {/* Font Size */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-gray-300 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-blue-400" />
                  <span>Taille de Police</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-[#141a24] p-1 rounded-md border border-[#242f42]">
                  <button
                    onClick={() => handleSetFontSize("xs")}
                    className={`py-1 text-[11px] rounded transition font-mono ${
                      settings.fontSize === "xs"
                        ? "bg-[#253247] text-white font-bold shadow-xs border border-blue-500/40"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    11px (XS)
                  </button>
                  <button
                    onClick={() => handleSetFontSize("sm")}
                    className={`py-1 text-[11px] rounded transition font-mono ${
                      settings.fontSize === "sm"
                        ? "bg-[#253247] text-white font-bold shadow-xs border border-blue-500/40"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    12px (Défaut)
                  </button>
                  <button
                    onClick={() => handleSetFontSize("base")}
                    className={`py-1 text-[11px] rounded transition font-mono ${
                      settings.fontSize === "base"
                        ? "bg-[#253247] text-white font-bold shadow-xs border border-blue-500/40"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    14px (Grand)
                  </button>
                </div>
              </div>

              {/* Line Height */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-gray-300 flex items-center gap-1.5">
                  <AlignJustify className="w-3.5 h-3.5 text-blue-400" />
                  <span>Espacement des Lignes</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-[#141a24] p-1 rounded-md border border-[#242f42]">
                  <button
                    onClick={() => handleSetLineHeight("compact")}
                    className={`py-1 text-[11px] rounded transition ${
                      settings.lineHeight === "compact"
                        ? "bg-[#253247] text-white font-bold shadow-xs border border-blue-500/40"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    Compact
                  </button>
                  <button
                    onClick={() => handleSetLineHeight("normal")}
                    className={`py-1 text-[11px] rounded transition ${
                      settings.lineHeight === "normal"
                        ? "bg-[#253247] text-white font-bold shadow-xs border border-blue-500/40"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    onClick={() => handleSetLineHeight("relaxed")}
                    className={`py-1 text-[11px] rounded transition ${
                      settings.lineHeight === "relaxed"
                        ? "bg-[#253247] text-white font-bold shadow-xs border border-blue-500/40"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    Aéré
                  </button>
                </div>
              </div>

              {/* Cursor Style */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-gray-300 flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 text-center font-mono font-bold text-blue-400">
                    █
                  </span>
                  <span>Style de Curseur</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-[#141a24] p-1 rounded-md border border-[#242f42]">
                  <button
                    onClick={() => handleSetCursorStyle("block")}
                    className={`py-1 text-[11px] rounded transition flex items-center justify-center gap-1 font-mono ${
                      settings.cursorStyle === "block"
                        ? "bg-[#253247] text-white font-bold shadow-xs border border-blue-500/40"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <span>█</span> Bloc
                  </button>
                  <button
                    onClick={() => handleSetCursorStyle("bar")}
                    className={`py-1 text-[11px] rounded transition flex items-center justify-center gap-1 font-mono ${
                      settings.cursorStyle === "bar"
                        ? "bg-[#253247] text-white font-bold shadow-xs border border-blue-500/40"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <span>|</span> Barre
                  </button>
                  <button
                    onClick={() => handleSetCursorStyle("underline")}
                    className={`py-1 text-[11px] rounded transition flex items-center justify-center gap-1 font-mono ${
                      settings.cursorStyle === "underline"
                        ? "bg-[#253247] text-white font-bold shadow-xs border border-blue-500/40"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <span>_</span> Trait
                  </button>
                </div>
              </div>

              {/* CRT Scanline & Glow Toggle */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-gray-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Tv className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Lueur CRT & Scanlines</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {settings.crtGlow ? "Activé" : "Désactivé"}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={handleToggleCrtGlow}
                  className={`w-full py-1.5 px-3 rounded-md border flex items-center justify-between transition cursor-pointer ${
                    settings.crtGlow
                      ? "bg-emerald-950/40 border-emerald-500/60 text-emerald-200"
                      : "bg-[#141a24] border-[#242f42] text-gray-400 hover:text-gray-300"
                  }`}
                >
                  <span className="text-[11px]">
                    Effet phosphore & trame cathodique
                  </span>
                  <div
                    className={`w-8 h-4 rounded-full transition-colors relative ${
                      settings.crtGlow ? "bg-emerald-500" : "bg-gray-700"
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${
                        settings.crtGlow ? "translate-x-4.5" : "translate-x-0.5"
                      }`}
                    />
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: CLI Shortcuts Hint */}
          <div className="p-3 bg-[#0d121c] border border-[#202b3d] rounded-lg space-y-1 text-gray-300">
            <div className="flex items-center gap-1.5 font-semibold text-blue-300 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Commande Shell Rapide</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Vous pouvez aussi basculer de thème directement en tapant{" "}
              <code className="px-1.5 py-0.5 rounded bg-[#182030] text-emerald-300 font-mono text-[10px] border border-[#28364f]">
                theme dracula
              </code>
              ,{" "}
              <code className="px-1.5 py-0.5 rounded bg-[#182030] text-emerald-300 font-mono text-[10px] border border-[#28364f]">
                theme retro
              </code>
              ,{" "}
              <code className="px-1.5 py-0.5 rounded bg-[#182030] text-emerald-300 font-mono text-[10px] border border-[#28364f]">
                theme solarized-dark
              </code>{" "}
              ou{" "}
              <code className="px-1.5 py-0.5 rounded bg-[#182030] text-emerald-300 font-mono text-[10px] border border-[#28364f]">
                theme default
              </code>{" "}
              dans la console.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#212b3b] bg-[#0e121a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onResetSettings}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-[#1c2434] transition text-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser</span>
            </button>

            {onOpenGlobalSettings && (
              <button
                onClick={() => {
                  onClose();
                  onOpenGlobalSettings();
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-orange-300 hover:text-orange-200 hover:bg-[#201c18] border border-orange-800/40 transition text-xs cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-[#f26207]" />
                <span>Tous les Paramètres de l'IDE</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition cursor-pointer"
          >
            Terminé
          </button>
        </div>
      </div>
    </div>
  );
};
