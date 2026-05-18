import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
	CONFIG_FILE_NAME,
	createDefaultWorkingPhraseConfig,
	getWorkingPhraseConfigPaths,
	loadWorkingPhraseConfig,
} from "../src/user-config";

function createTempDir(): string {
	return mkdtempSync(join(tmpdir(), "pi-working-phrase-"));
}

function writeJson(path: string, value: unknown): void {
	writeFileSync(path, `${JSON.stringify(value, null, "\t")}\n`);
}

describe("loadWorkingPhraseConfig", () => {
	it("returns built-in defaults when no sidecar config exists", () => {
		const root = createTempDir();
		const config = loadWorkingPhraseConfig(join(root, "project"), { agentDir: join(root, "agent") });

		expect(config.colorMode).toBe("theme");
		expect(config.phrasesShuffleMs).toBe(8000);
		expect(config.phrases).toEqual(createDefaultWorkingPhraseConfig().phrases);
	});

	it("infers custom color mode when custom colors are configured", () => {
		const root = createTempDir();
		const agentDir = join(root, "agent");
		mkdirSync(agentDir, { recursive: true });
		writeJson(join(agentDir, CONFIG_FILE_NAME), {
			phrasesShuffleMs: 5000,
			baseColor: "#123456",
			spinnerColor: "#abcdef",
		});

		const config = loadWorkingPhraseConfig(join(root, "project"), { agentDir });

		expect(config.phrasesShuffleMs).toBe(5000);
		expect(config.colorMode).toBe("custom");
		expect(config.baseColor).toBe("#123456");
		expect(config.spinnerColor).toBe("#abcdef");
		expect(config.phrases).toEqual(createDefaultWorkingPhraseConfig().phrases);
	});

	it("appends custom phrases after built-in phrases", () => {
		const root = createTempDir();
		const agentDir = join(root, "agent");
		mkdirSync(agentDir, { recursive: true });
		writeJson(join(agentDir, CONFIG_FILE_NAME), {
			customPhrases: ["Asking the rubber duck", "Re-reading the stack trace", 123],
		});

		const config = loadWorkingPhraseConfig(join(root, "project"), { agentDir });
		const defaults = createDefaultWorkingPhraseConfig();

		expect(config.phrases).toEqual([...defaults.phrases, "Asking the rubber duck", "Re-reading the stack trace"]);
	});

	it("lets project sidecar config override speed and append more phrases", () => {
		const root = createTempDir();
		const agentDir = join(root, "agent");
		const projectDir = join(root, "project");
		mkdirSync(agentDir, { recursive: true });
		mkdirSync(join(projectDir, ".pi"), { recursive: true });
		writeJson(join(agentDir, CONFIG_FILE_NAME), {
			phrasesShuffleMs: 5000,
			baseColor: "#111111",
			customPhrases: ["Global custom"],
		});
		writeJson(join(projectDir, ".pi", CONFIG_FILE_NAME), {
			phrasesShuffleMs: 9000,
			spinnerColor: "#222222",
			customPhrases: ["Project custom"],
		});

		const config = loadWorkingPhraseConfig(projectDir, { agentDir });
		const defaults = createDefaultWorkingPhraseConfig();

		expect(config.phrasesShuffleMs).toBe(9000);
		expect(config.colorMode).toBe("custom");
		expect(config.baseColor).toBe("#111111");
		expect(config.spinnerColor).toBe("#222222");
		expect(config.phrases).toEqual([...defaults.phrases, "Global custom", "Project custom"]);
	});

	it("ignores unsupported sidecar options", () => {
		const root = createTempDir();
		const agentDir = join(root, "agent");
		mkdirSync(agentDir, { recursive: true });
		writeJson(join(agentDir, CONFIG_FILE_NAME), {
			phrases: ["Reticulating splines"],
			extraPhrases: ["Asking the rubber duck"],
			phraseFiles: ["phrases.txt"],
			colorMode: "custom",
			shineFrameMs: 40,
			shinePauseMs: 300,
			shineTrailRadius: 1,
			shineStep: 2,
			appendEllipsis: false,
			messageSuffix: "",
			spinnerFrameMs: 120,
			themeColors: { spinner: "muted" },
		});

		const config = loadWorkingPhraseConfig(join(root, "project"), { agentDir });
		const defaults = createDefaultWorkingPhraseConfig();

		expect(config.colorMode).toBe(defaults.colorMode);
		expect(config.phrases).toEqual(defaults.phrases);
		expect(config.shineFrameMs).toBe(defaults.shineFrameMs);
		expect(config.shinePauseMs).toBe(defaults.shinePauseMs);
		expect(config.shineTrailRadius).toBe(defaults.shineTrailRadius);
		expect(config.shineStep).toBe(defaults.shineStep);
		expect(config.appendEllipsis).toBe(defaults.appendEllipsis);
		expect(config.messageSuffix).toBe(defaults.messageSuffix);
		expect(config.spinnerFrameMs).toBe(defaults.spinnerFrameMs);
		expect(config.themeColors).toEqual(defaults.themeColors);
	});

	it("ignores invalid JSON and invalid value types", () => {
		const root = createTempDir();
		const agentDir = join(root, "agent");
		const projectDir = join(root, "project");
		mkdirSync(agentDir, { recursive: true });
		mkdirSync(join(projectDir, ".pi"), { recursive: true });
		writeFileSync(join(agentDir, CONFIG_FILE_NAME), "{ invalid json");
		writeJson(join(projectDir, ".pi", CONFIG_FILE_NAME), {
			phrasesShuffleMs: "fast",
			baseColor: 123,
			spinnerColor: false,
			customPhrases: "not an array",
		});

		const config = loadWorkingPhraseConfig(projectDir, { agentDir });
		const defaults = createDefaultWorkingPhraseConfig();

		expect(config.colorMode).toBe(defaults.colorMode);
		expect(config.phrasesShuffleMs).toBe(defaults.phrasesShuffleMs);
		expect(config.phrases).toEqual(defaults.phrases);
	});
});

describe("getWorkingPhraseConfigPaths", () => {
	it("returns global and project sidecar paths", () => {
		const paths = getWorkingPhraseConfigPaths("/tmp/project", { agentDir: "/tmp/agent" });

		expect(paths.global).toBe(`/tmp/agent/${CONFIG_FILE_NAME}`);
		expect(paths.project).toBe(`/tmp/project/.pi/${CONFIG_FILE_NAME}`);
	});
});
