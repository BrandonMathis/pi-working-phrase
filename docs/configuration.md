# Configuration

`pi-working-phrase` is configured with a small sidecar JSON file. You should not need to edit files in `src/` for local customization.

| Path                                   | Scope                                                                                       |
| -------------------------------------- | ------------------------------------------------------------------------------------------- |
| `~/.pi/agent/pi-working-phrase.json`   | Global, all projects. Honors `PI_CODING_AGENT_DIR` through Pi's configured agent directory. |
| `<project>/.pi/pi-working-phrase.json` | Project-local override.                                                                     |

Configuration is merged in this order:

```txt
built-in defaults → global sidecar config → project sidecar config
```

Config is read when the next Pi response starts. If you want to force a full extension reload, run `/reload` in Pi or restart Pi.

Only custom colors, phrase rotation speed, and local appended phrases are configurable from sidecar JSON. Unknown keys, invalid value types, and invalid JSON are ignored safely. Built-in working phrases live in `src/phrases.ts`.

## Minimal example

```json
{
	"baseColor": "#9776c7",
	"spinnerColor": "#50fa7b",
	"customPhrases": []
}
```

## Color settings

By default, `pi-working-phrase` follows your active Pi theme. To use custom colors, set `baseColor` and/or `spinnerColor` in your sidecar config. The extension infers custom color mode when either custom color is present.

```json
{
	"baseColor": "#9776c7",
	"spinnerColor": "#50fa7b"
}
```

- `baseColor` controls the working phrase text and shine gradient.
- `spinnerColor` controls the spinner.
- If only one color is set, the other uses the built-in default.
- Hex colors such as `#9776c7` and short hex colors such as `#abc` are supported.
- Invalid colors fall back safely to white.

To return to theme colors, remove `baseColor` and `spinnerColor` from the sidecar config.

Starter palettes:

```json
{
	"baseColor": "#9776c7",
	"spinnerColor": "#50fa7b"
}
```

```json
{
	"baseColor": "#8b5cf6",
	"spinnerColor": "#22c55e"
}
```

```json
{
	"baseColor": "#38bdf8",
	"spinnerColor": "#facc15"
}
```

## Custom phrases

Built-in phrases are bundled in `src/phrases.ts`. Add local-only phrases with `customPhrases`:

```json
{
	"customPhrases": ["Asking the rubber duck", "Re-reading the stack trace"]
}
```

`customPhrases` appends to the built-in phrase list. It does not replace built-in phrases. Project config runs after global config, so project `customPhrases` append after global `customPhrases`.

Phrase display rules:

- Use plain strings.
- Empty strings and whitespace-only strings are ignored during display.
- Phrases are trimmed before display.
- Trailing `...` and `…` are removed before the built-in suffix is applied.

## Phrase rotation speed

Use `phrasesShuffleMs` to control how often the working phrase changes:

```json
{
	"phrasesShuffleMs": 5000
}
```

| Option             | Suggested range | Notes                                    |
| ------------------ | --------------: | ---------------------------------------- |
| `phrasesShuffleMs` |  `3000`-`15000` | Lower values change messages more often. |

## Full configuration reference

| Option             |     Default | Description                                                  |
| ------------------ | ----------: | ------------------------------------------------------------ |
| `baseColor`        | `undefined` | Enables custom mode and sets custom-mode phrase/shine color. |
| `spinnerColor`     | `undefined` | Enables custom mode and sets custom-mode spinner color.      |
| `customPhrases`    |        `[]` | Appends local-only phrases after the built-in phrase list.   |
| `phrasesShuffleMs` |      `8000` | Milliseconds between phrase changes.                         |

## Performance notes

- Very low `phrasesShuffleMs` values can change messages too frequently to read comfortably.
- Longer phrase lists are fine because only one shuffled queue is held in memory.
- The extension does no work in print or JSON modes because `ctx.hasUI` is checked before UI updates.
