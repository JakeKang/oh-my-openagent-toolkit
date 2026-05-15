# Changelog

All notable changes to `oh-my-openagent-toolkit` are tracked here.

This repository uses SemVer-style release tags (`vMAJOR.MINOR.PATCH`) even though it is a project-local OpenCode bundle rather than a package artifact. The current version source of truth is the `VERSION` file, the matching git tag, and the GitHub Release for that tag.

Versioning rules:

- Major: breaking changes to routing, support-tier semantics, or documented bundle contracts.
- Minor: new local skill surfaces, new reference layers, or meaningful public workflow/documentation additions.
- Patch: validator fixes, wording corrections, guardrail tightening, and non-breaking documentation updates.

## v0.1.0 - 2026-05-15

First managed release for the toolkit, focused on the new DESIGN.md reference layer and the new `compass` orientation skill.

### Highlights

- Added the DESIGN.md reference layer for visual-language interpretation. It includes curated external DESIGN.md examples, source attribution, selection guidance, and catalog material while staying supplementary to existing UI routes.
- Added `compass` as a bounded strategic-orientation skill for ambiguous pre-implementation requests. It helps reframe goals, compare 2-3 viable directions, recommend the next route, skill, helper, or planning step, and then hand implementation to the selected owner.
- Updated routing guidance so DESIGN.md material and `compass` remain discoverability and orientation aids, not new primary routes, support tiers, or validated workflow claims.
- Expanded validator coverage for current inventory counts: 44 top-level skill entrypoints, 41 core skill surfaces, 3 planned adjacent packs, 17 expert packs, and 1 supplementary orientation skill.
- Added guardrail checks so `compass` stays out of support-policy, workflow-catalog, routing-signals, and capability-matrix governance unless a future release intentionally changes those contracts.
- Aligned the impeccable vendor-policy inventory wording with the new 41-skill core count.

### Validation

- `sh .opencode/reference/validate-opencode-bundle.sh full`: `62 PASS, 0 WARN, 0 FAIL`
- Negative validator probes confirmed invalid modes and unexpected top-level skill directories fail as intended.

### Boundaries

- This release does not make DESIGN.md a primary route or validated support claim.
- This release does not make `compass` a primary route, routing-matrix replacement, implementation executor, or support claim.
- The validated workflow surface remains limited to `frontend-product-delivery`, `backend-service-delivery`, `cloud-release-readiness`, and `ai-data-product-delivery`.
