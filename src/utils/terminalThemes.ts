export type TerminalThemeId =
  | "replit-dark"
  | "retro-green"
  | "dracula"
  | "solarized-dark"
  | "solarized-light"
  | "monokai-pro"
  | "cyberpunk"
  | "nord";

export type TerminalFontSize = "xs" | "sm" | "base";
export type TerminalCursorStyle = "block" | "bar" | "underline";
export type TerminalLineHeight = "compact" | "normal" | "relaxed";

export interface TerminalColors {
  bg: string;
  toolbarBg: string;
  toolbarBorder: string;
  inputBg: string;
  inputBorder: string;
  border: string;
  // Line text colors
  stdout: string;
  stdin: string;
  stderr: string;
  stderrBg: string;
  info: string;
  system: string;
  ai: string;
  aiBg: string;
  aiBorder: string;
  // Prompt
  promptUser: string;
  promptPath: string;
  promptSymbol: string;
  placeholder: string;
  // Cursor
  cursorColor: string;
  // Tabs & buttons
  tabActiveBg: string;
  tabActiveText: string;
  tabActiveBorder: string;
  tabInactiveText: string;
  tabInactiveHoverBg: string;
  btnHoverBg: string;
  scrollbarThumb: string;
  // 4 swatches: [bg, text, prompt, accent]
  previewDots: [string, string, string, string];
}

export interface TerminalTheme {
  id: TerminalThemeId;
  name: string;
  badge?: string;
  description: string;
  isDark: boolean;
  colors: TerminalColors;
  crtEffectRecommended?: boolean;
}

export interface TerminalSettings {
  themeId: TerminalThemeId;
  fontSize: TerminalFontSize;
  lineHeight: TerminalLineHeight;
  cursorStyle: TerminalCursorStyle;
  crtGlow: boolean;
}

export const TERMINAL_THEMES: Record<TerminalThemeId, TerminalTheme> = {
  "replit-dark": {
    id: "replit-dark",
    name: "Replit Dark",
    badge: "Défaut",
    description: "Thème sombre officiel RepliLite avec contrastes doux et lisibilité optimale.",
    isDark: true,
    colors: {
      bg: "#0c1017",
      toolbarBg: "#111622",
      toolbarBorder: "#222938",
      inputBg: "#0e1219",
      inputBorder: "#1d2432",
      border: "#262c36",
      stdout: "#e6edf3",
      stdin: "#34d399",
      stderr: "#f87171",
      stderrBg: "rgba(127, 29, 29, 0.25)",
      info: "#60a5fa",
      system: "#fbbf24",
      ai: "#d8b4fe",
      aiBg: "rgba(88, 28, 135, 0.22)",
      aiBorder: "rgba(147, 51, 234, 0.4)",
      promptUser: "#34d399",
      promptPath: "#60a5fa",
      promptSymbol: "#9ca3af",
      placeholder: "#6b7280",
      cursorColor: "#58a6ff",
      tabActiveBg: "#1f283a",
      tabActiveText: "#ffffff",
      tabActiveBorder: "#33425b",
      tabInactiveText: "#9ca3af",
      tabInactiveHoverBg: "#161c28",
      btnHoverBg: "#1c2434",
      scrollbarThumb: "#2a313d",
      previewDots: ["#0c1017", "#e6edf3", "#34d399", "#58a6ff"],
    },
  },
  "retro-green": {
    id: "retro-green",
    name: "Retro Green",
    badge: "CRT Matrix",
    description: "Ambiance terminal cathodique vintage avec phosphore vert éclatant et lueur CRT.",
    isDark: true,
    crtEffectRecommended: true,
    colors: {
      bg: "#040a05",
      toolbarBg: "#08140a",
      toolbarBorder: "#143818",
      inputBg: "#061008",
      inputBorder: "#143818",
      border: "#16431b",
      stdout: "#4ade80",
      stdin: "#86efac",
      stderr: "#f87171",
      stderrBg: "rgba(153, 27, 27, 0.35)",
      info: "#22d3ee",
      system: "#a3e635",
      ai: "#5eead4",
      aiBg: "rgba(13, 148, 136, 0.25)",
      aiBorder: "rgba(20, 184, 166, 0.45)",
      promptUser: "#22c55e",
      promptPath: "#4ade80",
      promptSymbol: "#16a34a",
      placeholder: "#15803d",
      cursorColor: "#22c55e",
      tabActiveBg: "#0f2913",
      tabActiveText: "#86efac",
      tabActiveBorder: "#22c55e",
      tabInactiveText: "#4ade80",
      tabInactiveHoverBg: "#0a1c0d",
      btnHoverBg: "#0f2913",
      scrollbarThumb: "#1e4624",
      previewDots: ["#040a05", "#4ade80", "#22c55e", "#86efac"],
    },
  },
  dracula: {
    id: "dracula",
    name: "Dracula",
    badge: "Populaire",
    description: "Le classique culte sombre aux teintes pastel : vert menthe, rose fuchsia et lilas.",
    isDark: true,
    colors: {
      bg: "#282a36",
      toolbarBg: "#21222c",
      toolbarBorder: "#44475a",
      inputBg: "#1e1f29",
      inputBorder: "#44475a",
      border: "#44475a",
      stdout: "#f8f8f2",
      stdin: "#50fa7b",
      stderr: "#ff5555",
      stderrBg: "rgba(255, 85, 85, 0.2)",
      info: "#8be9fd",
      system: "#ffb86c",
      ai: "#bd93f9",
      aiBg: "rgba(189, 147, 249, 0.2)",
      aiBorder: "rgba(189, 147, 249, 0.45)",
      promptUser: "#50fa7b",
      promptPath: "#bd93f9",
      promptSymbol: "#ff79c6",
      placeholder: "#6272a4",
      cursorColor: "#ff79c6",
      tabActiveBg: "#44475a",
      tabActiveText: "#f8f8f2",
      tabActiveBorder: "#6272a4",
      tabInactiveText: "#9ca3af",
      tabInactiveHoverBg: "#2d303e",
      btnHoverBg: "#44475a",
      scrollbarThumb: "#44475a",
      previewDots: ["#282a36", "#f8f8f2", "#50fa7b", "#ff79c6"],
    },
  },
  "solarized-dark": {
    id: "solarized-dark",
    name: "Solarized Dark",
    badge: "Ergonomique",
    description: "Palette scientifiquement dosée par Ethan Schoonover contre la fatigue oculaire.",
    isDark: true,
    colors: {
      bg: "#002b36",
      toolbarBg: "#073642",
      toolbarBorder: "#0d4857",
      inputBg: "#00212b",
      inputBorder: "#073642",
      border: "#0d4857",
      stdout: "#839496",
      stdin: "#859900",
      stderr: "#dc322f",
      stderrBg: "rgba(220, 50, 47, 0.2)",
      info: "#268bd2",
      system: "#cb4b16",
      ai: "#6c71c4",
      aiBg: "rgba(108, 113, 196, 0.2)",
      aiBorder: "rgba(108, 113, 196, 0.45)",
      promptUser: "#859900",
      promptPath: "#268bd2",
      promptSymbol: "#93a1a1",
      placeholder: "#586e75",
      cursorColor: "#2aa198",
      tabActiveBg: "#0d4857",
      tabActiveText: "#93a1a1",
      tabActiveBorder: "#2aa198",
      tabInactiveText: "#657b83",
      tabInactiveHoverBg: "#073642",
      btnHoverBg: "#0d4857",
      scrollbarThumb: "#073642",
      previewDots: ["#002b36", "#839496", "#859900", "#268bd2"],
    },
  },
  "solarized-light": {
    id: "solarized-light",
    name: "Solarized Light",
    badge: "Clair",
    description: "Version claire au fond parchemin chaleureux, idéale pour travailler en journée.",
    isDark: false,
    colors: {
      bg: "#fdf6e3",
      toolbarBg: "#eee8d5",
      toolbarBorder: "#d3cbbb",
      inputBg: "#f5eed9",
      inputBorder: "#d3cbbb",
      border: "#d3cbbb",
      stdout: "#586e75",
      stdin: "#859900",
      stderr: "#dc322f",
      stderrBg: "rgba(220, 50, 47, 0.12)",
      info: "#268bd2",
      system: "#b58900",
      ai: "#6c71c4",
      aiBg: "rgba(108, 113, 196, 0.12)",
      aiBorder: "rgba(108, 113, 196, 0.35)",
      promptUser: "#859900",
      promptPath: "#268bd2",
      promptSymbol: "#657b83",
      placeholder: "#93a1a1",
      cursorColor: "#073642",
      tabActiveBg: "#dcd3be",
      tabActiveText: "#073642",
      tabActiveBorder: "#2aa198",
      tabInactiveText: "#657b83",
      tabInactiveHoverBg: "#e4dcc7",
      btnHoverBg: "#dcd3be",
      scrollbarThumb: "#cbbf9f",
      previewDots: ["#fdf6e3", "#586e75", "#859900", "#dc322f"],
    },
  },
  "monokai-pro": {
    id: "monokai-pro",
    name: "Monokai Pro",
    badge: "Sublime",
    description: "Les contrastes éclatants de TextMate : vert néon, fuchsia, cyan et mandarine.",
    isDark: true,
    colors: {
      bg: "#272822",
      toolbarBg: "#1e1f1c",
      toolbarBorder: "#3e3d32",
      inputBg: "#191a17",
      inputBorder: "#3e3d32",
      border: "#3e3d32",
      stdout: "#f8f8f2",
      stdin: "#a6e22e",
      stderr: "#f92672",
      stderrBg: "rgba(249, 38, 114, 0.2)",
      info: "#66d9ef",
      system: "#fd971f",
      ai: "#ae81ff",
      aiBg: "rgba(174, 129, 255, 0.2)",
      aiBorder: "rgba(174, 129, 255, 0.45)",
      promptUser: "#a6e22e",
      promptPath: "#66d9ef",
      promptSymbol: "#fd971f",
      placeholder: "#75715e",
      cursorColor: "#f8f8f0",
      tabActiveBg: "#3e3d32",
      tabActiveText: "#f8f8f2",
      tabActiveBorder: "#a6e22e",
      tabInactiveText: "#75715e",
      tabInactiveHoverBg: "#2a2b25",
      btnHoverBg: "#3e3d32",
      scrollbarThumb: "#49483e",
      previewDots: ["#272822", "#f8f8f2", "#a6e22e", "#f92672"],
    },
  },
  cyberpunk: {
    id: "cyberpunk",
    name: "Cyberpunk",
    badge: "Néon 80s",
    description: "Univers futuriste et synthwave aux accents rose fluo, cyan laser et violet nuit.",
    isDark: true,
    crtEffectRecommended: true,
    colors: {
      bg: "#0d0221",
      toolbarBg: "#150630",
      toolbarBorder: "#2d0b60",
      inputBg: "#090117",
      inputBorder: "#2d0b60",
      border: "#2d0b60",
      stdout: "#fef6e4",
      stdin: "#00ff9f",
      stderr: "#ff0055",
      stderrBg: "rgba(255, 0, 85, 0.25)",
      info: "#00f0ff",
      system: "#ffe600",
      ai: "#d300c5",
      aiBg: "rgba(211, 0, 197, 0.22)",
      aiBorder: "rgba(211, 0, 197, 0.5)",
      promptUser: "#00ff9f",
      promptPath: "#00f0ff",
      promptSymbol: "#ff0055",
      placeholder: "#735397",
      cursorColor: "#00f0ff",
      tabActiveBg: "#270e51",
      tabActiveText: "#00f0ff",
      tabActiveBorder: "#ff0055",
      tabInactiveText: "#8a67b5",
      tabInactiveHoverBg: "#1b073e",
      btnHoverBg: "#270e51",
      scrollbarThumb: "#3f1384",
      previewDots: ["#0d0221", "#fef6e4", "#00ff9f", "#ff0055"],
    },
  },
  nord: {
    id: "nord",
    name: "Nord Frost",
    badge: "Arctique",
    description: "Teintes boréales et givrées inspirées des aurores scandinaves.",
    isDark: true,
    colors: {
      bg: "#242933",
      toolbarBg: "#1e222a",
      toolbarBorder: "#3b4252",
      inputBg: "#1a1d24",
      inputBorder: "#3b4252",
      border: "#3b4252",
      stdout: "#eceff4",
      stdin: "#a3be8c",
      stderr: "#bf616a",
      stderrBg: "rgba(191, 97, 106, 0.2)",
      info: "#88c0d0",
      system: "#ebcb8b",
      ai: "#b48ead",
      aiBg: "rgba(180, 142, 173, 0.2)",
      aiBorder: "rgba(180, 142, 173, 0.45)",
      promptUser: "#a3be8c",
      promptPath: "#81a1c1",
      promptSymbol: "#88c0d0",
      placeholder: "#4c566a",
      cursorColor: "#88c0d0",
      tabActiveBg: "#3b4252",
      tabActiveText: "#eceff4",
      tabActiveBorder: "#88c0d0",
      tabInactiveText: "#d8dee9",
      tabInactiveHoverBg: "#2e3440",
      btnHoverBg: "#3b4252",
      scrollbarThumb: "#434c5e",
      previewDots: ["#242933", "#eceff4", "#a3be8c", "#88c0d0"],
    },
  },
};

export const DEFAULT_TERMINAL_SETTINGS: TerminalSettings = {
  themeId: "replit-dark",
  fontSize: "sm",
  lineHeight: "normal",
  cursorStyle: "block",
  crtGlow: false,
};

const STORAGE_KEY = "replilite_terminal_settings_v1";

export function loadTerminalSettings(): TerminalSettings {
  if (typeof window === "undefined") return DEFAULT_TERMINAL_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_TERMINAL_SETTINGS;
    const parsed = JSON.parse(raw);
    const validTheme = TERMINAL_THEMES[parsed.themeId as TerminalThemeId]
      ? (parsed.themeId as TerminalThemeId)
      : "replit-dark";
    return {
      themeId: validTheme,
      fontSize: ["xs", "sm", "base"].includes(parsed.fontSize) ? parsed.fontSize : "sm",
      lineHeight: ["compact", "normal", "relaxed"].includes(parsed.lineHeight)
        ? parsed.lineHeight
        : "normal",
      cursorStyle: ["block", "bar", "underline"].includes(parsed.cursorStyle)
        ? parsed.cursorStyle
        : "block",
      crtGlow: Boolean(parsed.crtGlow),
    };
  } catch (_e) {
    return DEFAULT_TERMINAL_SETTINGS;
  }
}

export function saveTerminalSettings(settings: TerminalSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (_e) {
    // ignore
  }
}

export function parseThemeAlias(query: string): TerminalThemeId | null {
  const q = query.toLowerCase().trim().replace(/[_\s]+/g, "-");
  if (!q) return null;
  if (TERMINAL_THEMES[q as TerminalThemeId]) return q as TerminalThemeId;

  if (q === "retro" || q === "green" || q === "matrix" || q === "crt") return "retro-green";
  if (q === "drac" || q === "dracula") return "dracula";
  if (q === "solarized" || q === "solarized-dark" || q === "dark-solarized") return "solarized-dark";
  if (q === "solarized-light" || q === "light-solarized" || q === "light") return "solarized-light";
  if (q === "monokai" || q === "monokai-pro") return "monokai-pro";
  if (q === "cyber" || q === "cyberpunk" || q === "neon" || q === "synthwave") return "cyberpunk";
  if (q === "nord" || q === "nordic" || q === "frost") return "nord";
  if (q === "default" || q === "replit" || q === "dark") return "replit-dark";

  return null;
}
