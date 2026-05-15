# Release Checklist

## Before tagging

- [x] Version is bumped in `package.json`.
- [x] `CHANGELOG.md` has the new version and date.
- [x] README installation instructions match the actual package layout.
- [x] `LICENSE` exists.
- [x] `npm run format:check` passes.
- [x] `npm run typecheck` passes.
- [x] `npm test` passes.
- [ ] Manual Pi `/reload` test passes.
- [x] Old duplicate local extensions are not included in packaged output.
- [x] `npm run pack:check` output contains only intended files.
- [x] Package metadata under the `pi` key points at `./src/index.ts`.

## Manual QA

- [ ] Fresh install works.
- [ ] `/reload` works.
- [ ] First render appears immediately.
- [ ] Phrase shuffles.
- [ ] Shine animates.
- [ ] Spinner is colored.
- [ ] Defaults restore after agent completes.
- [ ] Session shutdown does not leave timers running.

## Publishing

- [ ] Create a git tag for the version.
- [ ] Push the tag.
- [ ] Create GitHub release notes summarizing user-facing changes.
- [x] If publishing to npm, verify `npm pack --dry-run` first.

## Marketplace/package gallery

See [`marketplace-submission.md`](marketplace-submission.md) for the full submission plan.

- [ ] Confirm the final install command works from a clean Pi environment.
- [x] Run `npm run video:update` to refresh `pi.video` / `pi.image` preview metadata, or intentionally skip preview metadata.
- [ ] Publish to the package source the gallery indexes, or send the tagged GitHub install command for review.
- [ ] Verify the marketplace/gallery listing shows the expected name, summary, repository, preview, and install instructions.
