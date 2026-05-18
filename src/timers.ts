import type { ExtensionContext, ThemeColor } from "@earendil-works/pi-coding-agent";
import { colorizeHex, getShineColor } from "./colors";
import { defaultConfig } from "./config";
import { createPhraseRotator } from "./phrases-rotator";
import { createShineAnimator, type ShineStyle } from "./shine";
import { createDefaultWorkingPhraseConfig, type ResolvedWorkingPhraseConfig } from "./user-config";

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"] as const;
const RESET_FG = "\x1b[39m";
const TRUECOLOR_FG_PREFIX = "\x1b[38;2;";
const INDEXED_FG_PREFIX = "\x1b[38;5;";
const SHINE_LIGHTEN_STRENGTHS = [0.42, 0.32, 0.22, 0.12] as const;
const MAX_COLOR_VALUE = 255;
const BASIC_ANSI_COLORS = [
	[0, 0, 0],
	[128, 0, 0],
	[0, 128, 0],
	[128, 128, 0],
	[0, 0, 128],
	[128, 0, 128],
	[0, 128, 128],
	[192, 192, 192],
	[128, 128, 128],
	[255, 0, 0],
	[0, 255, 0],
	[255, 255, 0],
	[0, 0, 255],
	[255, 0, 255],
	[0, 255, 255],
	[255, 255, 255],
] as const;
const CUBE_VALUES = [0, 95, 135, 175, 215, 255] as const;

type ThemeStyler = {
	fg(color: ThemeColor, text: string): string;
	getFgAnsi?(color: ThemeColor): string;
};

type ColorMode = "theme" | "custom" | "none";

type ThemeColors = {
	message: ThemeColor;
	shinePeak: ThemeColor;
	shineTrail: ThemeColor;
	spinner: ThemeColor;
};

export type ColorRenderingConfig = {
	colorMode: ColorMode;
	themeColors: ThemeColors;
	baseColor: string;
	spinnerColor: string;
	shineTrailRadius: number;
};

function intervalMs(value: number): number {
	return Math.max(1, Math.floor(value));
}

function clampColorValue(value: number): number {
	return Math.max(0, Math.min(MAX_COLOR_VALUE, Math.round(value)));
}

function rgbToHex(r: number, g: number, b: number): string {
	return `#${[r, g, b].map((value) => clampColorValue(value).toString(16).padStart(2, "0")).join("")}`;
}

function hexToRgb(hexColor: string): { r: number; g: number; b: number } {
	const hex = hexColor.replace(/^#/, "");
	return {
		r: Number.parseInt(hex.slice(0, 2), 16),
		g: Number.parseInt(hex.slice(2, 4), 16),
		b: Number.parseInt(hex.slice(4, 6), 16),
	};
}

function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
	const dr = r1 - r2;
	const dg = g1 - g2;
	const db = b1 - b2;
	return dr * dr * 0.299 + dg * dg * 0.587 + db * db * 0.114;
}

function findClosestIndex(value: number, values: readonly number[]): number {
	let minDistance = Number.POSITIVE_INFINITY;
	let minIndex = 0;

	for (let index = 0; index < values.length; index += 1) {
		const distance = Math.abs(value - (values[index] ?? 0));
		if (distance < minDistance) {
			minDistance = distance;
			minIndex = index;
		}
	}

	return minIndex;
}

function rgbTo256Index(r: number, g: number, b: number): number {
	const rIndex = findClosestIndex(r, CUBE_VALUES);
	const gIndex = findClosestIndex(g, CUBE_VALUES);
	const bIndex = findClosestIndex(b, CUBE_VALUES);
	const cubeR = CUBE_VALUES[rIndex] ?? 0;
	const cubeG = CUBE_VALUES[gIndex] ?? 0;
	const cubeB = CUBE_VALUES[bIndex] ?? 0;
	const cubeColorIndex = 16 + 36 * rIndex + 6 * gIndex + bIndex;
	const cubeDistance = colorDistance(r, g, b, cubeR, cubeG, cubeB);
	const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
	const grayIndex = Math.max(0, Math.min(23, Math.round((gray - 8) / 10)));
	const grayValue = 8 + grayIndex * 10;
	const grayColorIndex = 232 + grayIndex;
	const grayDistance = colorDistance(r, g, b, grayValue, grayValue, grayValue);
	const spread = Math.max(r, g, b) - Math.min(r, g, b);

	return spread < 10 && grayDistance < cubeDistance ? grayColorIndex : cubeColorIndex;
}

function indexedColorToHex(index: number): string | undefined {
	if (index < 0 || index > 255) return undefined;

	if (index < BASIC_ANSI_COLORS.length) {
		const [r, g, b] = BASIC_ANSI_COLORS[index];
		return rgbToHex(r, g, b);
	}

	if (index >= 16 && index <= 231) {
		const cubeIndex = index - 16;
		const r = CUBE_VALUES[Math.floor(cubeIndex / 36)] ?? 0;
		const g = CUBE_VALUES[Math.floor((cubeIndex % 36) / 6)] ?? 0;
		const b = CUBE_VALUES[cubeIndex % 6] ?? 0;
		return rgbToHex(r, g, b);
	}

	const gray = 8 + (index - 232) * 10;
	return rgbToHex(gray, gray, gray);
}

function ansiForegroundToColor(ansi: string): { hex: string; mode: "truecolor" | "256color" } | undefined {
	if (ansi.startsWith(TRUECOLOR_FG_PREFIX) && ansi.endsWith("m")) {
		const channels = ansi.slice(TRUECOLOR_FG_PREFIX.length, -1).split(";").map(Number);
		if (channels.length !== 3 || channels.some((channel) => !Number.isFinite(channel))) return undefined;

		return {
			hex: rgbToHex(channels[0] ?? 0, channels[1] ?? 0, channels[2] ?? 0),
			mode: "truecolor",
		};
	}

	if (ansi.startsWith(INDEXED_FG_PREFIX) && ansi.endsWith("m")) {
		const colorIndex = Number(ansi.slice(INDEXED_FG_PREFIX.length, -1));
		if (!Number.isFinite(colorIndex)) return undefined;

		const hex = indexedColorToHex(colorIndex);
		return hex ? { hex, mode: "256color" } : undefined;
	}

	return undefined;
}

function colorizeThemeHex(text: string, hexColor: string, mode: "truecolor" | "256color"): string {
	if (mode === "truecolor") return colorizeHex(text, hexColor);

	const { r, g, b } = hexToRgb(hexColor);
	return `\x1b[38;5;${rgbTo256Index(r, g, b)}m${text}${RESET_FG}`;
}

function createThemeShineColorizer(theme: ThemeStyler, messageColor: ThemeColor): ShineStyle | undefined {
	const baseColor = theme.getFgAnsi ? ansiForegroundToColor(theme.getFgAnsi(messageColor)) : undefined;
	if (!baseColor) return undefined;

	return (character, distance) => {
		const color =
			distance !== undefined && distance < SHINE_LIGHTEN_STRENGTHS.length
				? getShineColor(baseColor.hex, distance)
				: baseColor.hex;
		return colorizeThemeHex(character, color, baseColor.mode);
	};
}

export function createSpinnerFrames(theme: ThemeStyler, colorConfig: ColorRenderingConfig = defaultConfig): string[] {
	switch (colorConfig.colorMode) {
		case "theme":
			return SPINNER_FRAMES.map((frame) => theme.fg(colorConfig.themeColors.spinner, frame));
		case "custom":
			return SPINNER_FRAMES.map((frame) => colorizeHex(frame, colorConfig.spinnerColor));
		case "none":
			return [...SPINNER_FRAMES];
	}
}

export function createCharacterStyler(
	theme: ThemeStyler,
	colorConfig: ColorRenderingConfig = defaultConfig,
): ShineStyle {
	switch (colorConfig.colorMode) {
		case "theme": {
			const colorizeShine = createThemeShineColorizer(theme, colorConfig.themeColors.message);

			return (character, distance) => {
				if (distance !== undefined && distance <= colorConfig.shineTrailRadius && colorizeShine) {
					return colorizeShine(character, distance);
				}
				if (!colorizeShine && distance === 0) return theme.fg(colorConfig.themeColors.shinePeak, character);
				if (!colorizeShine && distance !== undefined && distance <= colorConfig.shineTrailRadius) {
					return theme.fg(colorConfig.themeColors.shineTrail, character);
				}
				return theme.fg(colorConfig.themeColors.message, character);
			};
		}
		case "custom":
			return (character, distance) => {
				const color =
					distance !== undefined && distance <= colorConfig.shineTrailRadius
						? getShineColor(colorConfig.baseColor, distance)
						: colorConfig.baseColor;
				return colorizeHex(character, color);
			};
		case "none":
			return (character) => character;
	}
}

function applySpinner(ctx: ExtensionContext, runtimeConfig: ResolvedWorkingPhraseConfig): void {
	ctx.ui.setWorkingIndicator({
		frames: createSpinnerFrames(ctx.ui.theme, runtimeConfig),
		intervalMs: intervalMs(runtimeConfig.spinnerFrameMs),
	});
}

export function createWorkingStatusController(): {
	start(ctx: ExtensionContext, runtimeConfig?: ResolvedWorkingPhraseConfig): void;
	stop(ctx?: ExtensionContext): void;
} {
	let runtimeConfig = createDefaultWorkingPhraseConfig();
	let phraseRotator = createPhraseRotator(runtimeConfig.phrases, {
		appendEllipsis: runtimeConfig.appendEllipsis,
		suffix: runtimeConfig.messageSuffix,
	});
	let shineAnimator = createShineAnimator({
		frameMs: runtimeConfig.shineFrameMs,
		pauseMs: runtimeConfig.shinePauseMs,
		trailRadius: runtimeConfig.shineTrailRadius,
		step: runtimeConfig.shineStep,
	});

	let phraseTimer: ReturnType<typeof setInterval> | undefined;
	let shineTimer: ReturnType<typeof setInterval> | undefined;
	let currentMessage = "";

	function clearTimers(): void {
		if (phraseTimer) {
			clearInterval(phraseTimer);
			phraseTimer = undefined;
		}
		if (shineTimer) {
			clearInterval(shineTimer);
			shineTimer = undefined;
		}
	}

	function configure(nextConfig: ResolvedWorkingPhraseConfig): void {
		runtimeConfig = nextConfig;
		phraseRotator = createPhraseRotator(runtimeConfig.phrases, {
			appendEllipsis: runtimeConfig.appendEllipsis,
			suffix: runtimeConfig.messageSuffix,
		});
		shineAnimator = createShineAnimator({
			frameMs: runtimeConfig.shineFrameMs,
			pauseMs: runtimeConfig.shinePauseMs,
			trailRadius: runtimeConfig.shineTrailRadius,
			step: runtimeConfig.shineStep,
		});
	}

	function render(ctx: ExtensionContext): void {
		ctx.ui.setWorkingMessage(shineAnimator.render(currentMessage, createCharacterStyler(ctx.ui.theme, runtimeConfig)));
	}

	function stop(ctx?: ExtensionContext): void {
		clearTimers();

		if (ctx?.hasUI) {
			ctx.ui.setWorkingMessage();
			ctx.ui.setWorkingIndicator();
		}
	}

	return {
		start(ctx: ExtensionContext, nextConfig = createDefaultWorkingPhraseConfig()): void {
			stop(ctx);
			configure(nextConfig);
			phraseRotator.reset();

			if (!ctx.hasUI) return;

			applySpinner(ctx, runtimeConfig);
			currentMessage = phraseRotator.nextMessage();
			shineAnimator.reset(currentMessage);
			render(ctx);

			shineTimer = setInterval(() => {
				shineAnimator.advance(currentMessage);
				render(ctx);
			}, intervalMs(runtimeConfig.shineFrameMs));

			phraseTimer = setInterval(() => {
				const previousMessage = currentMessage;
				currentMessage = phraseRotator.nextMessage();
				shineAnimator.retarget(previousMessage, currentMessage);
				render(ctx);
			}, intervalMs(runtimeConfig.phrasesShuffleMs));
		},
		stop,
	};
}
