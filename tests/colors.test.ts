import { describe, expect, it } from "vitest";
import { colorizeHex, getShineColor } from "../src/colors";

const RESET_FG = "\x1b[39m";

describe("colors", () => {
	it("produces ANSI truecolor escape sequences for #rrggbb colors", () => {
		expect(colorizeHex("x", "#123abc")).toBe("\x1b[38;2;18;58;188mx" + RESET_FG);
	});

	it("accepts short #rgb colors", () => {
		expect(colorizeHex("x", "#abc")).toBe("\x1b[38;2;170;187;204mx" + RESET_FG);
	});

	it("falls back safely for invalid colors", () => {
		expect(colorizeHex("x", "not-a-color")).toBe("\x1b[38;2;255;255;255mx" + RESET_FG);
	});

	it("returns brighter shine colors near the peak", () => {
		expect(getShineColor("#000000", 0)).toBe("#6b6b6b");
		expect(getShineColor("#000000", 3)).toBe("#1f1f1f");
	});

	it("returns the base color outside the shine trail", () => {
		expect(getShineColor("#123456", 99)).toBe("#123456");
	});
});
