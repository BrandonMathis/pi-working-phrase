# pi-working-phrase

A tiny Pi extension that replaces Pi's working status with shuffled phrases, a theme-aware spinner, and an animated shine effect.

## Preview

When Pi is responding, the standard working line is replaced with an animated spinner and shuffled phrase:

[![pi-working-phrase animated preview](docs/assets/pi-working-phrase-demo.gif)](docs/assets/pi-working-phrase-demo.mp4)

## Features

- Shuffled working phrases while Pi is responding.
- Configurable phrase shuffle speed.
- Animated shine effect on the working message.
- Theme-aware colors by default.
- Optional custom hex colors for the shine effect and spinner.
- Optional local custom phrases through sidecar config.
- Minimal sidecar config: custom colors, phrase rotation speed, and appended phrases only.
- No runtime dependencies.
- Restores Pi defaults when the agent finishes or the session shuts down.

## Requirements

- Pi coding agent installed.
- Node.js compatible with your installed Pi release.
- Extension installed in a Pi auto-discovery location.

Requires Pi with extension auto-discovery support. This extension is written in TypeScript and is loaded by Pi directly; no build step is required for local use.

## Installation

```bash
pi install git:github.com/brandonmathis/pi-working-phrase
```

## Usage

Start using Pi normally. When Pi begins responding, `pi-working-phrase` sets a custom working message and spinner. When the response completes, the extension restores Pi's defaults.

No slash commands are added by this extension.

Config is read when the next Pi response starts. If you want to force a full extension reload, run `/reload` in Pi.

## Configuration quick start

Customize the extension with a sidecar JSON file instead of editing files in `src/`.

| Path                                   | Scope                                                                            |
| -------------------------------------- | -------------------------------------------------------------------------------- |
| `~/.pi/agent/pi-working-phrase.json`   | Global, all projects. Honors `PI_CODING_AGENT_DIR` through Pi's agent directory. |
| `<project>/.pi/pi-working-phrase.json` | Project-local override.                                                          |

Project config is merged over global config. Unknown or invalid values are ignored safely.

Custom colors, phrase rotation speed, and local appended phrases are configurable from sidecar JSON. Built-in working phrases live in `src/phrases.ts`.

### Use custom colors

By default, `pi-working-phrase` follows your active Pi theme. To use custom colors, set `baseColor` and/or `spinnerColor`; custom color mode is inferred automatically:

```json
{
	"baseColor": "#9776c7",
	"spinnerColor": "#50fa7b"
}
```

- `baseColor` controls the working phrase text and shine gradient.
- `spinnerColor` controls the spinner.
- Hex colors such as `#9776c7` and short hex colors such as `#abc` are supported.
- Invalid colors fall back safely to white.

To return to theme colors, remove `baseColor` and `spinnerColor`.

### Add custom phrases

Append local-only phrases with `customPhrases`:

```json
{
	"customPhrases": ["Asking the rubber duck"]
}
```

### Change phrase rotation speed

```json
{
	"phrasesShuffleMs": 5000
}
```

See [`docs/configuration.md`](docs/configuration.md) for detailed guidance and examples.

## Full configuration table

| Option             |     Default | Description                                                  |
| ------------------ | ----------: | ------------------------------------------------------------ |
| `baseColor`        | `undefined` | Enables custom mode and sets custom-mode phrase/shine color. |
| `spinnerColor`     | `undefined` | Enables custom mode and sets custom-mode spinner color.      |
| `customPhrases`    |        `[]` | Appends local-only phrases after the built-in phrase list.   |
| `phrasesShuffleMs` |      `8000` | Milliseconds between phrase changes.                         |
