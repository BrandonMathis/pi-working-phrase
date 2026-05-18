# Troubleshooting

## Extension does not load

Confirm the extension is installed at:

```txt
~/.pi/agent/extensions/pi-working-phrase/src/index.ts
```

Then run `/reload` in Pi.

If reload is not enough, restart Pi. Also confirm that the checkout includes all files imported by `src/index.ts`, such as `src/timers.ts`, `src/user-config.ts`, `src/config.ts`, `src/phrases.ts`, `src/shine.ts`, `src/colors.ts`, and `src/phrases-rotator.ts`.

## Duplicate or conflicting status messages

Remove older local extensions that also call:

- `ctx.ui.setWorkingMessage()`
- `ctx.ui.setWorkingIndicator()`

If this extension was migrated from local experiments, check for old files such as:

- `working-verbs.ts`
- `working-shine.ts`

Only one extension should own the active working status at a time.

## Colors do not display correctly

By default, the extension follows your active Pi theme. Custom color mode is inferred when `baseColor` or `spinnerColor` is set in sidecar config.

- If the default theme colors are hard to read, adjust your Pi theme or set `baseColor` / `spinnerColor`.
- In custom mode, check that your terminal supports truecolor ANSI escapes.
- To return to theme colors, remove `baseColor` and `spinnerColor` from the sidecar config.

Markdown, logs, and non-TUI environments may show raw ANSI codes or no animation.

## Phrases are not changing

- Confirm `phrasesShuffleMs` is not set too high.
- Send another prompt so config is re-read, or run `/reload` after editing `~/.pi/agent/pi-working-phrase.json` or `<project>/.pi/pi-working-phrase.json`.

Working phrases are bundled in `src/phrases.ts`. Add local-only phrases with `customPhrases` in the sidecar config.

## No changes in print or JSON mode

The extension checks `ctx.hasUI` before updating the working message or spinner. Print and JSON modes do not render Pi's interactive TUI working indicator, so there is nothing visible to update.
