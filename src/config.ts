import type { ThemeColor } from "@earendil-works/pi-coding-agent";

export type ColorMode = "theme" | "custom" | "none";

export type WorkingPhraseThemeColors = {
	message: ThemeColor;
	shinePeak: ThemeColor;
	shineTrail: ThemeColor;
	spinner: ThemeColor;
};

export type WorkingPhraseConfig = {
	phrasesShuffleMs: number;
	shineFrameMs: number;
	shinePauseMs: number;
	shineTrailRadius: number;
	shineStep: number;
	colorMode: ColorMode;
	themeColors: WorkingPhraseThemeColors;
	baseColor: string;
	spinnerColor: string;
	appendEllipsis: boolean;
	messageSuffix: string;
	spinnerFrameMs: number;
};

const themeColors = {
	message: "customMessageLabel",
	shinePeak: "accent",
	shineTrail: "customMessageLabel",
	spinner: "accent",
} as const satisfies WorkingPhraseThemeColors;

export const defaultConfig = {
	phrasesShuffleMs: 8000,
	shineFrameMs: 60,
	shinePauseMs: 900,
	shineTrailRadius: 3,
	shineStep: 1,

	colorMode: "theme",

	themeColors,

	baseColor: "#9776c7",
	spinnerColor: "#50fa7b",

	appendEllipsis: true,
	messageSuffix: "...",

	spinnerFrameMs: 80,
} as const satisfies WorkingPhraseConfig;
