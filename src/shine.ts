import { colorize, getShineColor } from "./colors";

type ShinePhase = "forward" | "pause-after-forward" | "reverse" | "pause-after-reverse";

type ShineAnimatorOptions = {
	baseColor: string;
	frameMs: number;
	pauseMs: number;
	trailRadius: number;
	step: number;
};

function getCharacters(message: string): string[] {
	return [...message];
}

function getBounds(message: string, trailRadius: number): { min: number; max: number } {
	const lastCharacterIndex = Math.max(0, getCharacters(message).length - 1);
	return {
		min: -trailRadius,
		max: lastCharacterIndex + trailRadius,
	};
}

function clampProgress(value: number): number {
	return Math.max(0, Math.min(1, value));
}

function mapPosition(
	position: number,
	fromBounds: { min: number; max: number },
	toBounds: { min: number; max: number },
): number {
	const fromRange = fromBounds.max - fromBounds.min;
	const toRange = toBounds.max - toBounds.min;
	const progress = fromRange === 0 ? 0 : clampProgress((position - fromBounds.min) / fromRange);

	return Math.round(toBounds.min + progress * toRange);
}

export function createShineAnimator(options: ShineAnimatorOptions): {
	reset(message: string): void;
	retarget(previousMessage: string, nextMessage: string): void;
	advance(message: string): void;
	render(message: string): string;
} {
	const frameMs = Math.max(1, options.frameMs);
	const pauseFrames = Math.max(1, Math.ceil(Math.max(0, options.pauseMs) / frameMs));
	const trailRadius = Math.max(0, Math.floor(options.trailRadius));
	const step = Math.max(1, Math.floor(options.step));

	let phase: ShinePhase = "forward";
	let position = -trailRadius;
	let pauseFrame = 0;

	function reset(message: string): void {
		const { min } = getBounds(message, trailRadius);
		phase = "forward";
		position = min;
		pauseFrame = 0;
	}

	function currentPeak(): number | undefined {
		return phase === "forward" || phase === "reverse" ? position : undefined;
	}

	return {
		reset,
		retarget(previousMessage: string, nextMessage: string): void {
			const previousBounds = getBounds(previousMessage, trailRadius);
			const nextBounds = getBounds(nextMessage, trailRadius);

			switch (phase) {
				case "pause-after-forward":
					position = nextBounds.max;
					break;
				case "pause-after-reverse":
					position = nextBounds.min;
					break;
				case "forward":
				case "reverse":
					position = mapPosition(position, previousBounds, nextBounds);
					break;
			}
		},
		advance(message: string): void {
			const { min, max } = getBounds(message, trailRadius);

			switch (phase) {
				case "forward":
					position += step;
					if (position > max) {
						phase = "pause-after-forward";
						pauseFrame = 0;
					}
					break;
				case "pause-after-forward":
					pauseFrame += 1;
					if (pauseFrame >= pauseFrames) {
						phase = "reverse";
						position = max;
					}
					break;
				case "reverse":
					position -= step;
					if (position < min) {
						phase = "pause-after-reverse";
						pauseFrame = 0;
					}
					break;
				case "pause-after-reverse":
					pauseFrame += 1;
					if (pauseFrame >= pauseFrames) {
						phase = "forward";
						position = min;
					}
					break;
			}
		},
		render(message: string): string {
			const peak = currentPeak();
			return getCharacters(message)
				.map((character, index) => {
					if (character === " ") return character;

					const distance = peak === undefined ? Number.POSITIVE_INFINITY : Math.abs(index - peak);
					const color = distance <= trailRadius ? getShineColor(options.baseColor, distance) : options.baseColor;
					return colorize(character, color);
				})
				.join("");
		},
	};
}
