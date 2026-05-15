# Configuration

`pi-working-phrase` is configured by editing TypeScript files in the extension directory.

```txt
src/config.ts
src/phrases.ts
```

After changing either file, run `/reload` in Pi.

## Phrase customization

Edit `src/phrases.ts` and replace `workingPhrases` with your preferred messages:

```ts
export const workingPhrases = ["Reticulating splines", "Consulting sacred texts", "Shipping bugs"] as const;
```

Rules:

- Use plain strings.
- Empty strings and whitespace-only strings are ignored.
- Phrases are trimmed before display.
- Trailing `...` and `…` are removed before the configured suffix is applied.
- Longer phrase lists are fine; the extension keeps one shuffled queue in memory.

### Short phrase set

```ts
export const workingPhrases = ["Thinking", "Reading", "Planning", "Building"] as const;
```

### Longer phrase set

```ts
export const workingPhrases = [
	"Reticulating splines",
	"Consulting sacred texts",
	"Resolving GUID conflict",
	"Synthesizing wavelets",
	"Downloading RAM",
] as const;
```

### Themed phrase set

```ts
export const workingPhrases = [
	"Opening dark portal",
	"Performing arcane ritual",
	"Enscribing runes",
	"Consulting sacred texts",
] as const;
```

## Timing settings

Edit `src/config.ts`:

```ts
export const config = {
	phrasesShuffleMs: 8000,
	shineFrameMs: 60,
	shinePauseMs: 900,
	shineTrailRadius: 3,
	shineStep: 1,
	spinnerFrameMs: 80,
	// ...color and suffix settings
} as const;
```

| Option             | Suggested range | Notes                                                     |
| ------------------ | --------------: | --------------------------------------------------------- |
| `phrasesShuffleMs` |  `3000`-`15000` | Lower values change messages more often.                  |
| `shineFrameMs`     |      `30`-`120` | Lower values animate faster and update the UI more often. |
| `shinePauseMs`     |    `300`-`2000` | Pause after each shine sweep.                             |
| `spinnerFrameMs`   |      `60`-`150` | Spinner animation speed.                                  |

`shineTrailRadius` controls how many characters around the shine peak are highlighted. `shineStep` controls how many character positions the shine advances per frame.

## Color settings

`colorMode` controls how the working phrase and spinner are styled.

```ts
colorMode: "theme", // "theme" | "custom" | "none"
```

### Theme mode

Theme mode is the default and recommended setting:

```ts
colorMode: "theme",

themeColors: {
	message: "customMessageLabel",
	shinePeak: "accent",
	shineTrail: "customMessageLabel",
	spinner: "accent",
},
```

In this mode, `pi-working-phrase` uses Pi's active theme instead of hard-coded custom colors. This means the extension follows dark themes, light themes, custom themes, and Pi's terminal color fallback behavior.

The shine gradient is derived from `themeColors.message`. That keeps the normal phrase text and the gradient base aligned, so the brighter characters read as a shine instead of a separate accent color.

The default tokens are:

| Option                   | Default                | Purpose                                                                             |
| ------------------------ | ---------------------- | ----------------------------------------------------------------------------------- |
| `themeColors.message`    | `"customMessageLabel"` | Normal working phrase characters and the base for the shine gradient.               |
| `themeColors.shinePeak`  | `"accent"`             | Fallback brightest shine character when the message color cannot derive a gradient. |
| `themeColors.shineTrail` | `"customMessageLabel"` | Fallback shine trail when the message color cannot derive a gradient.               |
| `themeColors.spinner`    | `"accent"`             | Spinner frames.                                                                     |

Pi theme foreground tokens include `text`, `accent`, `muted`, `dim`, `success`, `error`, `warning`, `customMessageText`, `customMessageLabel`, `toolTitle`, and syntax/markdown tokens. See Pi's theme documentation for the full token list.

Example: use subtler colors for the entire working status:

```ts
colorMode: "theme",

themeColors: {
	message: "muted",
	shinePeak: "accent",
	shineTrail: "muted",
	spinner: "muted",
},
```

### Custom mode

Use custom mode to keep the extension's original purple/green look or to choose your own hex colors:

```ts
colorMode: "custom",

baseColor: "#9776c7",
spinnerColor: "#50fa7b",
```

In custom mode:

- `baseColor` controls the working phrase text and shine gradient.
- `spinnerColor` controls the spinner.
- Hex colors such as `#9776c7` and short hex colors such as `#abc` are supported.
- Invalid colors fall back safely to white.

Starter palettes:

```ts
colorMode: "custom",
baseColor: "#9776c7",
spinnerColor: "#50fa7b",
```

```ts
colorMode: "custom",
baseColor: "#8b5cf6",
spinnerColor: "#22c55e",
```

```ts
colorMode: "custom",
baseColor: "#38bdf8",
spinnerColor: "#facc15",
```

If the phrase is hard to read in custom mode, choose a brighter `baseColor` or switch back to theme mode and adjust your Pi theme.

### No-color mode

Use no-color mode if you want the terminal default foreground color and no ANSI color styling from the extension:

```ts
colorMode: "none",
```

In no-color mode, the shine animator still advances internally, but each character is rendered as plain text and the spinner frames are plain glyphs.

## Ellipsis settings

```ts
appendEllipsis: true,
messageSuffix: "...",
```

Examples:

```ts
appendEllipsis: true,
messageSuffix: "...",
```

```ts
appendEllipsis: true,
messageSuffix: "…",
```

```ts
appendEllipsis: false,
messageSuffix: "",
```

When `appendEllipsis` is true, trailing ellipses already present in phrases are removed before `messageSuffix` is appended. This avoids doubled suffixes such as `Working......`.

## Performance notes

- Very low `shineFrameMs` values can cause frequent UI updates.
- Longer phrase lists are fine because only one shuffled queue is held in memory.
- The extension does no work in print or JSON modes because `ctx.hasUI` is checked before UI updates.
