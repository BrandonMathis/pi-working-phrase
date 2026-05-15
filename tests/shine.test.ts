import { describe, expect, it } from "vitest";
import { createShineAnimator } from "../src/shine";

function createAnimator() {
	return createShineAnimator({
		frameMs: 60,
		pauseMs: 120,
		trailRadius: 2,
		step: 1,
	});
}

function distanceStyle(character: string, distance: number | undefined): string {
	return `<${character}:${distance ?? "pause"}>`;
}

describe("createShineAnimator", () => {
	it("renders output with a caller-provided character style", () => {
		const animator = createAnimator();
		animator.reset("Hello");

		const output = animator.render("Hello", distanceStyle);

		expect(output).toContain("<H:");
		expect(output).toContain("<e:");
		expect(output).not.toContain("\x1b[38;2;");
	});

	it("preserves spaces without styling them", () => {
		const animator = createAnimator();
		animator.reset("A B");

		const output = animator.render("A B", distanceStyle);

		expect(output).toContain("> <");
		expect(output).not.toContain("< :");
	});

	it("handles empty messages", () => {
		const animator = createAnimator();
		animator.reset("");

		expect(animator.render("", distanceStyle)).toBe("");
		expect(() => animator.advance("")).not.toThrow();
	});

	it("advances forward and reverse without throwing", () => {
		const animator = createAnimator();
		animator.reset("Hello");

		for (let index = 0; index < 40; index += 1) {
			expect(() => animator.advance("Hello")).not.toThrow();
		}
	});

	it("resets cleanly when the message changes", () => {
		const animator = createAnimator();
		animator.reset("First");
		animator.advance("First");
		animator.reset("Second");

		expect(animator.render("Second", distanceStyle)).toContain("<S:");
	});

	it("preserves shine progress when retargeting to a different message length", () => {
		const animator = createShineAnimator({
			frameMs: 60,
			pauseMs: 120,
			trailRadius: 0,
			step: 1,
		});
		const peakStyle = (character: string, distance: number | undefined): string =>
			distance === 0 ? `[${character}]` : character;

		animator.reset("abcde");
		animator.advance("abcde");
		animator.advance("abcde");
		animator.retarget("abcde", "ABCDEFGHIJ");

		const output = animator.render("ABCDEFGHIJ", peakStyle);

		expect(output).toContain("[F]");
		expect(output).not.toContain("[A]");
	});
});
