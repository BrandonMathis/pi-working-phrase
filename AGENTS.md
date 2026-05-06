# AGENTS.md

Guidance for coding agents working on `pi-working-phrase`.

## Project purpose

`pi-working-phrase` is a small Pi coding agent extension that replaces Pi's active working status while the agent is responding. It provides:

- shuffled working phrases,
- a custom colored spinner,
- an ANSI truecolor "shine" sweep over the working message,
- safe cleanup that restores Pi's default working message and indicator after the response or on session shutdown.

Keep the project focused on working-status customization. Avoid turning it into a general settings UI, command framework, widget system, footer/theme extension, or dependency-heavy package unless the maintainer explicitly changes scope.

## Where to look first

- `README.md` - user-facing overview, install, configuration, compatibility, and troubleshooting summary.
- `CONTRIBUTING.md` - contribution boundaries, local setup, test checklist, release notes.
- `docs/development.md` - project architecture and manual Pi test checklist.
- `docs/configuration.md` - supported phrase/color/timing settings.
- Pi API docs, when changing extension behavior:
  - `node_modules/@mariozechner/pi-coding-agent/docs/extensions.md`
  - `node_modules/@mariozechner/pi-coding-agent/docs/tui.md`
  - `node_modules/@mariozechner/pi-coding-agent/docs/packages.md`
  - `node_modules/@mariozechner/pi-coding-agent/examples/extensions/working-indicator.ts`

## Architecture map

| Path                     | Responsibility                                                                   |
| ------------------------ | -------------------------------------------------------------------------------- |
| `src/index.ts`           | Pi extension entrypoint. Register lifecycle hooks only.                          |
| `src/timers.ts`          | Coordinates Pi UI updates, timers, spinner frames, phrase rotation, and cleanup. |
| `src/config.ts`          | User-editable timing, color, suffix, and spinner settings.                       |
| `src/phrases.ts`         | User-editable phrase list.                                                       |
| `src/phrases-rotator.ts` | Pure phrase normalization, shuffling, fallback text, and repeat avoidance.       |
| `src/shine.ts`           | Pure shine animation state machine and message rendering.                        |
| `src/colors.ts`          | ANSI truecolor, hex normalization, RGB conversion, and highlight color helpers.  |
| `tests/`                 | Vitest unit tests for pure helpers and fake-timer controller behavior.           |
| `docs/`                  | User/developer docs. Update these for user-facing behavior changes.              |

The package manifest declares the Pi extension entry under:

```json
"pi": {
  "extensions": ["./src/index.ts"]
}
```

Pi loads the TypeScript source directly; there is no build step for normal local use.

## Important Pi API behavior

- `agent_start` and `agent_end` fire once per user prompt. This extension starts animation on `agent_start` and restores defaults on `agent_end`.
- `session_shutdown` fires for quit, reload, new/resume/fork flows. Always clean timers here.
- Check `ctx.hasUI` before doing UI work. Print/JSON modes do not have an interactive TUI.
- `ctx.ui.setWorkingMessage(text)` replaces the streaming working message. Calling `ctx.ui.setWorkingMessage()` with no argument restores Pi's default message.
- `ctx.ui.setWorkingIndicator(options)` replaces the streaming spinner. Custom frames are rendered verbatim, so this project adds its own ANSI color escapes. Calling `ctx.ui.setWorkingIndicator()` with no argument restores Pi's default spinner.
- Do not use `ctx.ui.setStatus`, widgets, custom footers, slash commands, persisted settings, or custom components unless the feature scope is intentionally expanded.

## Change guidelines

### Lifecycle and timers

- Keep `src/index.ts` thin: import the controller, register `agent_start`, `agent_end`, and `session_shutdown`.
- Use one controller instance per extension runtime.
- Restore Pi defaults in `stop(ctx)` by calling both `ctx.ui.setWorkingMessage()` and `ctx.ui.setWorkingIndicator()` when `ctx.hasUI` is true.

### Shine animation

- `createShineAnimator()` is intentionally pure and UI-agnostic.
- It moves a peak forward, pauses, reverses, pauses again, then repeats.
- It renders with ANSI truecolor escapes from `src/colors.ts`.
- Spaces are preserved without color codes so words remain readable.
- The implementation uses `[...message]` to iterate Unicode code points. If adding emoji/grapheme-aware behavior, add focused tests because terminal display width can differ from JavaScript string length.
- Keep `frameMs`, `pauseMs`, `trailRadius`, and `step` clamped defensively so bad config values cannot crash the extension.

### Colors

- Use the local `colorize()` helper instead of adding a coloring dependency.
- Colors are hex strings. `#rgb` and `#rrggbb` are supported; invalid colors safely fall back to white.
- The shine gradient is derived by lightening `baseColor` near the moving peak. Update `tests/colors.test.ts` if this algorithm changes.
- ANSI reset currently uses foreground reset (`\x1b[39m`). Preserve this unless there is a specific reason to reset more state.

### Phrases

- `src/phrases.ts` should export `workingPhrases` as a readonly `as const` array.
- `createPhraseRotator()` trims phrases, drops empties, removes trailing `...`/`…`, appends the configured suffix, shuffles, and avoids immediate repeats when possible.
- Keep phrase logic pure and covered by `tests/phrases-rotator.test.ts`.

### Configuration

- User-tunable defaults live in `src/config.ts`.
- If adding or renaming config fields, update:
  - `README.md` configuration sections,
  - `docs/configuration.md`,
  - any affected tests.
- Keep config simple TypeScript. Do not add persisted settings, settings panels, or runtime mutation without explicit direction.

### Dependencies and packaging

- Runtime code should remain dependency-free.
- Pi core imports such as `@mariozechner/pi-coding-agent` belong in `peerDependencies`, not bundled runtime dependencies.
- Do not commit generated tarballs, coverage output, `dist/`, or unrelated package manager artifacts.
- Use `npm run pack:check` before release/package changes.
