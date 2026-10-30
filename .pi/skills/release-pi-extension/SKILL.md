---
name: release-pi-extension
description: Prepare, validate, tag, and publish a Pi community extension release to GitHub and npm. Use when asked to release this extension, choose a release version, or resume an interrupted publication.
license: MIT
---

# Release a Pi community extension

Release the current repository, not the skill directory. Resolve bundled references relative to this file. Read [release practices](references/release-practices.md), the repository's `AGENTS.md`, `CONTRIBUTING.md`, `package.json`, CI workflow, and `CHANGELOG.md` before starting.

This is a maintainer skill, not an extension runtime resource. Keep it in `.pi/skills/`; do not add it to `pi.skills` or the npm `files` list.

## Authority and safety

- A skill is instructions, not permission. Confirm the current request authorizes a release before committing, pushing, creating a GitHub release, or publishing npm. A prepare-only request stops before those actions.
- When delegated, obey the parent's explicit version, branch, publication scope, and stop rules. Do not spawn other agents without authorization.
- Keep one writer per checkout. Record the initial HEAD, branch, remote, and worktree status. Preserve unrelated work; never stage everything, reset/clean the checkout, force-push, move/delete a release tag, unpublish, or weaken checks/2FA to get a release through.
- Do not print credentials, inspect token values, log in as the maintainer, or store secrets in files or reports. Use existing authentication. Ask for maintainer intervention on 401, permission errors, or interactive 2FA.
- Stop on failed checks, uncertain repository ownership, unexpected remote changes, ambiguous versioning, or a conflicting existing release. Report the exact checkpoint and safe next step.

## 1. Establish release intent and state

Run from the repository root:

```bash
git status --short
git branch -vv
git remote -v
git fetch origin --tags
git log -10 --oneline
git tag --list --sort=-version:refname
```

Identify the release branch and GitHub repository from the actual remote; do not blindly copy example names. Check the remote branch and tags, GitHub releases, and npm versions/dist-tags before selecting an unused version:

```bash
gh api repos/OWNER/REPO --jq '{full_name,default_branch,permissions}'
gh release list --repo OWNER/REPO --limit 10
npm view PACKAGE version versions dist-tags --json --registry=https://registry.npmjs.org
```

Review the actual diff and commits since the last release, not only commit subjects. Use the requested version, or choose and explain the smallest appropriate SemVer increment: patch for compatible fixes/content updates, minor for additive features, major for breaking changes. For `0.x`, follow established project policy and escalate breaking-change ambiguity. Do not republish an unchanged version.

Start with a clean worktree. If the parent explicitly handed off known task files, review and include only those paths; unrelated dirt is a blocker. Do not overwrite a version that exists on npm, even if it was unpublished. On retries, inspect existing checkpoints first instead of automatically bumping again.

Preflight GitHub publication permissions and the configured npm registry. For this public extension, explicitly use `https://registry.npmjs.org`. For local publishing, `npm whoami --registry=https://registry.npmjs.org` must identify an authorized maintainer. This is not an OIDC permission check: trusted publishing must run in its already-configured CI workflow.

If npm authentication is unavailable, notify the maintainer/supervisor. An independently authorized GitHub/git release may still proceed if permitted by the current handoff; label the npm channel **blocked**, never published. Do not add a new publishing workflow or change npm security settings implicitly.

## 2. Prepare release metadata

- Add a version heading to `CHANGELOG.md`, for example `## 0.2.1 - YYYY-MM-DD`, using the actual release date. Write concise user-facing notes supported by the diff. Include the package changelog in the tarball so current Pi versions can show extension update notes.
- Synchronize `package.json` and both root version fields in `package-lock.json`. Prefer `npm version X.Y.Z --no-git-tag-version` after reviewing version lifecycle scripts; otherwise edit the version fields precisely. Never update unrelated dependencies during a release.
- Preserve the `pi-package` keyword, explicit `pi.extensions` entry, license, repository metadata, and any gallery image/video URLs. Confirm manifest entry paths exist and TypeScript source will ship; Pi loads it directly, so do not invent a build step.
- Keep imported host-provided Pi packages in `peerDependencies` with `"*"`, not runtime/bundled dependencies. Retain this project's dependency-free runtime and scope.
- Update user docs only when release behavior warrants it. Do not fix unrelated source or regenerate demo media incidentally.

## 3. Validate the release candidate

Review install/lifecycle scripts, then use the lockfile for a clean install and run every gate declared by the repository. For this project:

```bash
npm ci
npm run format:check
npm run lint
npm run typecheck
npm test
npm run pack:check
```

All gates must pass before tagging. Formatting only the files you changed is fine; do not reformat unrelated files to mask a failing baseline.

Also inspect structured package contents:

```bash
npm pack --dry-run --json
```

Check that `package.json`, `src/index.ts`, all imported source files, `README.md`, `LICENSE`, and `CHANGELOG.md` ship. Reject credentials, sidecar user configs, node_modules, coverage, recordings/temp files, and maintainer skill/run artifacts. Existing intentional gallery media is not a temporary recording.

Create an actual tarball **outside the repository**, inspect/extract it into a temporary directory, and verify its manifest version, entrypoint, and changelog match the candidate. Keep its integrity/hash as release evidence. If publishing locally, publish this exact reviewed tarball, not a newly packed mutable checkout. Do not commit the tarball.

Smoke-test packaged extension discovery/loading through the installed Pi loader or documented local-package flow without changing personal Pi settings. A non-interactive load is not a visual TUI test. For lifecycle/timer/UI changes, complete the manual checklist in `CONTRIBUTING.md` before release or stop for maintainer verification. For content/docs-only releases, record that visual testing was not performed and why it is not a new lifecycle gate. Never claim a visual check that did not happen.

## 4. Commit, tag, and publish

Before external changes, review `git diff --check`, the complete release diff, and the exact staged paths. Recheck remote branch/tag and npm version availability. Require the local release branch to be based on the current remote release branch; stop on unexpected divergence. Never bundle unrelated commits.

1. Commit only the approved release files, for example `Release X.Y.Z`.
2. Wait for required branch CI to succeed at the exact release commit after pushing the branch normally. If branch policy requires a PR, use that policy and stop for merge rather than bypassing it. Do not tag a failed or pending required check.
3. Create an annotated `vX.Y.Z` tag at the validated release commit and push that exact tag normally. Check that the remote tag peels to the same commit.
4. If a configured publishing workflow owns npm publication, let it publish and inspect its exact run; do not also publish locally. Otherwise, with working maintainer auth and authorization, run:

   ```bash
   npm publish /ABSOLUTE/TEMP/PACKAGE-X.Y.Z.tgz --access public --tag latest --registry=https://registry.npmjs.org
   ```

   Use `latest` only for stable releases. Prereleases need an explicitly agreed non-`latest` dist-tag. Do not pass `--provenance` locally; use supported CI/OIDC for provenance. Respect 2FA prompts by handing control to the maintainer rather than bypassing them.

5. Create the GitHub release from the verified existing tag with `gh release create vX.Y.Z --verify-tag --repo OWNER/REPO --title "vX.Y.Z" --notes-file /ABSOLUTE/TEMP/release-notes.md`. Use the curated changelog entry, not generic auto-generated notes. Mark prereleases appropriately. State npm's actual status in the release notes if that channel is blocked.

Steps 4 and 5 are independent channels: with explicit permission for a GitHub-only checkpoint, create the GitHub release even if npm is blocked. A tag or GitHub release alone does not prove npm publication.

## 5. Verify and report

Verify independently:

- Local package and lockfile versions, release commit, clean worktree (excluding identified ignored agent artifacts).
- Remote branch and annotated tag commit, successful CI URL, and GitHub release URL/body.
- `npm view PACKAGE@X.Y.Z version dist.integrity dist.tarball --json --registry=https://registry.npmjs.org` and `npm view PACKAGE dist-tags --json --registry=https://registry.npmjs.org`. Match registry integrity to the reviewed tarball for local publication. Retry reads briefly for propagation, not writes blindly.
- If published, check the released package can be fetched and its entrypoint is present. Report pinned install commands for the channels that actually exist:

  ```text
  pi install npm:PACKAGE@X.Y.Z
  pi install git:github.com/OWNER/REPO@vX.Y.Z
  ```

Return a concise receipt: version/reason, commit/tag, changed paths, each gate and smoke-test result, manual-test limitations, tarball integrity/path, CI/release/npm URLs, and separate status for GitHub and npm. If partial, say **partial** and give exact resumable commands. Never call the whole release complete when a requested channel is blocked.

## Recovery

- Existing local commit/tag: inspect it and validate its content; do not recreate a different release under that version.
- Existing remote tag: require its commit to match; never force-update it. An absent GitHub release can be created from that verified tag.
- Publish timeout/error: query the registry for the version before retrying. If present, compare integrity and metadata. Never overwrite/unpublish it; a corrective release needs a new version.
- npm auth/2FA blocker after GitHub release: retain the release commit/tag and reviewed tarball. Once the maintainer restores authentication, verify tarball integrity and remote state, publish the same version/artifact if still unused, then verify npm and update the GitHub notes to remove the pending-publication caveat.
- CI/check failure: leave the release untagged/unpublished, report the failure, and fix it only within authorized scope before rerunning the gates.
