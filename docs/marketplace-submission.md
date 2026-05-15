# Marketplace Submission Plan

This project is already structured as a Pi package. The remaining work is mostly release hygiene, proof that the extension works in a fresh Pi install, and deciding whether to publish through the Pi package gallery path or simply share the GitHub install command.

## Goal

Make `pi-working-phrase` easy to review, install, and list in the Pi package gallery/marketplace.

## Current readiness

- Package manifest exists in `package.json` under `pi.extensions` and points to `./src/index.ts`.
- Package metadata includes repository, bugs, homepage, license, author, and `pi-package` / `pi-extension` keywords.
- Runtime code has no third-party dependencies.
- `npm run video:update` records a deterministic, tightly cropped MP4 demo of only the animated spinner/phrase line, extracts a PNG preview for package metadata, generates an animated GIF for the README, and updates `package.json` `pi.video`/`pi.image` metadata.
- `npm run pack:check` currently produces a small package containing source, docs, README, LICENSE, and package metadata.
- README already documents local, git, and Pi package install paths.

## Submission paths

### Fast path: send/share it now

Use this if the marketplace process is informal or you want feedback before publishing to npm.

1. Push the repository publicly to `github.com/brandonmathis/pi-working-phrase`.
2. Create a `v0.1.0` tag or release candidate tag.
3. Send reviewers this install command:

   ```bash
   pi install git:github.com/brandonmathis/pi-working-phrase@v0.1.0
   ```

4. Include the README, this checklist, and the manual QA result.

### Marketplace/package gallery path

Use this when the package should appear in the Pi package gallery.

1. Finish the release checklist below.
2. Add hosted `pi.video` and `pi.image` preview URLs to `package.json` if gallery display quality matters.
3. Publish/tag the package source that the gallery indexes, likely npm with the `pi-package` keyword.
4. Verify the gallery entry shows the right name, description, preview, install command, and repository link.

## TODO checklist

### README and docs

- [ ] Install VHS recorder dependencies: `brew install vhs ffmpeg ttyd` on macOS, or follow the VHS Linux docs.
- [ ] Run `npm run video:update` to generate `docs/assets/pi-working-phrase-demo.mp4`, extract `docs/assets/pi-working-phrase-demo.png`, generate `docs/assets/pi-working-phrase-demo.gif`, and set `package.json` `pi.video`/`pi.image`.
- [ ] Review the generated MP4 before committing it.
- [ ] Confirm README install commands match the final public repository, tag, and package source.
- [ ] Update the tested Pi and Node versions after final manual QA.
- [ ] Add final release notes to `CHANGELOG.md` before tagging.

### Package metadata

- [ ] Confirm `package.json` `name`, `description`, `repository`, `bugs`, `homepage`, `license`, and `keywords` are final.
- [ ] Confirm `package.json` keeps `@mariozechner/pi-coding-agent` in `peerDependencies`, not runtime dependencies.
- [ ] Confirm `pi.extensions` still points at `./src/index.ts`.
- [ ] Confirm `npm run pack:check` contains only intended files.

### Automated checks

Run all checks from a clean checkout:

```bash
npm run video:update -- --dry-run
npm run format:check
npm run lint
npm run typecheck
npm test
npm run pack:check
```

### Manual Pi QA

- [ ] Fresh install with `pi install /path/to/pi-working-phrase` works.
- [ ] Fresh git install with the public URL works.
- [ ] `/reload` works without duplicate timers.
- [ ] First working phrase appears immediately when Pi starts responding.
- [ ] Spinner is colored.
- [ ] Shine animation moves across the phrase.
- [ ] Phrase shuffles after the configured interval.
- [ ] Defaults restore after the agent finishes.
- [ ] Quitting/reloading/new session/fork does not leave timers running.
- [ ] Print/JSON mode remains safe because UI work is skipped when `ctx.hasUI` is false.

### Release and submission

- [ ] Bump or confirm version in `package.json`.
- [ ] Date `CHANGELOG.md` for the release.
- [ ] Create a signed or normal git tag, for example `v0.1.0`.
- [ ] Push the tag and create a GitHub release.
- [ ] If using npm/gallery discovery, run `npm publish` from a clean checkout after `npm pack --dry-run`.
- [ ] Verify installation via the final command users will copy.
- [ ] Submit or send the package link/install command to the Pi marketplace/gallery reviewers.

## Suggested submission message

```txt
Hi Pi team — I'd like to submit pi-working-phrase for the package gallery/marketplace.

Repo: https://github.com/brandonmathis/pi-working-phrase
Install: pi install git:github.com/brandonmathis/pi-working-phrase@v0.1.0
Summary: A tiny dependency-free Pi extension that replaces the active working status with shuffled phrases, a colored spinner, and an ANSI shine animation. It restores Pi defaults on agent completion and session shutdown.

Validation: npm run format:check, npm run lint, npm run typecheck, npm test, npm run pack:check, and manual Pi reload/fresh-install QA.
```

## Open questions

- Does the current Pi marketplace require npm publication, or is a tagged GitHub package enough?
- Where should the preview asset be hosted so `pi.image`/`pi.video` remains stable?
- Should the first marketplace submission use `v0.1.0` or a release candidate tag for review?
