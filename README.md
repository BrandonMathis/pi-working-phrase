# pi-working-phrase

A tiny Pi extension that replaces Pi's working status with shuffled phrases, a colored spinner, and an animated shine gradient.

## Preview

When Pi is responding, the standard working line is replaced with an animated spinner and shuffled phrase:

[![pi-working-phrase animated preview](docs/assets/pi-working-phrase-demo.gif)](docs/assets/pi-working-phrase-demo.mp4)

## Features

- Shuffled working phrases while Pi is responding.
- Configurable phrase shuffle speed.
- Animated shine gradient on the working message.
- Single configurable base color for the shine effect.
- Configurable spinner color.
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

### Change shine color

```ts
baseColor: "#8b5cf6",
```

### Change spinner color

```ts
spinnerColor: "#22c55e",
```

### Change shine speed

```ts
shineFrameMs: 40,
```

See [`docs/configuration.md`](docs/configuration.md) for detailed guidance and examples.

## Full configuration table

| Option             |     Default | Description                                                   |
| ------------------ | ----------: | ------------------------------------------------------------- |
| `phrasesShuffleMs` |      `8000` | Milliseconds between phrase changes.                          |
| `shineFrameMs`     |        `60` | Milliseconds between shine animation frames. Lower is faster. |
| `shinePauseMs`     |       `900` | Pause duration after a shine sweep finishes.                  |
| `shineTrailRadius` |         `3` | Number of characters affected around the shine peak.          |
| `shineStep`        |         `1` | Number of character positions advanced per frame.             |
| `baseColor`        | `"#9776c7"` | Base text color used to derive the shine gradient.            |
| `spinnerColor`     | `"#50fa7b"` | ANSI foreground color for spinner frames.                     |
| `appendEllipsis`   |      `true` | Whether to append a suffix to phrases.                        |
| `messageSuffix`    |     `"..."` | Suffix appended when `appendEllipsis` is enabled.             |
| `spinnerFrameMs`   |        `80` | Milliseconds between spinner animation frames.                |
