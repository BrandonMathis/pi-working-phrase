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
- Optional no-color mode.
- Configurable shine animation speed.
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

After editing config or phrases, run `/reload` in Pi.

## Configuration quick start

Customize the extension by editing these files:

```txt
src/config.ts
src/phrases.ts
```

### Change phrases

```ts
export const workingPhrases = ["Reticulating splines", "Consulting sacred texts", "Shipping bugs"] as const;
```

### Change phrase shuffle speed

```ts
phrasesShuffleMs: 5000,
```

### Color behavior

By default, `pi-working-phrase` follows your active Pi theme:

```ts
colorMode: "theme",
```

In theme mode, the extension uses Pi theme tokens for the working phrase, shine highlight, shine trail, and spinner:

```ts
themeColors: {
	message: "customMessageLabel",
	shinePeak: "accent",
	shineTrail: "customMessageLabel",
	spinner: "accent",
},
```

This is the recommended mode because it respects the user's selected Pi theme and terminal color capabilities. The shine gradient is derived from `themeColors.message`, so the normal text color and shine base match.

### Use custom colors

To use the extension's built-in purple/green look or your own hex colors, switch to custom mode:

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

### Disable colors

If you want the terminal default foreground color with no ANSI color styling:

```ts
colorMode: "none",
```

### Change shine speed

```ts
shineFrameMs: 40,
```

See [`docs/configuration.md`](docs/configuration.md) for detailed guidance and examples.

## Full configuration table

| Option                   |                Default | Description                                                    |
| ------------------------ | ---------------------: | -------------------------------------------------------------- |
| `phrasesShuffleMs`       |                 `8000` | Milliseconds between phrase changes.                           |
| `shineFrameMs`           |                   `60` | Milliseconds between shine animation frames. Lower is faster.  |
| `shinePauseMs`           |                  `900` | Pause duration after a shine sweep finishes.                   |
| `shineTrailRadius`       |                    `3` | Number of characters affected around the shine peak.           |
| `shineStep`              |                    `1` | Number of character positions advanced per frame.              |
| `colorMode`              |              `"theme"` | Color strategy: `"theme"`, `"custom"`, or `"none"`.            |
| `themeColors.message`    | `"customMessageLabel"` | Pi theme token for normal phrase text and shine gradient base. |
| `themeColors.shinePeak`  |             `"accent"` | Fallback token for the brightest shine character.              |
| `themeColors.shineTrail` | `"customMessageLabel"` | Fallback token for the shine trail.                            |
| `themeColors.spinner`    |             `"accent"` | Pi theme token for spinner frames.                             |
| `baseColor`              |            `"#9776c7"` | Custom-mode phrase color and shine base.                       |
| `spinnerColor`           |            `"#50fa7b"` | Custom-mode spinner color.                                     |
| `appendEllipsis`         |                 `true` | Whether to append a suffix to phrases.                         |
| `messageSuffix`          |                `"..."` | Suffix appended when `appendEllipsis` is enabled.              |
| `spinnerFrameMs`         |                   `80` | Milliseconds between spinner animation frames.                 |
