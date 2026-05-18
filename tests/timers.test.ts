import type { ThemeColor } from "@earendil-works/pi-coding-agent";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	createCharacterStyler,
	createSpinnerFrames,
	createWorkingStatusController,
	type ColorRenderingConfig,
} from "../src/timers";

type FakeTheme = {
	fg: ReturnType<typeof vi.fn<(color: ThemeColor, text: string) => string>>;
	getFgAnsi?: ReturnType<typeof vi.fn<(color: ThemeColor) => string>>;
};

type FakeContext = {
	hasUI: boolean;
	ui: {
		theme: FakeTheme;
		setWorkingIndicator: ReturnType<typeof vi.fn>;
		setWorkingMessage: ReturnType<typeof vi.fn>;
	};
};

const baseColorConfig = {
	colorMode: "theme",
	themeColors: {
		message: "customMessageLabel",
		shinePeak: "accent",
		shineTrail: "customMessageLabel",
		spinner: "accent",
	},
	baseColor: "#9776c7",
	spinnerColor: "#50fa7b",
	shineTrailRadius: 3,
} satisfies ColorRenderingConfig;

function createTheme(fgAnsi = "\x1b[38;2;126;87;194m"): FakeTheme {
	return {
		fg: vi.fn((color, text) => `[${color}:${text}]`),
		getFgAnsi: vi.fn(() => fgAnsi),
	};
}

function createFallbackTheme(): FakeTheme {
	return {
		fg: vi.fn((color, text) => `[${color}:${text}]`),
	};
}

function createContext(hasUI = true): FakeContext {
	return {
		hasUI,
		ui: {
			theme: createTheme(),
			setWorkingIndicator: vi.fn(),
			setWorkingMessage: vi.fn(),
		},
	};
}

describe("color rendering helpers", () => {
	it("uses Pi theme tokens for spinner frames in theme mode", () => {
		const theme = createTheme();

		const frames = createSpinnerFrames(theme, baseColorConfig);

		expect(frames[0]).toBe("[accent:⠋]");
		expect(theme.fg).toHaveBeenCalledWith("accent", "⠋");
		expect(frames.join("")).not.toContain("\x1b[38;2;");
	});

	it("uses custom truecolor ANSI spinner frames in custom mode", () => {
		const frames = createSpinnerFrames(createTheme(), {
			...baseColorConfig,
			colorMode: "custom",
			spinnerColor: "#123abc",
		});

		expect(frames[0]).toBe("\x1b[38;2;18;58;188m⠋\x1b[39m");
	});

	it("uses plain spinner frames in none mode", () => {
		const frames = createSpinnerFrames(createTheme(), {
			...baseColorConfig,
			colorMode: "none",
		});

		expect(frames[0]).toBe("⠋");
		expect(frames.join("")).not.toContain("\x1b[");
	});

	it("derives theme-mode shine colors from the message token so text and gradient bases match", () => {
		const style = createCharacterStyler(createTheme(), baseColorConfig);

		expect(style("A", 0)).toBe("\x1b[38;2;180;158;220mA\x1b[39m");
		expect(style("B", 3)).toBe("\x1b[38;2;141;107;201mB\x1b[39m");
		expect(style("C", 4)).toBe("[customMessageLabel:C]");
		expect(style("D", undefined)).toBe("[customMessageLabel:D]");
	});

	it("falls back to configured shine tokens when the theme base color cannot be derived", () => {
		const style = createCharacterStyler(createFallbackTheme(), baseColorConfig);

		expect(style("A", 0)).toBe("[accent:A]");
		expect(style("B", 2)).toBe("[customMessageLabel:B]");
		expect(style("C", 4)).toBe("[customMessageLabel:C]");
		expect(style("D", undefined)).toBe("[customMessageLabel:D]");
	});

	it("uses custom truecolor ANSI message styling in custom mode", () => {
		const style = createCharacterStyler(createTheme(), {
			...baseColorConfig,
			colorMode: "custom",
			baseColor: "#123456",
		});

		expect(style("A", 0)).toContain("\x1b[38;2;");
		expect(style("B", undefined)).toBe("\x1b[38;2;18;52;86mB\x1b[39m");
	});

	it("uses plain message styling in none mode", () => {
		const style = createCharacterStyler(createTheme(), {
			...baseColorConfig,
			colorMode: "none",
		});

		expect(style("A", 0)).toBe("A");
		expect(style("B", undefined)).toBe("B");
	});
});

describe("createWorkingStatusController", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it("start() sets themed spinner and first message immediately", () => {
		const controller = createWorkingStatusController();
		const ctx = createContext();

		controller.start(ctx as never);

		expect(ctx.ui.setWorkingIndicator).toHaveBeenCalledWith({
			frames: expect.arrayContaining(["[accent:⠋]"]),
			intervalMs: 80,
		});
		expect(ctx.ui.setWorkingMessage).toHaveBeenCalledWith(expect.stringContaining("\x1b[38;2;"));
		expect(ctx.ui.setWorkingMessage).toHaveBeenCalledWith(expect.stringContaining("[customMessageLabel:"));
	});

	it("start() clears previous timers before creating new timers", () => {
		const controller = createWorkingStatusController();
		const ctx = createContext();

		controller.start(ctx as never);
		controller.start(ctx as never);
		const callCountAfterRestart = ctx.ui.setWorkingMessage.mock.calls.length;

		vi.advanceTimersByTime(60);

		expect(ctx.ui.setWorkingMessage.mock.calls.length).toBe(callCountAfterRestart + 1);
	});

	it("stop() clears timers", () => {
		const controller = createWorkingStatusController();
		const ctx = createContext();

		controller.start(ctx as never);
		controller.stop(ctx as never);
		const callCountAfterStop = ctx.ui.setWorkingMessage.mock.calls.length;

		vi.advanceTimersByTime(8000);

		expect(ctx.ui.setWorkingMessage.mock.calls.length).toBe(callCountAfterStop);
	});

	it("stop(ctx) restores the default working message and indicator", () => {
		const controller = createWorkingStatusController();
		const ctx = createContext();

		controller.start(ctx as never);
		controller.stop(ctx as never);

		expect(ctx.ui.setWorkingMessage).toHaveBeenLastCalledWith();
		expect(ctx.ui.setWorkingIndicator).toHaveBeenLastCalledWith();
	});

	it("start(ctx) applies a supplied runtime config", () => {
		const controller = createWorkingStatusController();
		const ctx = createContext();

		controller.start(ctx as never, {
			...baseColorConfig,
			colorMode: "none",
			phrases: ["Configured phrase"],
			phrasesShuffleMs: 5000,
			shineFrameMs: 70,
			shinePauseMs: 900,
			shineStep: 1,
			appendEllipsis: false,
			messageSuffix: "...",
			spinnerFrameMs: 120,
		});

		expect(ctx.ui.setWorkingIndicator).toHaveBeenCalledWith({
			frames: expect.arrayContaining(["⠋"]),
			intervalMs: 120,
		});
		expect(ctx.ui.setWorkingMessage).toHaveBeenCalledWith("Configured phrase");
	});

	it("start(ctx) does nothing UI-specific when ctx.hasUI is false", () => {
		const controller = createWorkingStatusController();
		const ctx = createContext(false);

		controller.start(ctx as never);

		expect(ctx.ui.setWorkingIndicator).not.toHaveBeenCalled();
		expect(ctx.ui.setWorkingMessage).not.toHaveBeenCalled();
	});
});
