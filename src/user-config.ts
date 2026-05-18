import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getAgentDir } from "@earendil-works/pi-coding-agent";
import { defaultConfig, type WorkingPhraseConfig } from "./config";
import { defaultWorkingPhrases } from "./phrases";

export const CONFIG_FILE_NAME = "pi-working-phrase.json";

export type WorkingPhraseUserConfig = Pick<
	Partial<WorkingPhraseConfig>,
	"phrasesShuffleMs" | "baseColor" | "spinnerColor"
> & {
	/** Append local-only phrases after the built-in phrase list. */
	customPhrases?: string[];
};

export type ResolvedWorkingPhraseConfig = WorkingPhraseConfig & {
	phrases: string[];
};

type LoadConfigOptions = {
	agentDir?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function numberOverride(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function stringOverride(value: unknown): string | undefined {
	return typeof value === "string" ? value : undefined;
}

function stringArrayOverride(value: unknown): string[] | undefined {
	if (!Array.isArray(value)) return undefined;
	return value.filter((item): item is string => typeof item === "string");
}

function applyConfigFile(resolved: ResolvedWorkingPhraseConfig, config: unknown): ResolvedWorkingPhraseConfig {
	if (!isRecord(config)) return resolved;

	const next: ResolvedWorkingPhraseConfig = {
		...resolved,
		themeColors: { ...resolved.themeColors },
		phrases: [...resolved.phrases],
	};

	const phrasesShuffleMs = numberOverride(config.phrasesShuffleMs);
	if (phrasesShuffleMs !== undefined) next.phrasesShuffleMs = phrasesShuffleMs;

	const baseColor = stringOverride(config.baseColor);
	const spinnerColor = stringOverride(config.spinnerColor);
	if (baseColor !== undefined) next.baseColor = baseColor;
	if (spinnerColor !== undefined) next.spinnerColor = spinnerColor;
	if (baseColor !== undefined || spinnerColor !== undefined) next.colorMode = "custom";

	const customPhrases = stringArrayOverride(config.customPhrases);
	if (customPhrases) next.phrases.push(...customPhrases);

	return next;
}

function loadConfigFile(path: string): unknown | undefined {
	if (!existsSync(path)) return undefined;

	try {
		return JSON.parse(readFileSync(path, "utf8"));
	} catch {
		return undefined;
	}
}

export function getWorkingPhraseConfigPaths(
	cwd: string,
	options: LoadConfigOptions = {},
): {
	global: string;
	project: string;
} {
	return {
		global: join(options.agentDir ?? getAgentDir(), CONFIG_FILE_NAME),
		project: join(cwd, ".pi", CONFIG_FILE_NAME),
	};
}

export function createDefaultWorkingPhraseConfig(): ResolvedWorkingPhraseConfig {
	return {
		...defaultConfig,
		themeColors: { ...defaultConfig.themeColors },
		phrases: [...defaultWorkingPhrases],
	};
}

export function loadWorkingPhraseConfig(cwd: string, options: LoadConfigOptions = {}): ResolvedWorkingPhraseConfig {
	let resolved = createDefaultWorkingPhraseConfig();
	const paths = getWorkingPhraseConfigPaths(cwd, options);

	for (const path of [paths.global, paths.project]) {
		const config = loadConfigFile(path);
		if (config !== undefined) {
			resolved = applyConfigFile(resolved, config);
		}
	}

	return resolved;
}
