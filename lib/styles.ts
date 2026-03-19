// Shared design tokens

export const CARD =
  "rounded-2xl border border-gray-800/60 bg-gray-900/50 backdrop-blur-sm";

export const CARD_HOVER =
  "rounded-2xl border border-gray-800/60 bg-gray-900/50 backdrop-blur-sm hover:border-gray-700/80 transition-colors";

export const SECTION_LABEL =
  "text-xs font-semibold tracking-widest uppercase text-white/40";

// White gradient (hero style)
export const GRADIENT_TEXT: Record<string, string> = {
  background: "linear-gradient(to bottom, #ffffff, #ffffff, rgba(255,255,255,0.55))",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  letterSpacing: "-0.04em",
};

// Violet-to-fuchsia accent gradient (replaces yellow)
export const GRADIENT_ACCENT: Record<string, string> = {
  background: "linear-gradient(135deg, #a78bfa, #c084fc, #e879f9)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  letterSpacing: "-0.03em",
};

// Solid accent hex for non-text use
export const ACCENT = "#a78bfa";          // violet-400
export const ACCENT_MID = "#c084fc";      // purple-400
export const ACCENT_BRIGHT = "#e879f9";   // fuchsia-400

export const PILL =
  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-gray-700/60 bg-gray-800/50 backdrop-blur-sm text-xs text-gray-400";

export const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white text-black text-sm font-semibold hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all";

export const BTN_GHOST =
  "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-700/60 text-sm text-white/60 hover:text-white hover:border-gray-500 transition-all";

export const DIFF_COLOR: Record<string, string> = {
  easy:   "text-green-400  bg-green-400/10  border-green-400/30",
  medium: "text-violet-400 bg-violet-400/10 border-violet-400/30",
  hard:   "text-fuchsia-400 bg-fuchsia-400/10 border-fuchsia-400/30",
};

export const DIFF_EN: Record<string, string> = {
  easy: "Easy", medium: "Medium", hard: "Hard",
};
