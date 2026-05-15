import process from "node:process";
import { setTimeout as sleep } from "node:timers/promises";
import { colorize } from "../src/colors";
import { config } from "../src/config";
import { workingPhrases } from "../src/phrases";
import { createPhraseRotator } from "../src/phrases-rotator";
import { createShineAnimator } from "../src/shine";

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"] as const;
const DEMO_PHRASES = new Set([
	"Hacking",
	"Adjusting bell curves",
	"Consulting sacred texts",
	"Downloading RAM",
	"Gathering entropy",
	"Building additional pylons",
]);

const CLEAR_SCREEN = "\x1b[2J\x1b[H";
const CLEAR_LINE = "\x1b[2K\r";
const HIDE_CURSOR = "\x1b[?25l";
const SHOW_CURSOR = "\x1b[?25h";
const DEMO_DURATION_MS = positiveMillisecondsFromEnv("PI_WORKING_PHRASE_DEMO_MS", 9200);
const DEMO_PHRASE_SHUFFLE_MS = positiveMillisecondsFromEnv("PI_WORKING_PHRASE_DEMO_PHRASE_MS", config.phrasesShuffleMs);
const RANDOM_SEED = 0x5049;

function createSeededRandom(seed: number): () => number {
	let state = seed >>> 0;

	return () => {
		state = (state * 1664525 + 1013904223) >>> 0;
		return state / 0x100000000;
	};
}

function intervalMs(value: number): number {
	return Math.max(1, Math.floor(value));
}

function positiveMillisecondsFromEnv(name: string, fallback: number): number {
	const value = Number(process.env[name] ?? fallback);
	return intervalMs(Number.isFinite(value) ? value : fallback);
}

function write(text: string): void {
	process.stdout.write(text);
}

function getDemoPhrases(): readonly string[] {
	const curatedPhrases = workingPhrases.filter((phrase) => DEMO_PHRASES.has(phrase));
	return curatedPhrases.length > 0 ? curatedPhrases : workingPhrases.slice(0, 5);
}

function restoreTerminal(): void {
	write(SHOW_CURSOR);
}

process.on("SIGINT", () => {
	restoreTerminal();
	process.exit(130);
});

process.on("SIGTERM", () => {
	restoreTerminal();
	process.exit(143);
});

async function main(): Promise<void> {
	const originalRandom = Math.random;
	Math.random = createSeededRandom(RANDOM_SEED);

	const phraseRotator = createPhraseRotator(getDemoPhrases(), {
		appendEllipsis: config.appendEllipsis,
		suffix: config.messageSuffix,
	});
	const shineAnimator = createShineAnimator({
		baseColor: config.baseColor,
		frameMs: config.shineFrameMs,
		pauseMs: config.shinePauseMs,
		trailRadius: config.shineTrailRadius,
		step: config.shineStep,
	});

	Math.random = originalRandom;

	let currentMessage = phraseRotator.nextMessage();
	let nextPhraseAt = DEMO_PHRASE_SHUFFLE_MS;
	const frameMs = intervalMs(config.shineFrameMs);
	const spinnerFrameMs = intervalMs(config.spinnerFrameMs);
	const startedAt = Date.now();

	shineAnimator.reset(currentMessage);

	write(HIDE_CURSOR);
	write(CLEAR_SCREEN);

	try {
		while (Date.now() - startedAt < DEMO_DURATION_MS) {
			const elapsedMs = Date.now() - startedAt;

			if (elapsedMs >= nextPhraseAt) {
				const previousMessage = currentMessage;
				currentMessage = phraseRotator.nextMessage();
				shineAnimator.retarget(previousMessage, currentMessage);
				nextPhraseAt += DEMO_PHRASE_SHUFFLE_MS;
			}

			const spinnerIndex = Math.floor(elapsedMs / spinnerFrameMs) % SPINNER_FRAMES.length;
			const spinner = colorize(SPINNER_FRAMES[spinnerIndex] ?? SPINNER_FRAMES[0], config.spinnerColor);
			write(`${CLEAR_LINE}${spinner} ${shineAnimator.render(currentMessage)}`);

			shineAnimator.advance(currentMessage);
			await sleep(frameMs);
		}

		write(CLEAR_LINE);
	} finally {
		restoreTerminal();
	}
}

await main();
