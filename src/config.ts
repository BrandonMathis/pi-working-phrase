import type { ThemeColor } from "@mariozechner/pi-coding-agent";

export type ColorMode = "theme" | "custom" | "none";

export type WorkingPhraseThemeColors = {
	message: ThemeColor;
	shinePeak: ThemeColor;
	shineTrail: ThemeColor;
	spinner: ThemeColor;
};

const themeColors = {
	message: "customMessageLabel",
	shinePeak: "accent",
	shineTrail: "customMessageLabel",
	spinner: "accent",
} as const satisfies WorkingPhraseThemeColors;

export const config = {
	phrasesShuffleMs: 8000,
	shineFrameMs: 60,
	shinePauseMs: 900,
	shineTrailRadius: 3,
	shineStep: 1,

	colorMode: "custom" satisfies ColorMode,

	themeColors,

	baseColor: "#9776c7",
	spinnerColor: "#50fa7b",

	appendEllipsis: true,
	messageSuffix: "...",

	spinnerFrameMs: 80,
} as const;
