---
name: frontend-web
description: Deliver browser UI, interaction flows, and web design systems across framework-specific overlays without collapsing into a Next.js-only pack.
---

# Frontend Web

Use this pack for browser UI work: web screens, component systems, interaction flows, accessibility, frontend performance, and delivery patterns that live in the web stack.

This is the general web UI pack for the repo. It is not limited to one framework. Use the overlays in `reference/` to tune decisions for a specific stack while keeping the shared browser-quality bar intact and without creating separate top-level frontend packs. When anti-slop design review matters, use `../../reference/design-anti-slop.md` as the shared ban list.

## Core focus

- Build interfaces that are clear, responsive, accessible, and fast.
- Preserve strong component boundaries, predictable state flow, and explicit data loading rules.
- Favor semantic HTML, keyboard support, and WCAG-aware interaction design by default.
- Treat performance, loading states, and error states as part of the product experience.
- Layer the curated `impeccable` pack on purpose when the ask includes anti-slop review or refinement.

## Shared web standards

- Keep TypeScript strict where the project uses it.
- Reuse the design system and established component patterns before inventing one-off UI.
- Make loading, empty, error, and success states intentional.
- Keep forms explicit about validation, latency, and recovery.
- Measure bundle, image, and rendering cost on user-facing paths.
- Build for keyboard, screen reader, reduced-motion, and small-screen resilience.
- Treat `../../reference/design-anti-slop.md` as the canonical anti-slop source instead of repeating bans in this pack.

## Default workflow

1. Inspect the existing UI patterns, component boundaries, and design tokens.
2. Choose the closest framework overlay from `reference/nextjs.md`, `reference/react-web.md`, `reference/vue-nuxt.md`, `reference/svelte-astro.md`, or `reference/angular.md`.
3. Implement structure first, then state flow, then accessibility and performance details.
4. Add `impeccable`, `audit`, `critique`, `polish`, `typeset`, `colorize`, or `adapt` only when the request clearly needs that layer.
5. Run `review-work` after substantial UI changes.

## Collaboration in this repo

- Use `frontend-ui-ux` when the task needs stronger product, layout, or interaction judgment.
- Use `Explore` before editing so the new work matches existing patterns.
- Use `Librarian` or `Context7` when a framework or library detail matters.
- Pair with `architecture-integration` when the work depends on API contracts or shared boundary decisions.
- Add the owning backend pack when request shape, validation, or auth behavior changes.

## Overlays

- Keep `frontend-web` as the single top-level web pack. Use the narrowest overlay that matches the dominant component, routing, and runtime model.
- `reference/nextjs.md` for App Router, server/client boundaries, caching, and server-driven web delivery.
- `reference/react-web.md` for component-heavy React apps, client routing, SPA patterns, and design-system-led browser UI.
- `reference/vue-nuxt.md` for Vue SFCs, Composition API composables, Nuxt pages/layouts, and SSR-safe route data flows.
- `reference/svelte-astro.md` for Svelte 5 runes, Astro islands, hydration boundaries, and framework interop inside server-rendered shells.
- `reference/angular.md` for standalone Angular apps, signals, DI, router-driven feature structure, and reactive forms.

## Guardrails

- Do not let one framework's defaults define the whole pack.
- Do not trade accessibility or resilience for visual novelty.
- Do not hide UX debt behind component abstraction.
