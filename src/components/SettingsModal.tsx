import React, { useState, useMemo } from "react";
import {
  X,
  Settings,
  Cpu,
  Palette,
  Terminal as TerminalIcon,
  Keyboard,
  Shield,
  Info,
  Check,
  Search,
  Sparkles,
  Zap,
  RotateCcw,
  ExternalLink,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Type,
  Code2,
  Tv,
  Radio,
  FileCode,
  KeyRound,
  Eye,
  EyeOff,
  Flame,
  Bot,
  Save,
  Globe
} from "lucide-react";
import { AIProvider } from "../types";
import {
  TERMINAL_THEMES,
  TerminalThemeId,
  TerminalSettings,
  DEFAULT_TERMINAL_SETTINGS
} from "../utils/terminalThemes";

export type SettingsTabId =
  | "ai"
  | "free-ai"
  | "editor"
  | "terminal"
  | "agent"
  | "shortcuts"
  | "env"
  | "workspace"
  | "about";

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiProvider: AIProvider;
  onChangeAIProvider: (provider: AIProvider) => void;
  hfToken: string;
  onChangeHfToken: (token: string) => void;
  localUrl: string;
  onChangeLocalUrl: (url: string) => void;
  localModel: string;
  onChangeLocalModel: (model: string) => void;
  terminalSettings: TerminalSettings;
  onUpdateTerminalSettings: (settings: TerminalSettings) => void;
  userName?: string;
  onChangeUserName?: (name: string) => void;
  initialTab?: SettingsTabId;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  aiProvider,
  onChangeAIProvider,
  hfToken,
  onChangeHfToken,
  localUrl,
  onChangeLocalUrl,
  localModel,
  onChangeLocalModel,
  terminalSettings,
  onUpdateTerminalSettings,
  userName = "maestro",
  onChangeUserName,
  initialTab = "ai",
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTabId>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [testStatus, setTestStatus] = useState<{
    loading: boolean;
    ok?: boolean;
    message?: string;
  }>({ loading: false });

  // Custom editor settings with local persistence
  const [editorFontSize, setEditorFontSize] = useState<number>(() => {
    const saved = localStorage.getItem("replilite_editor_font_size");
    return saved ? Number(saved) : 13.5;
  });
  const [editorFontFamily, setEditorFontFamily] = useState<string>(() => {
    return localStorage.getItem("replilite_editor_font_family") || "Fira Code";
  });
  const [tabSize, setTabSize] = useState<number>(() => {
    const saved = localStorage.getItem("replilite_editor_tab_size");
    return saved ? Number(saved) : 2;
  });
  const [autoCloseBrackets, setAutoCloseBrackets] = useState<boolean>(() => {
    const saved = localStorage.getItem("replilite_auto_close_brackets");
    return saved !== null ? saved === "true" : true;
  });
  const [wordWrap, setWordWrap] = useState<boolean>(() => {
    const saved = localStorage.getItem("replilite_word_wrap");
    return saved !== null ? saved === "true" : true;
  });
  const [aiPersonality, setAiPersonality] = useState<string>(() => {
    return localStorage.getItem("replilite_ai_personality") || "claude-code";
  });
  const [customSystemPrompt, setCustomSystemPrompt] = useState<string>(() => {
    return (
      localStorage.getItem("replilite_custom_system_prompt") ||
      "Tu es un ingénieur logiciel senior et pair-programmer expert. Sois concis, pragmatique, et fournis du code propre, direct et exécutable."
    );
  });

  // Env variables settings state
  const [showEnvSecrets, setShowEnvSecrets] = useState(false);
  const [envGeminiKey, setEnvGeminiKey] = useState<string>(() => {
    return localStorage.getItem("replilite_env_gemini_key") || "";
  });
  const [envHfKey, setEnvHfKey] = useState<string>(() => {
    return localStorage.getItem("replilite_env_hf_token") || hfToken || "";
  });
  const [envSavedNotification, setEnvSavedNotification] = useState(false);

  const handleUpdateEditorFontSize = (size: number) => {
    setEditorFontSize(size);
    localStorage.setItem("replilite_editor_font_size", String(size));
  };

  const handleUpdateEditorFontFamily = (font: string) => {
    setEditorFontFamily(font);
    localStorage.setItem("replilite_editor_font_family", font);
  };

  const handleUpdateTabSize = (size: number) => {
    setTabSize(size);
    localStorage.setItem("replilite_editor_tab_size", String(size));
  };

  const handleToggleAutoClose = () => {
    const next = !autoCloseBrackets;
    setAutoCloseBrackets(next);
    localStorage.setItem("replilite_auto_close_brackets", String(next));
  };

  const handleToggleWordWrap = () => {
    const next = !wordWrap;
    setWordWrap(next);
    localStorage.setItem("replilite_word_wrap", String(next));
  };

  const handleUpdateAiPersonality = (persona: string) => {
    setAiPersonality(persona);
    localStorage.setItem("replilite_ai_personality", persona);
  };

  const handleSaveCustomPrompt = () => {
    localStorage.setItem("replilite_custom_system_prompt", customSystemPrompt);
  };

  const handleSaveEnvVars = () => {
    localStorage.setItem("replilite_env_gemini_key", envGeminiKey);
    localStorage.setItem("replilite_env_hf_token", envHfKey);
    if (envHfKey) {
      onChangeHfToken(envHfKey);
    }
    setEnvSavedNotification(true);
    setTimeout(() => setEnvSavedNotification(false), 2500);
  };

  const handleTestConnection = async (targetProvider?: AIProvider) => {
    const providerToTest = targetProvider || aiProvider;
    setTestStatus({ loading: true });
    try {
      const res = await fetch("/api/ai/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: providerToTest,
          url: localUrl,
          model: localModel,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setTestStatus({ loading: false, ok: true, message: data.message });
      } else {
        setTestStatus({
          loading: false,
          ok: false,
          message: data.error || data.message || "Erreur de connexion",
        });
      }
    } catch (e: any) {
      setTestStatus({
        loading: false,
        ok: false,
        message: e?.message || "Erreur réseau",
      });
    }
  };

  // Keyboard shortcut for closing modal with Escape
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Search filter helper
  const matchesSearch = (text: string) => {
    if (!searchQuery.trim()) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase().trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-5 select-none animate-in fade-in duration-150">
      <div className="bg-[#121620] border border-[#263142] rounded-2xl w-full max-w-5xl h-[88vh] shadow-2xl overflow-hidden flex flex-col text-xs text-gray-200">
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-[#212b3b] flex items-center justify-between bg-[#0e121a] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#f26207] to-[#ff8433] flex items-center justify-center text-white shadow-md shadow-orange-950/40">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-white">Paramètres de l'IDE</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-950/80 text-orange-300 border border-orange-700/50">
                  Claude Code & Hermes Agent
                </span>
                <span className="hidden sm:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">
                  Clixad.io Actif
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Configurez l'IA, les modèles gratuits, les thèmes, l'éditeur et l'agent autonome.
              </p>
            </div>
          </div>

          {/* Search bar inside header */}
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher (clixad, police, theme, claude)..."
                className="bg-[#18202d] text-gray-200 text-xs pl-8 pr-3 py-1.5 rounded-lg border border-[#2b3548] focus:outline-none focus:border-[#f26207] w-64"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-2 text-gray-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              title="Fermer les paramètres (Échap)"
              className="p-1.5 rounded-lg hover:bg-[#1e2534] text-gray-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Left Sidebar Tabs + Right Scrollable Panel */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left Navigation Tabs (IDE Style) */}
          <aside className="w-56 sm:w-60 bg-[#0e1219] border-r border-[#202938] flex flex-col justify-between p-2.5 shrink-0 select-none overflow-y-auto">
            <div className="space-y-1">
              <div className="px-2.5 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Intelligence Artificielle
              </div>

              {/* Tab 1: AI & Models */}
              <button
                onClick={() => setActiveTab("ai")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeTab === "ai"
                    ? "bg-[#1f2838] text-white border border-[#303f58] shadow-xs"
                    : "text-gray-400 hover:text-gray-200 hover:bg-[#151c27]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-purple-400" />
                  <span>Modèles & IA</span>
                </div>
                {aiProvider === "clixad" ? (
                  <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded font-mono border border-emerald-800">
                    Clixad
                  </span>
                ) : (
                  <span className="text-[9px] text-gray-500 font-mono">
                    {aiProvider}
                  </span>
                )}
              </button>

              {/* Tab 2: Free AI List (Clixad.io focus) */}
              <button
                onClick={() => setActiveTab("free-ai")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeTab === "free-ai"
                    ? "bg-[#162720] text-emerald-300 border border-emerald-600/50 shadow-xs"
                    : "text-emerald-400/80 hover:text-emerald-300 hover:bg-[#151c27]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-semibold">⚡ IA Gratuites (Clixad)</span>
                </div>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                  FREE
                </span>
              </button>

              {/* Tab 3: Agent Behavior & Persona */}
              <button
                onClick={() => setActiveTab("agent")}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeTab === "agent"
                    ? "bg-[#1f2838] text-white border border-[#303f58] shadow-xs"
                    : "text-gray-400 hover:text-gray-200 hover:bg-[#151c27]"
                }`}
              >
                <Bot className="w-3.5 h-3.5 text-orange-400" />
                <span>Agent Claude & Hermes</span>
              </button>

              <div className="px-2.5 pt-3 pb-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Espace de Travail
              </div>

              {/* Tab 4: Code Editor */}
              <button
                onClick={() => setActiveTab("editor")}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeTab === "editor"
                    ? "bg-[#1f2838] text-white border border-[#303f58] shadow-xs"
                    : "text-gray-400 hover:text-gray-200 hover:bg-[#151c27]"
                }`}
              >
                <Code2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Éditeur de Code</span>
              </button>

              {/* Tab 5: Terminal & Themes */}
              <button
                onClick={() => setActiveTab("terminal")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeTab === "terminal"
                    ? "bg-[#1f2838] text-white border border-[#303f58] shadow-xs"
                    : "text-gray-400 hover:text-gray-200 hover:bg-[#151c27]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Terminal & Thèmes</span>
                </div>
                <span className="text-[9px] text-gray-500 font-mono">
                  {terminalSettings.themeId}
                </span>
              </button>

              {/* Tab 6: Keyboard Shortcuts */}
              <button
                onClick={() => setActiveTab("shortcuts")}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeTab === "shortcuts"
                    ? "bg-[#1f2838] text-white border border-[#303f58] shadow-xs"
                    : "text-gray-400 hover:text-gray-200 hover:bg-[#151c27]"
                }`}
              >
                <Keyboard className="w-3.5 h-3.5 text-amber-400" />
                <span>Raccourcis Clavier</span>
              </button>

              {/* Tab 7: Environment Variables */}
              <button
                onClick={() => setActiveTab("env")}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeTab === "env"
                    ? "bg-[#1f2838] text-white border border-[#303f58] shadow-xs"
                    : "text-gray-400 hover:text-gray-200 hover:bg-[#151c27]"
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                <span>Secrets & Clés (.env)</span>
              </button>

              {/* Tab 8: Workspace & Profile */}
              <button
                onClick={() => setActiveTab("workspace")}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeTab === "workspace"
                    ? "bg-[#1f2838] text-white border border-[#303f58] shadow-xs"
                    : "text-gray-400 hover:text-gray-200 hover:bg-[#151c27]"
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-teal-400" />
                <span>Workspace & Profil</span>
              </button>

              {/* Tab 9: About */}
              <button
                onClick={() => setActiveTab("about")}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeTab === "about"
                    ? "bg-[#1f2838] text-white border border-[#303f58] shadow-xs"
                    : "text-gray-400 hover:text-gray-200 hover:bg-[#151c27]"
                }`}
              >
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                <span>À propos & Versions</span>
              </button>
            </div>

            {/* Quick Status Pill */}
            <div className="p-3 rounded-xl bg-[#141a24] border border-[#212b3c] text-[11px] space-y-1.5 mt-2">
              <div className="font-semibold text-gray-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Moteur Actif</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  {aiProvider === "clixad" ? "Clixad.io" : aiProvider}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 leading-tight">
                Mode Claude Code + Hermes Agent avec terminal interactif.
              </p>
            </div>
          </aside>

          {/* Right Main Content Panel */}
          <main className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-6 bg-[#121620]">
            {/* ===================== TAB: FREE AI LIST (CLIXAD FOCUS) ===================== */}
            {activeTab === "free-ai" && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-400" />
                      <span>Liste des IA Gratuites & Modèles Sans Clé</span>
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Accédez instantanément aux meilleures IA de développement sans carte bancaire ni clé API requise.
                    </p>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-mono text-[10px] font-bold">
                    6 Modèles Disponibles
                  </span>
                </div>

                {/* Spotlight Banner: Clixad.io (Newest & Featured) */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 via-[#102018] to-[#121620] border-2 border-emerald-500/60 shadow-xl space-y-3.5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-black font-black text-lg shadow-lg">
                        ⚡
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-base text-white">
                            Clixad.io Free AI
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-black font-black text-[10px] tracking-wide">
                            100% GRATUIT
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold text-[9px]">
                            NOUVEAU
                          </span>
                        </div>
                        <p className="text-xs text-emerald-200/90 mt-0.5">
                          Passerelle d'inférence de pointe pour le code sans aucune restriction d'utilisation.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onChangeAIProvider("clixad");
                        handleTestConnection("clixad");
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md ${
                        aiProvider === "clixad"
                          ? "bg-emerald-500 text-black ring-2 ring-emerald-300 ring-offset-2 ring-offset-black"
                          : "bg-emerald-600/90 hover:bg-emerald-500 text-white"
                      }`}
                    >
                      {aiProvider === "clixad" ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Actif comme IA par défaut</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 fill-current" />
                          <span>Activer Clixad.io</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed relative z-10">
                    <strong>Clixad.io</strong> permet de générer, corriger, expliquer et compléter votre code à grande vitesse sans créer de compte, sans clé API et sans frais. Entièrement compatible avec le terminal interactif, le chatbot Gemini/Clixad et Ghostwriter.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 relative z-10">
                    <div className="p-2.5 rounded-lg bg-black/40 border border-emerald-900/50">
                      <div className="text-[10px] text-gray-400">Tarification</div>
                      <div className="font-bold text-xs text-emerald-300">Gratuit à vie</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/40 border border-emerald-900/50">
                      <div className="text-[10px] text-gray-400">Clé d'API</div>
                      <div className="font-bold text-xs text-emerald-300">Non requise</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/40 border border-emerald-900/50">
                      <div className="text-[10px] text-gray-400">Latence estimée</div>
                      <div className="font-bold text-xs text-emerald-300">&lt; 200 ms</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/40 border border-emerald-900/50">
                      <div className="text-[10px] text-gray-400">Spécialisation</div>
                      <div className="font-bold text-xs text-emerald-300">Code & Refactor</div>
                    </div>
                  </div>
                </div>

                {/* All Free AI Options List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Toutes les solutions d'IA Gratuites intégrées
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* 1. Clixad.io */}
                    <div
                      className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                        aiProvider === "clixad"
                          ? "bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/50"
                          : "bg-[#151b26] border-[#252f40] hover:border-gray-500"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <span>⚡ Clixad.io</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                              Gratuit
                            </span>
                          </span>
                          {aiProvider === "clixad" && (
                            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                              <Check className="w-3 h-3" /> Sélectionné
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 leading-snug">
                          Inférence ultra-rapide gratuite sans aucune clé API requise. Optimisé pour Python, JS, HTML et TypeScript.
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-[#222b3b] flex items-center justify-between">
                        <span className="text-[10px] text-gray-500 font-mono">api.clixad.io</span>
                        <button
                          type="button"
                          onClick={() => onChangeAIProvider("clixad")}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] cursor-pointer"
                        >
                          Choisir Clixad
                        </button>
                      </div>
                    </div>

                    {/* 2. Google Gemini 3.8 Flash (Free tier) */}
                    <div
                      className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                        aiProvider === "gemini"
                          ? "bg-purple-950/40 border-purple-500 ring-1 ring-purple-500/50"
                          : "bg-[#151b26] border-[#252f40] hover:border-gray-500"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <span>Google Gemini 3.8 Flash</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                              Google AI
                            </span>
                          </span>
                          {aiProvider === "gemini" && (
                            <span className="text-[10px] text-purple-400 font-semibold flex items-center gap-1">
                              <Check className="w-3 h-3" /> Sélectionné
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 leading-snug">
                          Modèle officiel Google AI Studio. Analyse multi-fichiers, explications détaillées et détection de bugs complexe.
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-[#222b3b] flex items-center justify-between">
                        <span className="text-[10px] text-gray-500 font-mono">gemini-3.8-flash</span>
                        <button
                          type="button"
                          onClick={() => onChangeAIProvider("gemini")}
                          className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-semibold text-[11px] cursor-pointer"
                        >
                          Choisir Gemini
                        </button>
                      </div>
                    </div>

                    {/* 3. FreeLLM Community API */}
                    <div
                      className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                        aiProvider === "freellm"
                          ? "bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/50"
                          : "bg-[#151b26] border-[#252f40] hover:border-gray-500"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <span>FreeLLM API Gateway</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                              Libre
                            </span>
                          </span>
                          {aiProvider === "freellm" && (
                            <span className="text-[10px] text-teal-400 font-semibold flex items-center gap-1">
                              <Check className="w-3 h-3" /> Sélectionné
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 leading-snug">
                          Routeur libre sans clé API avec basculement automatique et résilience en cas de coupure de réseau.
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-[#222b3b] flex items-center justify-between">
                        <span className="text-[10px] text-gray-500 font-mono">pollinations.ai</span>
                        <button
                          type="button"
                          onClick={() => onChangeAIProvider("freellm")}
                          className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white font-semibold text-[11px] cursor-pointer"
                        >
                          Choisir FreeLLM
                        </button>
                      </div>
                    </div>

                    {/* 4. Ollama (100% Localhost & Gratuit) */}
                    <div
                      className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                        aiProvider === "ollama"
                          ? "bg-blue-950/40 border-blue-500 ring-1 ring-blue-500/50"
                          : "bg-[#151b26] border-[#252f40] hover:border-gray-500"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <span>🦙 Ollama Local</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                              Hors-Ligne
                            </span>
                          </span>
                          {aiProvider === "ollama" && (
                            <span className="text-[10px] text-blue-400 font-semibold flex items-center gap-1">
                              <Check className="w-3 h-3" /> Sélectionné
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 leading-snug">
                          Exécutez qwen2.5-coder ou llama3 directement sur votre machine sans envoyer aucune donnée dans le cloud.
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-[#222b3b] flex items-center justify-between">
                        <span className="text-[10px] text-gray-500 font-mono">localhost:11434</span>
                        <button
                          type="button"
                          onClick={() => onChangeAIProvider("ollama")}
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] cursor-pointer"
                        >
                          Choisir Ollama
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===================== TAB: ALL AI & MODELS ===================== */}
            {activeTab === "ai" && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-purple-400" />
                      <span>Fournisseurs d'Intelligence Artificielle</span>
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Sélectionnez l'IA active pour le chat, le terminal (`ai &lt;question&gt;`) et Ghostwriter.
                    </p>
                  </div>
                </div>

                {/* AI Providers Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Clixad.io */}
                  <button
                    type="button"
                    onClick={() => onChangeAIProvider("clixad")}
                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer relative ${
                      aiProvider === "clixad"
                        ? "bg-emerald-950/40 border-emerald-500 shadow-md ring-1 ring-emerald-500/50"
                        : "bg-[#151b26] border-[#252f40] hover:border-gray-500 text-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-white">
                            ⚡ Clixad.io
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                            100% GRATUIT
                          </span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-blue-500/20 text-blue-300 font-bold">
                            NOUVEAU
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                          Plateforme IA gratuite haute vitesse. Sans carte ni clé API requise, optimisée pour le code.
                        </p>
                      </div>
                      {aiProvider === "clixad" && (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Google Gemini */}
                  <button
                    type="button"
                    onClick={() => onChangeAIProvider("gemini")}
                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer relative ${
                      aiProvider === "gemini"
                        ? "bg-purple-950/40 border-purple-500 shadow-md ring-1 ring-purple-500/50"
                        : "bg-[#151b26] border-[#252f40] hover:border-gray-500 text-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-white">
                            Google Gemini 3.8 Flash
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40">
                            RECOMMANDÉ
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                          Modèle officiel Google AI Studio. Rapide, précis, idéal pour expliquer et réparer les erreurs.
                        </p>
                      </div>
                      {aiProvider === "gemini" && (
                        <div className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </button>

                  {/* FreeLLM */}
                  <button
                    type="button"
                    onClick={() => onChangeAIProvider("freellm")}
                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer relative ${
                      aiProvider === "freellm"
                        ? "bg-teal-950/40 border-teal-500 shadow-md ring-1 ring-teal-500/50"
                        : "bg-[#151b26] border-[#252f40] hover:border-gray-500 text-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-white">
                            ✨ FreeLLM API
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 font-bold border border-teal-500/40">
                            GRATUIT
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                          Passerelle communautaire libre sans clé API avec basculement automatique.
                        </p>
                      </div>
                      {aiProvider === "freellm" && (
                        <div className="w-5 h-5 rounded-full bg-teal-500 text-black flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Hugging Face */}
                  <button
                    type="button"
                    onClick={() => onChangeAIProvider("huggingface")}
                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer relative ${
                      aiProvider === "huggingface"
                        ? "bg-amber-950/40 border-amber-500 shadow-md ring-1 ring-amber-500/50"
                        : "bg-[#151b26] border-[#252f40] hover:border-gray-500 text-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-white">
                            🤗 Hugging Face Inference
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                            OPEN SOURCE
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                          Modèles ouverts (Qwen 2.5 Coder, Llama 3) via votre token HF optionnel.
                        </p>
                      </div>
                      {aiProvider === "huggingface" && (
                        <div className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Ollama Local */}
                  <button
                    type="button"
                    onClick={() => onChangeAIProvider("ollama")}
                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer relative ${
                      aiProvider === "ollama"
                        ? "bg-blue-950/40 border-blue-500 shadow-md ring-1 ring-blue-500/50"
                        : "bg-[#151b26] border-[#252f40] hover:border-gray-500 text-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-white">
                            🦙 Ollama Local
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/40">
                            LOCAL (11434)
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                          Exécution 100% hors-ligne et confidentielle sur votre machine.
                        </p>
                      </div>
                      {aiProvider === "ollama" && (
                        <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </button>

                  {/* OpenCode / LM Studio */}
                  <button
                    type="button"
                    onClick={() => onChangeAIProvider("opencode")}
                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer relative ${
                      aiProvider === "opencode"
                        ? "bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500/50"
                        : "bg-[#151b26] border-[#252f40] hover:border-gray-500 text-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-white">
                            💻 OpenCode / LM Studio
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/40">
                            LOCAL (1234)
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                          Serveur compatible API OpenAI local pour modèles GGUF.
                        </p>
                      </div>
                      {aiProvider === "opencode" && (
                        <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </button>
                </div>

                {/* Connection Test & Token Settings */}
                <div className="bg-[#151b26] p-4 rounded-xl border border-[#252f40] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">
                      Test de Connectivité du Moteur Actif ({aiProvider})
                    </span>
                    <button
                      onClick={() => handleTestConnection()}
                      disabled={testStatus.loading}
                      className="px-3 py-1 rounded bg-[#253247] hover:bg-[#31425e] text-white text-xs font-semibold border border-blue-500/40 transition cursor-pointer"
                    >
                      {testStatus.loading ? "Test en cours..." : "Tester la connexion IA"}
                    </button>
                  </div>

                  {testStatus.message && (
                    <div
                      className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                        testStatus.ok
                          ? "bg-emerald-950/40 border-emerald-500 text-emerald-200"
                          : "bg-red-950/40 border-red-500 text-red-200"
                      }`}
                    >
                      {testStatus.ok ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                      <span>{testStatus.message}</span>
                    </div>
                  )}

                  {aiProvider === "huggingface" && (
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">
                        Token Hugging Face API (optionnel) :
                      </label>
                      <input
                        type="password"
                        value={hfToken}
                        onChange={(e) => onChangeHfToken(e.target.value)}
                        placeholder="hf_xxxxxxxxxxxxxxxxxxxx"
                        className="w-full bg-[#0e121a] text-gray-200 text-xs px-3 py-2 rounded-lg border border-[#2b3548] focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                  )}

                  {(aiProvider === "ollama" || aiProvider === "opencode") && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-gray-400 mb-1">
                          URL du serveur local :
                        </label>
                        <input
                          type="text"
                          value={localUrl}
                          onChange={(e) => onChangeLocalUrl(e.target.value)}
                          placeholder="http://localhost:11434"
                          className="w-full bg-[#0e121a] text-gray-200 text-xs px-3 py-2 rounded-lg border border-[#2b3548] focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-gray-400 mb-1">
                          Nom du modèle :
                        </label>
                        <input
                          type="text"
                          value={localModel}
                          onChange={(e) => onChangeLocalModel(e.target.value)}
                          placeholder="qwen2.5-coder"
                          className="w-full bg-[#0e121a] text-gray-200 text-xs px-3 py-2 rounded-lg border border-[#2b3548] focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===================== TAB: AGENT (CLAUDE & HERMES) ===================== */}
            {activeTab === "agent" && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Bot className="w-4 h-4 text-orange-400" />
                    <span>Configuration de l'Agent IA (Claude Code & Hermes)</span>
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Contrôlez le degré d'autonomie, le ton des réponses et les instructions système globales.
                  </p>
                </div>

                {/* Persona Selection */}
                <div className="bg-[#151b26] p-4 rounded-xl border border-[#252f40] space-y-3">
                  <div className="font-bold text-xs text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Mode d'Exécution & Personnalité de l'Agent</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleUpdateAiPersonality("claude-code")}
                      className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                        aiPersonality === "claude-code"
                          ? "bg-[#253247] border-blue-500 text-white font-semibold ring-1 ring-blue-500/50"
                          : "bg-[#0e121a] border-[#222b3b] text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      <div className="text-xs font-bold text-blue-300">Claude Code Mode</div>
                      <div className="text-[11px] text-gray-400 mt-1">
                        Concis, orienté commandes, modifications chirurgicales du code sans bavardage.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdateAiPersonality("hermes-agent")}
                      className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                        aiPersonality === "hermes-agent"
                          ? "bg-[#253247] border-purple-500 text-white font-semibold ring-1 ring-purple-500/50"
                          : "bg-[#0e121a] border-[#222b3b] text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      <div className="text-xs font-bold text-purple-300">Hermes Agent Mode</div>
                      <div className="text-[11px] text-gray-400 mt-1">
                        Raisonnement multi-étapes, planification autonome et détection proactive des erreurs.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdateAiPersonality("pair-programmer")}
                      className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                        aiPersonality === "pair-programmer"
                          ? "bg-[#253247] border-emerald-500 text-white font-semibold ring-1 ring-emerald-500/50"
                          : "bg-[#0e121a] border-[#222b3b] text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      <div className="text-xs font-bold text-emerald-300">Pair Programmer</div>
                      <div className="text-[11px] text-gray-400 mt-1">
                        Pédagogique, explications détaillées des lignes de code et bonnes pratiques.
                      </div>
                    </button>
                  </div>
                </div>

                {/* Custom System Prompt Editor */}
                <div className="bg-[#151b26] p-4 rounded-xl border border-[#252f40] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-xs text-white">
                      Instructions Système Personnalisées (System Prompt)
                    </label>
                    <button
                      onClick={handleSaveCustomPrompt}
                      className="px-2.5 py-1 rounded bg-[#253247] hover:bg-[#31425e] text-white text-[11px] font-semibold flex items-center gap-1 border border-blue-500/40 transition cursor-pointer"
                    >
                      <Save className="w-3 h-3 text-blue-400" />
                      <span>Enregistrer</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Ces instructions sont automatiquement injectées dans chaque requête envoyée aux modèles IA (Clixad.io, Gemini, Ollama, Ghostwriter).
                  </p>
                  <textarea
                    value={customSystemPrompt}
                    onChange={(e) => setCustomSystemPrompt(e.target.value)}
                    rows={4}
                    className="w-full bg-[#0e121a] text-gray-200 text-xs p-3 rounded-lg border border-[#2b3548] focus:outline-none focus:border-[#f26207] font-mono leading-relaxed"
                  />
                  <div className="flex items-center justify-between text-[10px] text-gray-500">
                    <span>{customSystemPrompt.length} caractères</span>
                    <button
                      onClick={() =>
                        setCustomSystemPrompt(
                          "Tu es un ingénieur logiciel senior et pair-programmer expert. Sois concis, pragmatique, et fournis du code propre, direct et exécutable."
                        )
                      }
                      className="text-gray-400 hover:text-white underline cursor-pointer"
                    >
                      Rétablir prompt par défaut
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ===================== TAB: CODE EDITOR ===================== */}
            {activeTab === "editor" && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                    <Code2 className="w-4 h-4 text-blue-400" />
                    <span>Configuration de l'Éditeur de Code</span>
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Ajustez la typographie, l'indentation et les aides de saisie en temps réel.
                  </p>
                </div>

                <div className="bg-[#151b26] p-4 rounded-xl border border-[#252f40] space-y-4">
                  {/* Font Size */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-white">
                        Taille de Police (Font Size)
                      </div>
                      <div className="text-[11px] text-gray-400">
                        Actuel : {editorFontSize}px
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#0e121a] p-1 rounded-lg border border-[#263142]">
                      {[11, 12, 13.5, 15, 16].map((size) => (
                        <button
                          key={size}
                          onClick={() => handleUpdateEditorFontSize(size)}
                          className={`px-2.5 py-1 rounded text-xs font-mono transition cursor-pointer ${
                            editorFontSize === size
                              ? "bg-blue-600 text-white font-bold"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          {size}px
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Family */}
                  <div className="flex items-center justify-between pt-3 border-t border-[#222b3b]">
                    <div>
                      <div className="font-semibold text-xs text-white">
                        Police de Caractères
                      </div>
                      <div className="text-[11px] text-gray-400">
                        Police monospace avec ligatures de code
                      </div>
                    </div>
                    <select
                      value={editorFontFamily}
                      onChange={(e) => handleUpdateEditorFontFamily(e.target.value)}
                      className="bg-[#0e121a] text-gray-200 text-xs px-3 py-1.5 rounded-lg border border-[#263142] focus:outline-none focus:border-blue-500 font-mono cursor-pointer"
                    >
                      <option value="Fira Code">Fira Code (Recommandé)</option>
                      <option value="JetBrains Mono">JetBrains Mono</option>
                      <option value="SF Mono">SF Mono / Menlo</option>
                      <option value="Consolas">Consolas</option>
                    </select>
                  </div>

                  {/* Tab Size */}
                  <div className="flex items-center justify-between pt-3 border-t border-[#222b3b]">
                    <div>
                      <div className="font-semibold text-xs text-white">
                        Largeur de Tabulation (Tab Size)
                      </div>
                      <div className="text-[11px] text-gray-400">
                        Nombre d'espaces insérés par la touche Tab
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#0e121a] p-1 rounded-lg border border-[#263142]">
                      {[2, 4].map((size) => (
                        <button
                          key={size}
                          onClick={() => handleUpdateTabSize(size)}
                          className={`px-3 py-1 rounded text-xs font-mono transition cursor-pointer ${
                            tabSize === size
                              ? "bg-blue-600 text-white font-bold"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          {size} espaces
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Auto-closing brackets */}
                  <div className="flex items-center justify-between pt-3 border-t border-[#222b3b]">
                    <div>
                      <div className="font-semibold text-xs text-white">
                        Fermeture automatique des parenthèses et guillemets
                      </div>
                      <div className="text-[11px] text-gray-400">
                        Ajoute automatiquement les parenthèses, crochets et guillemets fermants lors de la frappe
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleAutoClose}
                      className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                        autoCloseBrackets ? "bg-blue-600" : "bg-gray-700"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                          autoCloseBrackets ? "translate-x-5.5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Word wrap */}
                  <div className="flex items-center justify-between pt-3 border-t border-[#222b3b]">
                    <div>
                      <div className="font-semibold text-xs text-white">
                        Retour à la ligne automatique (Word Wrap)
                      </div>
                      <div className="text-[11px] text-gray-400">
                        Évite le défilement horizontal sur les longues lignes
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleWordWrap}
                      className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                        wordWrap ? "bg-blue-600" : "bg-gray-700"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                          wordWrap ? "translate-x-5.5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ===================== TAB: TERMINAL & THEMES ===================== */}
            {activeTab === "terminal" && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                    <TerminalIcon className="w-4 h-4 text-emerald-400" />
                    <span>Thèmes du Terminal & Environnement Shell</span>
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Modifiez la palette de couleurs (Retro Green, Dracula, Solarized...), le curseur et les effets CRT.
                  </p>
                </div>

                {/* Color Themes Grid */}
                <div>
                  <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block mb-2">
                    Thème Actif du Terminal ({Object.keys(TERMINAL_THEMES).length} Thèmes)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.values(TERMINAL_THEMES).map((theme) => {
                      const isSelected = theme.id === terminalSettings.themeId;
                      return (
                        <button
                          key={theme.id}
                          onClick={() => {
                            const shouldCrt =
                              theme.crtEffectRecommended && !terminalSettings.crtGlow;
                            onUpdateTerminalSettings({
                              ...terminalSettings,
                              themeId: theme.id,
                              crtGlow: shouldCrt ? true : terminalSettings.crtGlow,
                            });
                          }}
                          style={{
                            backgroundColor: theme.colors.bg,
                            borderColor: isSelected
                              ? theme.colors.promptUser
                              : theme.colors.border,
                          }}
                          className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between h-20 ${
                            isSelected
                              ? "ring-2 ring-offset-2 ring-offset-[#121620]"
                              : "hover:border-gray-500 opacity-90 hover:opacity-100"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className="font-bold text-xs"
                              style={{ color: theme.colors.stdout }}
                            >
                              {theme.name}
                            </span>
                            {isSelected && (
                              <Check
                                className="w-3.5 h-3.5"
                                style={{ color: theme.colors.promptUser }}
                              />
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {theme.colors.previewDots.map((c, i) => (
                              <span
                                key={i}
                                className="w-2 h-2 rounded-full border border-black/30"
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Terminal Options */}
                <div className="bg-[#151b26] p-4 rounded-xl border border-[#252f40] space-y-4">
                  {/* Cursor Style */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-white">
                        Style du Curseur
                      </div>
                      <div className="text-[11px] text-gray-400">
                        Forme du curseur clignotant dans le terminal
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#0e121a] p-1 rounded-lg border border-[#263142]">
                      {(["block", "bar", "underline"] as const).map((style) => (
                        <button
                          key={style}
                          onClick={() =>
                            onUpdateTerminalSettings({
                              ...terminalSettings,
                              cursorStyle: style,
                            })
                          }
                          className={`px-3 py-1 rounded text-xs font-mono transition cursor-pointer capitalize ${
                            terminalSettings.cursorStyle === style
                              ? "bg-emerald-600 text-white font-bold"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          {style === "block"
                            ? "█ Bloc"
                            : style === "bar"
                            ? "| Barre"
                            : "_ Trait"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CRT Glow & Scanlines */}
                  <div className="flex items-center justify-between pt-3 border-t border-[#222b3b]">
                    <div>
                      <div className="font-semibold text-xs text-white flex items-center gap-1.5">
                        <Tv className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Effet CRT Phosphore & Balayage</span>
                      </div>
                      <div className="text-[11px] text-gray-400">
                        Scanlines subtiles et lueur vintage rétro (style Matrix / Cyberpunk)
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateTerminalSettings({
                          ...terminalSettings,
                          crtGlow: !terminalSettings.crtGlow,
                        })
                      }
                      className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                        terminalSettings.crtGlow ? "bg-emerald-500" : "bg-gray-700"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                          terminalSettings.crtGlow
                            ? "translate-x-5.5"
                            : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ===================== TAB: SHORTCUTS ===================== */}
            {activeTab === "shortcuts" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                    <Keyboard className="w-4 h-4 text-amber-400" />
                    <span>Raccourcis Clavier du Workspace</span>
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Productivité maximale au clavier dans RepliLite IDE.
                  </p>
                </div>

                <div className="bg-[#151b26] rounded-xl border border-[#252f40] divide-y divide-[#222b3b] overflow-hidden">
                  {[
                    { key: "Ctrl + Entrée / ⌘ + Entrée", action: "Exécuter le code actif (Run Python / JS)" },
                    { key: "Ctrl + , / ⌘ + ,", action: "Ouvrir les Paramètres complets de l'IDE" },
                    { key: "F11 / Échap", action: "Activer ou quitter le mode Plein écran (concentration)" },
                    { key: "Ctrl + S / ⌘ + S", action: "Sauvegarder immédiatement les fichiers" },
                    { key: "Ctrl + B / ⌘ + B", action: "Afficher ou masquer la barre latérale des fichiers" },
                    { key: "Tab", action: "Indenter de 2 espaces sans quitter l'éditeur" },
                    { key: "Shift + Tab", action: "Désindenter la ligne courante" },
                    { key: "Alt + ← / Alt + →", action: "Naviguer dans l'historique des fichiers" },
                    { key: "Haut / Bas dans le terminal", action: "Naviguer dans l'historique des commandes" },
                  ].map((sc, i) => (
                    <div key={i} className="px-4 py-2.5 flex items-center justify-between">
                      <span className="text-gray-300 text-xs">{sc.action}</span>
                      <kbd className="px-2 py-0.5 bg-[#0e121a] text-gray-300 rounded font-mono text-[10.5px] border border-[#2c384c] shadow-2xs">
                        {sc.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===================== TAB: ENV SECRETS ===================== */}
            {activeTab === "env" && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                      <KeyRound className="w-4 h-4 text-cyan-400" />
                      <span>Variables d'Environnement & Clés API (.env)</span>
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Gérez les secrets et clés de vos fournisseurs IA en local.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowEnvSecrets(!showEnvSecrets)}
                    className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white px-2 py-1 rounded bg-[#18202d] border border-[#2a3547] cursor-pointer"
                  >
                    {showEnvSecrets ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showEnvSecrets ? "Masquer les valeurs" : "Afficher les valeurs"}</span>
                  </button>
                </div>

                <div className="bg-[#151b26] p-4 rounded-xl border border-[#252f40] space-y-4">
                  {/* GEMINI_API_KEY */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-mono text-cyan-300 font-semibold">
                        GEMINI_API_KEY
                      </label>
                      <span className="text-[10px] text-gray-400 font-mono">
                        Injecté par AI Studio ou local
                      </span>
                    </div>
                    <input
                      type={showEnvSecrets ? "text" : "password"}
                      value={envGeminiKey}
                      onChange={(e) => setEnvGeminiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full bg-[#0e121a] text-gray-200 text-xs px-3 py-2 rounded-lg border border-[#2b3548] focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  {/* HF_TOKEN */}
                  <div className="pt-2 border-t border-[#222b3b]">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-mono text-amber-300 font-semibold">
                        HF_TOKEN
                      </label>
                      <span className="text-[10px] text-gray-400 font-mono">
                        Hugging Face Inference (optionnel)
                      </span>
                    </div>
                    <input
                      type={showEnvSecrets ? "text" : "password"}
                      value={envHfKey}
                      onChange={(e) => setEnvHfKey(e.target.value)}
                      placeholder="hf_xxxxxxxxxxxxxxxxxxxx"
                      className="w-full bg-[#0e121a] text-gray-200 text-xs px-3 py-2 rounded-lg border border-[#2b3548] focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  {/* CLIXAD_API_ENDPOINT */}
                  <div className="pt-2 border-t border-[#222b3b]">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-mono text-emerald-300 font-semibold">
                        CLIXAD_API_URL
                      </label>
                      <span className="text-[10px] text-emerald-400 font-mono">
                        Gratuit • Aucune clé requise
                      </span>
                    </div>
                    <input
                      type="text"
                      readOnly
                      value="https://api.clixad.io/v1"
                      className="w-full bg-[#0e121a]/60 text-emerald-300/80 text-xs px-3 py-2 rounded-lg border border-emerald-900/40 font-mono cursor-not-allowed"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      onClick={handleSaveEnvVars}
                      className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Enregistrer les variables locales</span>
                    </button>
                    {envSavedNotification && (
                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Enregistré !
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ===================== TAB: WORKSPACE & PRIVACY ===================== */}
            {activeTab === "workspace" && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-teal-400" />
                    <span>Workspace, Profil & Confidentialité</span>
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Gérez votre identité locale et la persistance de l'IDE.
                  </p>
                </div>

                <div className="bg-[#151b26] p-4 rounded-xl border border-[#252f40] space-y-4">
                  {/* User name */}
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">
                      Nom d'utilisateur affiché :
                    </label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => onChangeUserName?.(e.target.value)}
                      placeholder="maestro"
                      className="w-full bg-[#0e121a] text-gray-200 text-xs px-3 py-2 rounded-lg border border-[#2b3548] focus:outline-none focus:border-teal-500 font-medium max-w-sm"
                    />
                  </div>

                  {/* Privacy pill */}
                  <div className="p-3.5 rounded-lg bg-teal-950/20 border border-teal-800/40 space-y-1">
                    <div className="font-semibold text-teal-300 text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Respect Strict de la Vie Privée & Données</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Aucune télémétrie, aucun tracker ni cookie espion. Vos fichiers et clés locales restent exclusivement dans votre navigateur et votre environnement conteneurisé.
                    </p>
                  </div>

                  {/* Reset defaults button */}
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            "Réinitialiser tous les paramètres aux valeurs par défaut ?"
                          )
                        ) {
                          onUpdateTerminalSettings(DEFAULT_TERMINAL_SETTINGS);
                          onChangeAIProvider("clixad");
                          handleUpdateEditorFontSize(13.5);
                          handleUpdateTabSize(2);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg border border-red-800/50 bg-red-950/20 hover:bg-red-900/40 text-red-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Réinitialiser les paramètres par défaut</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ===================== TAB: ABOUT ===================== */}
            {activeTab === "about" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                    <Info className="w-4 h-4 text-indigo-400" />
                    <span>À propos de RepliLite IDE</span>
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Environnement de développement WebAssembly + IA hybride.
                  </p>
                </div>

                <div className="bg-[#151b26] p-4 rounded-xl border border-[#252f40] space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f26207] to-[#ff8c42] flex items-center justify-center text-white font-mono font-bold text-lg shadow-lg">
                      R/
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">
                        RepliLite IDE v1.2
                      </div>
                      <div className="text-[11px] text-gray-400">
                        Compatible Claude Code, Hermes Agent & Clixad.io
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#222b3b] pt-3 text-[11px] text-gray-300 space-y-2 leading-relaxed">
                    <p>
                      • <strong>Moteur Python</strong> : Pyodide Python 3.12 WebAssembly exécuté directement côté client dans le navigateur.
                    </p>
                    <p>
                      • <strong>Moteur JavaScript</strong> : Évaluation sécurisée avec fonctions asynchrones et affichage instantané.
                    </p>
                    <p>
                      • <strong>Intégration Clixad.io</strong> : Passerelle IA gratuite pour le code avec zéro délai et aucune carte requise.
                    </p>
                    <p>
                      • <strong>Raccourci Paramètres</strong> : Appuyez sur <kbd className="font-mono bg-black/40 px-1 py-0.5 rounded border border-gray-700">Ctrl + ,</kbd> ou <kbd className="font-mono bg-black/40 px-1 py-0.5 rounded border border-gray-700">⌘ + ,</kbd> à tout moment pour rouvrir cette page.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#212b3b] bg-[#0e121a] flex items-center justify-between shrink-0">
          <div className="text-[11px] text-gray-400 flex items-center gap-2">
            <span>IA active :</span>
            <span className="font-bold text-emerald-400 font-mono">
              {aiProvider === "clixad" ? "⚡ Clixad.io Free" : aiProvider}
            </span>
            <span className="text-gray-600">•</span>
            <span>Thème terminal :</span>
            <span className="font-semibold text-gray-300 font-mono">
              {terminalSettings.themeId}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
