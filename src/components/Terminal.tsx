import React, { useState, useRef, useEffect } from "react";
import {
  Terminal as TerminalIcon,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Bug,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Code2,
  Wrench,
  Palette,
  Sliders,
  Settings2,
  ChevronDown
} from "lucide-react";
import { TerminalLine, ProjectFile } from "../types";
import { LintProblem } from "../utils/linter";
import { FileLanguageIcon } from "./FileLanguageIcon";
import {
  TERMINAL_THEMES,
  TerminalThemeId,
  TerminalSettings,
  DEFAULT_TERMINAL_SETTINGS,
  loadTerminalSettings,
  saveTerminalSettings
} from "../utils/terminalThemes";
import { TerminalSettingsModal } from "./TerminalSettingsModal";

export interface TerminalProps {
  lines: TerminalLine[];
  onClear: () => void;
  onExecuteCommand: (command: string) => void;
  onDebugErrorWithAI: (lastError: string) => void;
  isRunning: boolean;
  statusMessage?: string;
  problems?: LintProblem[];
  onNavigateToProblem?: (fileId: string, line: number, column: number) => void;
  activeTab?: "console" | "problems";
  onTabChange?: (tab: "console" | "problems") => void;
  settings?: TerminalSettings;
  onUpdateSettings?: (newSettings: TerminalSettings) => void;
  onOpenGlobalSettings?: () => void;
  onOpenArtifact?: () => void;
}

export const Terminal: React.FC<TerminalProps> = ({
  lines,
  onClear,
  onExecuteCommand,
  onDebugErrorWithAI,
  isRunning,
  statusMessage,
  problems = [],
  onNavigateToProblem,
  activeTab,
  onTabChange,
  settings: propSettings,
  onUpdateSettings: propOnUpdateSettings,
  onOpenGlobalSettings,
  onOpenArtifact,
}) => {
  const [internalTab, setInternalTab] = useState<"console" | "problems">("console");
  const currentTab = activeTab ?? internalTab;

  const handleSetTab = (newTab: "console" | "problems") => {
    setInternalTab(newTab);
    onTabChange?.(newTab);
  };

  // Internal settings state with fallback to propSettings or localStorage
  const [internalSettings, setInternalSettings] = useState<TerminalSettings>(
    () => propSettings || loadTerminalSettings()
  );

  const activeSettings = propSettings || internalSettings;

  const handleUpdateSettings = (newSettings: TerminalSettings) => {
    setInternalSettings(newSettings);
    saveTerminalSettings(newSettings);
    propOnUpdateSettings?.(newSettings);
  };

  const handleResetSettings = () => {
    handleUpdateSettings(DEFAULT_TERMINAL_SETTINGS);
  };

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isQuickThemeMenuOpen, setIsQuickThemeMenuOpen] = useState(false);
  const quickMenuRef = useRef<HTMLDivElement>(null);

  // Close quick menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        quickMenuRef.current &&
        !quickMenuRef.current.contains(e.target as Node)
      ) {
        setIsQuickThemeMenuOpen(false);
      }
    };
    if (isQuickThemeMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isQuickThemeMenuOpen]);

  const currentTheme =
    TERMINAL_THEMES[activeSettings.themeId] || TERMINAL_THEMES["replit-dark"];

  const [inputVal, setInputVal] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new lines arrive (in console tab)
  useEffect(() => {
    if (currentTab === "console") {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [lines, statusMessage, currentTab]);

  // Find if there is an error in the last lines
  const lastErrorLine = [...lines].reverse().find((l) => l.type === "stderr");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    setHistory((prev) => [...prev, cmd]);
    setHistoryIdx(-1);
    setInputVal("");
    onExecuteCommand(cmd);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(nextIdx);
      setInputVal(history[nextIdx] || "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx === -1) return;
      const nextIdx = historyIdx + 1;
      if (nextIdx >= history.length) {
        setHistoryIdx(-1);
        setInputVal("");
      } else {
        setHistoryIdx(nextIdx);
        setInputVal(history[nextIdx] || "");
      }
    }
  };

  const handleCopy = () => {
    const text = lines.map((l) => l.text).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Font size class mapping
  const fontSizeClass =
    activeSettings.fontSize === "xs"
      ? "text-[11px]"
      : activeSettings.fontSize === "base"
      ? "text-[13.5px]"
      : "text-xs";

  // Line height class mapping
  const lineHeightClass =
    activeSettings.lineHeight === "compact"
      ? "leading-tight"
      : activeSettings.lineHeight === "relaxed"
      ? "leading-loose"
      : "leading-relaxed";

  return (
    <div
      style={{
        backgroundColor: currentTheme.colors.bg,
        borderColor: currentTheme.colors.border,
      }}
      className={`relative flex flex-col h-full border-t font-mono ${fontSizeClass} overflow-hidden select-text transition-colors duration-200`}
    >
      {/* Optional CRT Scanlines Overlay for retro feel */}
      {activeSettings.crtGlow && (
        <div
          className="pointer-events-none absolute inset-0 z-20 terminal-crt-scanlines opacity-70"
          style={{ mixBlendMode: "overlay" }}
        />
      )}

      {/* Terminal Toolbar with Tabs & Settings */}
      <div
        style={{
          backgroundColor: currentTheme.colors.toolbarBg,
          borderColor: currentTheme.colors.toolbarBorder,
        }}
        className="h-8.5 border-b px-2 flex items-center justify-between select-none shrink-0 relative z-30 transition-colors duration-200"
      >
        {/* Left: Tab Switcher (Console / Problèmes) */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleSetTab("console")}
            style={{
              backgroundColor:
                currentTab === "console" ? currentTheme.colors.tabActiveBg : "transparent",
              color:
                currentTab === "console"
                  ? currentTheme.colors.tabActiveText
                  : currentTheme.colors.tabInactiveText,
              borderColor:
                currentTab === "console"
                  ? currentTheme.colors.tabActiveBorder
                  : "transparent",
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition cursor-pointer border"
          >
            <TerminalIcon
              className="w-3.5 h-3.5"
              style={{ color: currentTheme.colors.promptUser }}
            />
            <span>Console</span>
            {isRunning && (
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse ml-0.5" />
            )}
          </button>

          <button
            onClick={() => handleSetTab("problems")}
            style={{
              backgroundColor:
                currentTab === "problems" ? currentTheme.colors.tabActiveBg : "transparent",
              color:
                currentTab === "problems"
                  ? currentTheme.colors.tabActiveText
                  : currentTheme.colors.tabInactiveText,
              borderColor:
                currentTab === "problems"
                  ? currentTheme.colors.tabActiveBorder
                  : "transparent",
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition cursor-pointer border"
          >
            <AlertTriangle
              className={`w-3.5 h-3.5 ${
                problems.length > 0 ? "text-red-400 animate-pulse" : "text-gray-400"
              }`}
            />
            <span>Problèmes</span>
            {problems.length > 0 ? (
              <span className="px-1.5 py-0.2 text-[9.5px] font-bold font-mono rounded-full bg-red-950/80 text-red-300 border border-red-700/60 ml-0.5">
                {problems.length}
              </span>
            ) : (
              <span className="text-[9.5px] text-gray-500 font-mono ml-0.5">0</span>
            )}
          </button>
        </div>

        {/* Right: Actions, Theme Switcher & Settings */}
        <div className="flex items-center gap-1.5">
          {/* Quick open Artifact button */}
          {onOpenArtifact && (
            <button
              onClick={onOpenArtifact}
              title="Visualiser le résultat complet dans l'Artefact (Graphiques & Rendu)"
              className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-gradient-to-r from-amber-950/70 to-orange-950/70 hover:from-amber-900/90 hover:to-orange-900/90 text-amber-300 border border-amber-700/60 rounded shadow transition active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Artefact</span>
            </button>
          )}

          {/* Debug with AI button if an error occurred */}
          {lastErrorLine && currentTab === "console" && (
            <button
              onClick={() => onDebugErrorWithAI(lastErrorLine.text)}
              title="Analyser et réparer l'erreur avec l'IA"
              className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-red-950/70 hover:bg-red-900/90 text-red-200 border border-red-700/60 rounded shadow transition active:scale-95 cursor-pointer"
            >
              <Bug className="w-3 h-3 text-red-400" />
              <span className="hidden sm:inline">Corriger avec l'IA</span>
            </button>
          )}

          {/* Quick Theme Switcher & Settings Button */}
          <div className="relative" ref={quickMenuRef}>
            <div className="flex items-center rounded-md border" style={{ borderColor: currentTheme.colors.toolbarBorder }}>
              {/* Click Theme Button -> Quick Picker */}
              <button
                type="button"
                onClick={() => setIsQuickThemeMenuOpen(!isQuickThemeMenuOpen)}
                title={`Thème actif : ${currentTheme.name}. Cliquez pour changer rapidement.`}
                className="flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-l-md transition cursor-pointer"
                style={{
                  backgroundColor: currentTheme.colors.inputBg,
                  color: currentTheme.colors.stdout,
                }}
              >
                <Palette
                  className="w-3.5 h-3.5"
                  style={{ color: currentTheme.colors.promptUser }}
                />
                <span className="hidden sm:inline font-mono font-semibold">
                  {currentTheme.name}
                </span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {/* Settings Gear Button -> Opens Full Settings Modal */}
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(true)}
                title="Ouvrir les paramètres complets du terminal"
                className="p-1 rounded-r-md border-l transition cursor-pointer hover:opacity-80"
                style={{
                  backgroundColor: currentTheme.colors.inputBg,
                  borderColor: currentTheme.colors.toolbarBorder,
                  color: currentTheme.colors.tabInactiveText,
                }}
              >
                <Sliders className="w-3 h-3" />
              </button>
            </div>

            {/* Quick Theme Dropdown Menu */}
            {isQuickThemeMenuOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-56 rounded-lg shadow-2xl border p-1 z-50 animate-in fade-in zoom-in-95 duration-150"
                style={{
                  backgroundColor: currentTheme.colors.toolbarBg,
                  borderColor: currentTheme.colors.toolbarBorder,
                }}
              >
                <div className="px-2 py-1.5 border-b text-[10.5px] font-bold uppercase tracking-wider flex items-center justify-between"
                  style={{
                    borderColor: currentTheme.colors.toolbarBorder,
                    color: currentTheme.colors.tabInactiveText,
                  }}
                >
                  <span>Thèmes de Couleurs</span>
                  <button
                    onClick={() => {
                      setIsQuickThemeMenuOpen(false);
                      setIsSettingsModalOpen(true);
                    }}
                    className="text-blue-400 hover:underline cursor-pointer lowercase font-normal"
                  >
                    + options
                  </button>
                </div>

                <div className="py-1 max-h-56 overflow-y-auto space-y-0.5">
                  {Object.values(TERMINAL_THEMES).map((theme) => {
                    const isSelected = theme.id === activeSettings.themeId;
                    return (
                      <button
                        key={theme.id}
                        onClick={() => {
                          const shouldEnableCrt =
                            theme.crtEffectRecommended && !activeSettings.crtGlow;
                          handleUpdateSettings({
                            ...activeSettings,
                            themeId: theme.id,
                            crtGlow: shouldEnableCrt ? true : activeSettings.crtGlow,
                          });
                          setIsQuickThemeMenuOpen(false);
                        }}
                        className={`w-full px-2 py-1.5 rounded text-left text-xs flex items-center justify-between transition cursor-pointer ${
                          isSelected
                            ? "bg-blue-600/20 text-blue-300 font-bold"
                            : "hover:bg-white/5 text-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {/* Color dot */}
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/40"
                            style={{ backgroundColor: theme.colors.promptUser }}
                          />
                          <span className="font-mono text-[11px]">{theme.name}</span>
                        </div>

                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-blue-400" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-1 border-t text-center" style={{ borderColor: currentTheme.colors.toolbarBorder }}>
                  <button
                    onClick={() => {
                      setIsQuickThemeMenuOpen(false);
                      setIsSettingsModalOpen(true);
                    }}
                    className="w-full py-1 text-[10.5px] text-gray-400 hover:text-white flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Sliders className="w-3 h-3 text-blue-400" />
                    <span>Tous les paramètres (police, curseur, CRT)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {currentTab === "console" && (
            <>
              <button
                onClick={handleCopy}
                title="Copier la sortie de la console"
                style={{ color: currentTheme.colors.tabInactiveText }}
                className="p-1 hover:opacity-80 rounded transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={onClear}
                title="Effacer la console (clear)"
                style={{ color: currentTheme.colors.tabInactiveText }}
                className="p-1 hover:opacity-80 rounded transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* View 1: Problems Tab */}
      {currentTab === "problems" ? (
        <div className="flex-1 p-3 overflow-y-auto space-y-2 select-text relative z-10">
          {/* Problems Header */}
          <div
            className="flex items-center justify-between pb-2 border-b"
            style={{ borderColor: currentTheme.colors.toolbarBorder }}
          >
            <div className="flex items-center gap-2">
              <span
                className="font-medium text-[11.5px]"
                style={{ color: currentTheme.colors.stdout }}
              >
                Erreurs de syntaxe & avertissements en temps réel
              </span>
              <span className="text-[10px] text-gray-500">
                (Linter instantané Python, JS, HTML, JSON)
              </span>
            </div>
            <div className="text-[11px]">
              {problems.length === 0 ? (
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  0 problème détecté
                </span>
              ) : (
                <span className="text-red-400 font-semibold font-mono">
                  {problems.length} {problems.length > 1 ? "problèmes détectés" : "problème détecté"}
                </span>
              )}
            </div>
          </div>

          {/* Empty state */}
          {problems.length === 0 && (
            <div className="py-8 flex flex-col items-center justify-center text-center text-gray-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/80 mb-2" />
              <p
                className="text-xs font-semibold"
                style={{ color: currentTheme.colors.stdout }}
              >
                Aucun problème de syntaxe détecté !
              </p>
              <p className="text-gray-500 text-[11px] mt-1 max-w-sm">
                Votre code s'exécute correctement et respecte la grammaire du langage. Les erreurs détectées en temps réel apparaîtront ici.
              </p>
            </div>
          )}

          {/* List of detected problems */}
          {problems.map((prob) => (
            <div
              key={prob.id}
              onClick={() => onNavigateToProblem?.(prob.fileId, prob.line, prob.column)}
              style={{
                backgroundColor: currentTheme.colors.inputBg,
                borderColor: currentTheme.colors.inputBorder,
              }}
              className="group p-2.5 rounded-lg border hover:border-red-500/50 transition cursor-pointer shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex items-center gap-1.5 font-sans">
                    <FileLanguageIcon fileName={prob.fileName} className="w-3.5 h-3.5 shrink-0" />
                    <span
                      className="font-semibold text-xs"
                      style={{ color: currentTheme.colors.stdout }}
                    >
                      {prob.fileName}
                    </span>
                    <span className="text-gray-500 text-xs">:</span>
                    <span className="font-mono text-red-300 font-bold text-xs">
                      Ligne {prob.line}, Col {prob.column}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-red-950/70 text-red-300 border border-red-800/40">
                    {prob.severity}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDebugErrorWithAI(prob.message);
                    }}
                    title="Demander à l'IA de réparer"
                    className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] text-purple-300 hover:text-white bg-purple-950/60 hover:bg-purple-900/80 px-2 py-0.5 rounded border border-purple-800/50 transition cursor-pointer"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                    <span>Réparer</span>
                  </button>
                </div>
              </div>

              {/* Error Message */}
              <div className="mt-1.5 ml-6 text-red-200 text-[11.5px] leading-relaxed font-mono">
                {prob.message}
              </div>

              {/* Code Snippet Preview with Caret Pointer */}
              {prob.codeSnippet && (
                <div
                  className="mt-2 ml-6 p-2 rounded border font-mono text-[11px] overflow-x-auto"
                  style={{
                    backgroundColor: currentTheme.colors.bg,
                    borderColor: currentTheme.colors.border,
                    color: currentTheme.colors.stdout,
                  }}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 select-none">{prob.line} |</span>
                    <span className="whitespace-pre">{prob.codeSnippet}</span>
                  </div>
                  {/* Caret pointing to error column */}
                  <div className="flex items-start gap-2 text-red-500 select-none">
                    <span className="invisible">{prob.line} |</span>
                    <span className="whitespace-pre font-bold">
                      {" ".repeat(Math.max(0, prob.column - 1)) + "^"}
                    </span>
                  </div>
                </div>
              )}

              {/* Suggestion */}
              {prob.suggestion && (
                <div className="mt-1.5 ml-6 text-[11px] text-amber-300/90 flex items-center gap-1">
                  <span className="text-amber-400">💡</span>
                  <span>{prob.suggestion}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* View 2: Console Tab */
        <>
          <div
            onClick={() => inputRef.current?.focus()}
            className={`flex-1 p-3 overflow-y-auto space-y-1 cursor-text relative z-10 ${lineHeightClass}`}
            style={{
              textShadow: activeSettings.crtGlow
                ? `0 0 3px ${currentTheme.colors.promptUser}55`
                : undefined,
            }}
          >
            {lines.length === 0 && (
              <div
                className="text-[11px] leading-relaxed select-none opacity-80"
                style={{ color: currentTheme.colors.tabInactiveText }}
              >
                RepliLite Shell v1.0 [Thème: {currentTheme.name} | WebAssembly Python 3 & JS Engine]
                <br />
                Tapez <span className="font-semibold underline">run</span> ou cliquez sur le bouton vert en haut pour démarrer.
                <br />
                Tapez <span className="font-semibold underline">theme</span> pour changer l'ambiance de couleurs (Dracula, Retro, Solarized...).
                <br />
                Tapez <span className="font-semibold underline">help</span> pour afficher toutes les commandes.
              </div>
            )}

            {lines.map((line) => {
              let style: React.CSSProperties = {
                color: currentTheme.colors.stdout,
              };
              let containerClass = "break-words whitespace-pre-wrap";

              switch (line.type) {
                case "stdin":
                  style = {
                    color: currentTheme.colors.stdin,
                    fontWeight: 600,
                  };
                  break;
                case "stderr":
                  style = {
                    color: currentTheme.colors.stderr,
                    backgroundColor: currentTheme.colors.stderrBg,
                  };
                  containerClass += " px-1.5 py-0.5 rounded";
                  break;
                case "info":
                  style = {
                    color: currentTheme.colors.info,
                  };
                  break;
                case "system":
                  style = {
                    color: currentTheme.colors.system,
                  };
                  break;
                case "ai":
                  style = {
                    color: currentTheme.colors.ai,
                    backgroundColor: currentTheme.colors.aiBg,
                    borderColor: currentTheme.colors.aiBorder,
                  };
                  containerClass += " p-2 rounded border";
                  break;
                case "stdout":
                default:
                  style = {
                    color: currentTheme.colors.stdout,
                  };
                  break;
              }

              return (
                <div key={line.id} style={style} className={containerClass}>
                  {line.text}
                </div>
              );
            })}

            {/* Temporary status message (e.g. Loading Pyodide...) */}
            {statusMessage && (
              <div
                style={{ color: currentTheme.colors.system }}
                className="animate-pulse text-[11px] py-0.5"
              >
                ⚙ {statusMessage}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Interactive Command Input Line */}
          <form
            onSubmit={handleSubmit}
            style={{
              backgroundColor: currentTheme.colors.inputBg,
              borderColor: currentTheme.colors.inputBorder,
            }}
            className="px-3 py-2 border-t flex items-center gap-2 shrink-0 relative z-10 transition-colors duration-200"
          >
            <span className="font-semibold select-none flex items-center gap-1 shrink-0">
              <span style={{ color: currentTheme.colors.promptUser }}>repl@replilite</span>
              <span style={{ color: currentTheme.colors.promptSymbol }}>:</span>
              <span style={{ color: currentTheme.colors.promptPath }}>~</span>
              <span style={{ color: currentTheme.colors.promptSymbol }}>$</span>
            </span>
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="ex: run, theme dracula, theme retro, lint, ls, help"
              style={{
                color: currentTheme.colors.stdout,
              }}
              className="flex-1 bg-transparent focus:outline-none placeholder-gray-500/60"
            />
            {/* Dynamic Cursor based on user settings */}
            <span
              className={`terminal-cursor terminal-cursor-${activeSettings.cursorStyle}`}
              style={
                {
                  "--terminal-cursor-color": currentTheme.colors.cursorColor,
                  backgroundColor: currentTheme.colors.cursorColor,
                } as React.CSSProperties
              }
            />
          </form>
        </>
      )}

      {/* Terminal Settings & Themes Modal */}
      <TerminalSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={activeSettings}
        onUpdateSettings={handleUpdateSettings}
        onResetSettings={handleResetSettings}
        onOpenGlobalSettings={onOpenGlobalSettings}
      />
    </div>
  );
};
