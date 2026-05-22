# Surface registers

Use this reference to apply one language dossier across surfaces without flattening every surface into the same voice. The shared rule is simple: use canonical nouns and canonical verbs from `LANGUAGE.md`, then adapt density, proof, and recovery detail to the surface.

Service-vernacular owns terminology and register evidence. Impeccable owns detailed UI copy mechanics. documentation-sdk owns docs, API reference, SDK, and release-note structure. Keep those boundaries clear.

Required surfaces covered: UI, docs, CLI, notifications, backend/API product-facing errors, admin/operator, onboarding, support, release notes.

## Shared register rules

1. Start from evidence, not brand invention.
2. Keep internal names out of user-facing text unless users already know them.
3. Prefer precise domain nouns over vague platform nouns.
4. Prefer workflow verbs over generic action verbs when the domain evidence supports them.
5. Keep generic standard labels when they are clearest, familiar, or accessibility-critical.
6. Preserve contract fields named in `contract-safety.md`.
7. Avoid over-branding. A term can be distinctive without sounding like a mascot.

## UI

Register: task-focused, short, and scannable.

Use UI copy to help users complete the immediate workflow. Pull nouns and verbs from `LANGUAGE.md`, then use Impeccable for button labels, field help, empty states, validation phrasing, and accessibility checks.

Evidence to inspect: visible strings, screen titles, flow names, component labels, design notes, user research, support tickets tied to screens.

Keep generic when clearest: `Save`, `Cancel`, `Settings`, `Search`, `Filter`, `Next`, `Back`, and common accessibility labels may remain generic.

Avoid: inventing branded names for standard controls, replacing clear labels with clever terms, or using one domain noun everywhere when a simpler label serves the task.

## Docs

Register: teaching, precise, and task-oriented.

Docs should explain how the product's domain works in the user's workflow. Service-vernacular supplies nouns, verbs, glossary terms, audience context, and claim boundaries. documentation-sdk owns structure for API docs, SDK guides, examples, and release-adjacent writing.

Evidence to inspect: guides, concepts pages, API references, code examples, README sections, migration notes, glossary pages.

Keep generic when clearest: standard headings such as `Overview`, `Quick start`, `Prerequisites`, `Examples`, `Reference`, and `Troubleshooting` may remain generic.

Avoid: marketing filler, undefined jargon, docs that mirror internal architecture before explaining the user task, and generic phrases like "improve productivity" without domain evidence.

## CLI

Register: direct, stable, and script-safe.

CLI text should respect automation and operator habits. Keep commands, flags, exit status, and parseable output stable unless the owning tool change authorizes a contract update.

Evidence to inspect: command names, help output, man pages, examples, shell completions, error output, tests, automation scripts.

Keep generic when clearest: `help`, `version`, `status`, `init`, `login`, `logout`, `config`, and common flag names may remain generic.

Avoid: decorative copy, jokes, unstable synonyms across help and errors, or changing parseable output to sound more human.

## Notifications

Register: timely, concise, and specific about why the user is being interrupted.

Notifications should name the domain event, its impact, and the next useful action when there is one. Match urgency to evidence from severity, workflow state, and user role.

Evidence to inspect: email templates, push messages, in-app banners, webhook messages, event names, severity labels, notification settings.

Keep generic when clearest: severity labels such as `Info`, `Warning`, `Error`, and delivery categories may stay standard.

Avoid: vague alerts like "Update available" when the domain event is known, over-personalized urgency, or claims that exceed the product event.

## Backend/API product-facing errors

Register: specific, recovery-oriented, and contract-safe.

Only rewrite the human-facing message or docs explanation. Preserve machine-readable error codes, status codes, enum values, localization keys, log identifiers, telemetry event names, SDK-visible fields, and documented API semantics unless the contract owner explicitly changes them.

Evidence to inspect: OpenAPI specs, error catalogs, handlers, localization files, SDK docs, tests, status-code mappings, support reports.

Keep generic when clearest: protocol terms, HTTP status labels, auth scheme names, and stable SDK field labels should stay standard.

Avoid: changing a code path through wording, hiding a required recovery step, or making a system error sound like a user mistake.

## Admin/operator

Register: diagnostic, calm, and action-ready.

Operator text should help skilled users understand service state, blast radius, owner, and safe next actions. It can be denser than end-user UI, but it still needs plain terms.

Evidence to inspect: runbooks, dashboards, alert rules, log labels, deployment notes, incident reports, service owner maps.

Keep generic when clearest: `Healthy`, `Degraded`, `Offline`, `Retry`, `Rollback`, `Acknowledged`, and other known operational labels may remain generic.

Avoid: softening critical states, renaming known operational concepts for style, or mixing user-facing recovery copy with operator diagnostics.

## Onboarding

Register: guided, confidence-building, and paced by the user's first workflow.

Onboarding should teach the smallest domain model needed to start. Use canonical nouns and verbs early, but define them through the user's task instead of dropping a glossary all at once.

Evidence to inspect: first-run flows, setup guides, welcome emails, sample data, templates, activation metrics, support questions from new users.

Keep generic when clearest: `Get started`, `Continue`, `Skip for now`, `Invite team`, and setup step labels may remain generic when the step is obvious.

Avoid: mascot language, inflated promises, or asking users to learn internal object names before they see the value.

## Support

Register: empathetic, evidence-based, and clear about limits.

Support copy should name the user's workflow, reflect what the product can verify, and guide the next step. It must not create new support-tier claims for this toolkit or product claims the evidence does not support.

Evidence to inspect: help center articles, support macros, incident replies, ticket tags, known issue pages, troubleshooting guides.

Keep generic when clearest: support categories, escalation labels, and clear account or billing labels may stay standard.

Avoid: blaming the user, implying support coverage that policy does not grant, or using generic apology copy without naming the domain issue.

## Release notes

Register: impact-first, concrete, and scoped to shipped behavior.

Release notes should describe what changed for the user, which domain workflow is affected, and what action is needed. Use documentation-sdk when release-note structure, upgrade guidance, or SDK contract detail dominates.

Evidence to inspect: changelog entries, commits, migration guides, API diffs, issue links, support advisories, feature flags.

Keep generic when clearest: change categories such as `Added`, `Changed`, `Fixed`, `Deprecated`, `Removed`, and `Security` may remain standard.

Avoid: raw commit summaries, vague "various improvements," or claims that a change is available outside the shipped surface.
