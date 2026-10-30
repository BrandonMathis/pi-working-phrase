# Pi extension release practices

Research checked against official documentation on 2026-10-30. Recheck upstream guidance before changing packaging or authentication strategy; installed Pi versions can differ from current docs.

## Pi-specific requirements

Source: [Pi Packages](https://pi.dev/docs/latest/packages), compared with the installed host's `docs/packages.md`.

- Pi distributes ordinary packages through npm, git, or local paths. A GitHub release is useful release documentation but is not npm publication.
- Use explicit resource paths when sources are outside conventional `extensions/` directories. This project already declares `pi.extensions: ["./src/index.ts"]`; ship the TypeScript source and its imports, not an unnecessary build product.
- The `pi-package` npm keyword makes a package eligible for the Pi gallery. `pi.image` and `pi.video` supply previews; gallery indexing is not itself a release gate or guaranteed immediate result.
- Declare imported host-provided packages as peers with `"*"` rather than bundling duplicate host code. Keep this extension's runtime dependency-free.
- Exact npm versions, git tags, and commits pin installs. Give users pinned commands for reproducibility; do not move a published tag.
- Current Pi docs describe extension update notes from `CHANGELOG.md` and package version headings such as `## 0.2.1 - 2026-10-30`. Git installations also need a package version increment for these notes. Older installed Pi docs may not yet describe this feature.
- Pi extensions execute with system access. Inspect published contents and avoid shipping secrets, local sidecar config, or unintended operational resources.

## npm and supply-chain practices

Sources: [npm publish](https://docs.npmjs.com/cli/v11/commands/npm-publish/), [trusted publishers](https://docs.npmjs.com/trusted-publishers/).

- Use a locked clean install, automated format/lint/type/test gates, and both a package dry run and actual artifact inspection. Publish the exact inspected tarball when releasing locally.
- The npm `files` allowlist bounds distribution. A successful test suite does not prove the package contains its entrypoint; inspect the tarball separately.
- Published name/version pairs cannot be reused, even after unpublishing. Check registry state before mutation and after ambiguous failures.
- Stable versions normally use `latest`; prereleases should use an agreed separate tag. Verify registry metadata and artifact integrity after publishing.
- For future release automation, prefer npm trusted publishing with OIDC over long-lived write tokens. Configure the exact repository/workflow and, where appropriate, a protected environment. Keep publication permissions minimal and never release untrusted PR code.
- Current trusted-publishing docs require npm >=11.5.1 and Node >=22.14.0 on supported hosted CI runners. Do not assume the local npm version or a normal `npm whoami` check establishes OIDC support.
- Trusted publishing automatically generates provenance for qualifying public GitHub Actions/GitLab releases. Provenance is a CI capability, not something to fabricate or request from a local machine.
- Current npm guidance also offers staged publishing with human 2FA approval. Treat adopting it or configuring trusted publishers as a separate maintainer/security change, not an implicit prerequisite or workaround for this repository's existing manual release process.
- Keep 2FA intact. An expired local credential requires maintainer action; never copy tokens into the repository or silently change package security settings.

## Versioning and release traceability

- Review the diff since the previous tag and choose the smallest justified SemVer change. Phrase additions/corrections that preserve extension/config APIs are patch-level changes here. Additive config/API features warrant a minor release; escalate breaking pre-1.0 policy choices.
- Synchronize package and lockfile versions, record a dated user-facing changelog, create an annotated immutable tag, and write curated GitHub notes from that entry.
- Record the exact release commit, successful CI run, tag, artifact hash, registry version, and release URLs. Track GitHub and npm independently; do not represent partial publication as complete.
- For timer/loading/UI changes, run the project's manual interactive smoke checklist. For content-only changes, automated packaging/loading checks are useful, but cannot be described as visual testing.

## Skill format and placement

Sources: [Pi Skills](https://pi.dev/docs/latest/skills), [Agent Skills specification](https://agentskills.io/specification), plus installed Pi `docs/skills.md`.

Use `.pi/skills/release-pi-extension/SKILL.md` with matching lowercase name and a specific routing description. Keep instructions bounded and supporting research in `references/`. Validate with Pi's own skill loader. This is repository maintainer tooling: do not expose it as a consumer `pi.skills` resource or add it to the npm allowlist.

## Repository assessment at research time

- Package: `pi-working-phrase`; current version `0.2.0`; default branch `main`.
- Previous release: `v0.2.0`; later tracked changes affect only `src/phrases.ts` (additional phrases and spelling/wording corrections). Proposed next version: `0.2.1`.
- Existing CI runs format, lint, typecheck, tests, and a package dry run on main/PRs; no npm publication workflow is configured.
- Existing manifest already has the discovery keyword, explicit extension entrypoint, host peer dependency, license/repository metadata, and a distribution allowlist.
- GitHub access has release/push permission. Local `npm whoami --registry=https://registry.npmjs.org` returned HTTP 401 during research; do not assume npm publishing is available. Never put credential material in a release report.

These observations are starting evidence, not timeless configuration. Every execution must recheck actual repository and registry state.
