# Contributing

Thanks for helping improve `pi-working-phrase`.

This extension is intentionally small: it customizes Pi's active working status with shuffled phrases, a colored spinner, and a shine animation. Contributions should keep that scope clear and avoid turning the extension into a general settings, command, widget, or theme framework.

## Development setup

```bash
git clone https://github.com/brandonmathis/pi-working-phrase.git
cd pi-working-phrase
npm install
npm test
npm run typecheck
```

For local Pi testing, symlink or copy the checkout into Pi's extension directory:

```bash
mkdir -p ~/.pi/agent/extensions
ln -s "$PWD" ~/.pi/agent/extensions/pi-working-phrase
```

Then run `/reload` in Pi.

## Code style

- Keep runtime code dependency-free unless a dependency has a clear, release-blocking benefit.
- Prefer pure helpers for phrase, color, and shine logic so they stay easy to test.
- Keep `src/index.ts` limited to lifecycle hook registration.
- Keep `src/config.ts` and `src/phrases.ts` as built-in defaults. User customization should happen through sidecar JSON files, not source edits.
- Keep sidecar config intentionally small. Supported user-facing keys are `baseColor`, `spinnerColor`, `customPhrases`, and `phrasesShuffleMs`.

## Testing requirements

Before opening a pull request, run:

```bash
npm run format:check
npm run typecheck
npm test
npm run pack:check
```

For changes that affect loading or timers, also test manually in Pi:

1. Start Pi with the extension installed.
2. Send a prompt and confirm the custom spinner appears immediately.
3. Confirm the working phrase is visible and the shine animation moves.
4. Wait long enough to confirm phrase rotation.
5. Confirm the default working message and indicator restore after the agent finishes.
6. Run `/reload` and confirm no duplicate timers or duplicate statuses remain.

## Pull request checklist

- [ ] I kept the extension focused on working status customization.
- [ ] I added or updated tests for logic changes.
- [ ] I updated docs for user-facing changes.
- [ ] I manually tested `/reload` in Pi when changing extension loading behavior.
- [ ] I verified no duplicate timers continue after `agent_end` or `session_shutdown`.

## Feature boundaries

Good fits:

- Bug fixes.
- Compatibility fixes for Pi lifecycle or UI API changes.
- Documentation improvements.
- Tests and CI improvements.
- Small internal refactors.

Please avoid:

- Slash commands.
- Runtime settings mutation.
- Settings panels.
- New runtime dependencies unless clearly justified.

## Release process

Use the repository's [release skill](.pi/skills/release-pi-extension/SKILL.md)
for preflight, artifact validation, publication, verification, and recovery:

```text
/skill:release-pi-extension
```

Run `/reload` first if the skill was added during your current Pi session.
The skill is maintainer tooling and is not distributed as an extension resource.
See its [research notes](.pi/skills/release-pi-extension/references/release-practices.md)
for official Pi and npm guidance. Publishing requires working maintainer
credentials; a GitHub release does not imply that npm publication succeeded.

Summary checklist:

1. Update `CHANGELOG.md`.
2. Bump `package.json` and `package-lock.json`.
3. Run:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run pack:check
```

4. Commit the release changes.
5. Tag the release with `vX.Y.Z`.
6. Push the branch and tag.
7. Publish the inspected tarball with maintainer authentication, or use an already-configured trusted publishing workflow.
8. Create a GitHub release from the verified tag and curated changelog notes.
9. Verify the remote tag, successful CI, GitHub release, and npm version/integrity. Report each publication channel separately.
