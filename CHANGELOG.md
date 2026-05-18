# Changelog

All notable changes to `pi-working-phrase` will be documented in this file.

## 0.2.0 - 2026-05-18

- Adds sidecar config loading from `~/.pi/agent/pi-working-phrase.json` and `<project>/.pi/pi-working-phrase.json`.
- Keeps sidecar config intentionally small: `baseColor`, `spinnerColor`, `customPhrases`, and `phrasesShuffleMs`.
- Infers custom color mode when `baseColor` or `spinnerColor` is present; otherwise theme colors are used.
- Adds `customPhrases` for appending local-only phrases without replacing built-in phrases.
- Moves the expanded built-in working phrase list into `src/phrases.ts`.
- Updates documentation and tests for the simplified config model.

## 0.1.0 - 2026-05-15

- Initial Pi extension package candidate.
- Adds shuffled working phrases while Pi is responding.
- Adds configurable colored spinner frames.
- Adds ANSI truecolor shine animation for the working message.
- Restores Pi defaults on agent end and session shutdown.
