# Agentic Dev AI Team

`agentic-dev-ai-team` is a project-local OpenCode bundle that layers focused routing, reference docs, and expert packs on top of the `oh-my-openagent` harness. If you have already cloned this repo and are standing in its root, this README shows how to use the bundle from there.

It is not an official upstream distribution of `oh-my-openagent`, and it is not a replacement for the harness. It is a companion bundle that adds local routing, support framing, workspace conventions, and an imported `impeccable` design layer.

## What this bundle is

This bundle keeps the local layer narrow. It gives you a thin routing surface through `AGENTS.md`, `.opencode/commands/route-domain.md`, and `.opencode/reference/routing-matrix.md`, then leaves planning, execution flow, and built-in helper behavior to the harness.

The foundation is `oh-my-openagent`. On top of that, this repo adds local expert packs under `.opencode/skills/`, shared reference docs under `.opencode/reference/`, and the imported `impeccable` family as a design and refinement layer for UI work.

## Who this is for

This bundle is for a clone user who wants a stronger local operating layer without pretending the repo is its own control plane. It fits people using OpenCode with the `oh-my-openagent` harness who want clearer routing, practical workspace defaults, and a public-facing explanation of what is currently validated versus what is only guided or planned.

If you are starting new greenfield work from this repo, the documented default landing zone is `workspace/{project-name}-{domain}`. If you are working in an existing project already inside the repo or worktree, keep that project in place.

## What it adds on top of upstream

This bundle adds a thin local routing layer that classifies work into the existing domain buckets, points to the right expert pack, and reminds you which built-in helpers fit the request. The public entry points are `AGENTS.md`, `.opencode/commands/route-domain.md`, and `.opencode/reference/routing-matrix.md`.

It also adds shared governance and usage references, including `.opencode/reference/support-policy.md`, `.opencode/reference/workflow-catalog.md`, and `.opencode/reference/workspace-model.md`. Those docs are what make the current support framing explicit instead of implied.

For UI work, it adds the imported `impeccable` layer as a supplementary refinement family. Use `frontend-web` or `mobile-app` as the main route first, then add the exact `impeccable` skills that fit the task.

The current validated workflow surface is intentionally narrow and still limited to four flagship workflows: `frontend-product-delivery`, `backend-service-delivery`, `cloud-release-readiness`, and `ai-data-product-delivery`. Broader pack coverage is documented as guided or planned, not as blanket supported-now coverage.

## What this is not

This is not an official `oh-my-openagent` release, and it should not be presented as one. It is also not a drop-in replacement for upstream OpenCode or for the harness itself.

It does not create a second runtime, local orchestration loop, task authority, or release control plane. The routing docs stay thin on purpose, and routed surfaces are not automatically validated surfaces.

The imported `impeccable` family is not a separate support tier and not a standalone product inside this repo. It is an included design layer that supports UI refinement when the main implementation route is already clear.

## Quick start

If you are not in the repo yet:

```sh
git clone <repo-url>
cd agentic-dev-ai-team
```

From the repo root, start here:

1. Read `AGENTS.md` for the top-level routing guide.
2. Use `.opencode/reference/routing-matrix.md` when you need the source-of-truth routing table.
3. Use `.opencode/commands/route-domain.md` for the compact request-classification flow.
4. Check `.opencode/reference/support-policy.md` and `.opencode/reference/workflow-catalog.md` before making any public support claim.
5. Follow `.opencode/reference/workspace-model.md` for the repo-root execution model and the `workspace/{project-name}-{domain}` default for new greenfield outputs.

In practice, that means your in-repo paths and commands should stay repo-root-relative. Read `.opencode/...`, work from `AGENTS.md`, and treat `workspace/{project-name}-{domain}` as the default convention for new projects created from this root.

## Acknowledgements

This bundle is built as a companion to `oh-my-openagent`, which provides the harness foundation and built-in helper model it relies on. The repo does not replace that upstream foundation, and it does not claim official endorsement or official-distribution status.

It also includes an imported `impeccable` design layer as a local refinement family for UI work. That layer is acknowledged here as an upstream design influence and bundled asset, not as a claim that this repo is the canonical home for it.
