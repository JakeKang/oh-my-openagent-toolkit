# Language dossier reference

Use this reference when service-vernacular needs a project-local language source of truth before rewriting user-facing text. The dossier records observed domain language, user mental models, and surface-specific register choices. It does not replace Impeccable UI copy mechanics, documentation-sdk structure, routing policy, or support-tier claims.

## Dossier precedence

1. `LANGUAGE.md` is the canonical project-local dossier for service vernacular work.
2. `DOMAIN_LANGUAGE.md` is alternate/legacy context. Read it when present, but treat it as supporting evidence rather than the final authority.
3. When `LANGUAGE.md` and `DOMAIN_LANGUAGE.md` both exist, `LANGUAGE.md` wins.
4. If `DOMAIN_LANGUAGE.md` contains current evidence missing from `LANGUAGE.md`, verify it against repo or product sources before moving it into `LANGUAGE.md`.
5. `LANGUAGE.md` is created or updated when service-vernacular is used and evidence warrants it. It is not mandatory for every toolkit project.

## Evidence requirements

Create or update `LANGUAGE.md` only after reading enough product evidence to separate native language from invented flavor.

Use at least two source types when available:

1. Product UI strings, command output, notification copy, error messages, docs, support articles, or release notes.
2. Domain nouns in schemas, API names, event names, logs, tests, fixtures, examples, runbooks, customer-facing tickets, or onboarding material.
3. User wording from research, support transcripts, sales calls, issue reports, community posts, or documented feedback.
4. Regulated/legal claims that must not be rewritten without explicit authorization.

Every meaningful dossier entry should name its evidence source. Prefer file paths, command names, route names, ticket links, or observed surface names over vague claims like "the app says this."

## Root selection

For a single app or package, place `LANGUAGE.md` at the project root next to the primary README. In a monorepo, place it at the smallest root that owns the language system being changed. Use the repo root only when the same nouns, verbs, and registers apply across packages.

When a monorepo has separate products with different audiences, create separate dossiers in the owning package roots. Do not force one shared voice across unrelated services.

## Update rules

1. Preserve dated evidence and last-reviewed metadata.
2. Mark uncertain terms as provisional instead of turning guesses into rules.
3. Keep internal implementation names separate from words users should see.
4. Keep standard labels generic when that is clearest, common, or accessibility-critical.
5. Record forbidden terms with the reason they fail, such as vague, over-branded, internal-only, misleading, or contract-sensitive.
6. Do not alter regulated/legal claims without explicit authorization.

## Complete `LANGUAGE.md` template

Copy this template into the selected project root when evidence warrants a dossier. Keep sections that are empty, and mark them `Unknown` rather than deleting them.

```markdown
# LANGUAGE.md

## Purpose

This file is the canonical domain-language dossier for [product or service]. It records evidence-backed terms, surface registers, claim boundaries, and rewrite examples for user-facing language.

## Evidence sources

| Source | Path, URL, or surface | What it proves | Last checked |
| --- | --- | --- | --- |
| [source name] | [path or observed surface] | [nouns, verbs, audience, workflow, claim, tone] | [YYYY-MM-DD] |

## Users and audiences

| Audience | Context | Needs | Terms they use | Terms to avoid |
| --- | --- | --- | --- | --- |
| [audience] | [where they meet the product] | [what they are trying to do] | [observed words] | [confusing or internal words] |

## Workflows

| Workflow | User goal | Entry point | Success language | Failure language |
| --- | --- | --- | --- | --- |
| [workflow] | [goal] | [UI, CLI, API, docs, support, notification, admin] | [words that confirm progress] | [words that explain recovery] |

## Canonical nouns

| Canonical noun | Meaning | Evidence | Accepted variants | Do not use |
| --- | --- | --- | --- | --- |
| [noun] | [definition] | [source] | [variants for specific surfaces] | [forbidden variants] |

## Canonical verbs

| Canonical verb | Meaning | Evidence | Use when | Do not use |
| --- | --- | --- | --- | --- |
| [verb] | [definition] | [source] | [workflow or surface] | [near miss verbs] |

## Glossary

| Term | User-facing definition | Internal notes | Evidence |
| --- | --- | --- | --- |
| [term] | [plain definition] | [implementation detail, if needed] | [source] |

## Forbidden terms

| Term | Why it fails | Replacement | Evidence |
| --- | --- | --- | --- |
| [term] | [generic, vague, misleading, internal-only, over-branded, contract-sensitive] | [replacement] | [source] |

## Surface registers

| Surface | Register | Canonical nouns | Canonical verbs | Standard labels that stay generic | Notes |
| --- | --- | --- | --- | --- | --- |
| UI | [task-focused, plain] | [nouns] | [verbs] | [Save, Cancel, Settings, or other clear standards] | [constraints] |
| Docs | [teaching, precise] | [nouns] | [verbs] | [standard headings or API labels] | [constraints] |
| CLI | [direct, script-safe] | [nouns] | [verbs] | [help, version, init, status] | [constraints] |
| Notifications | [timely, short] | [nouns] | [verbs] | [standard severity labels] | [constraints] |
| Backend/API product-facing errors | [specific, recovery-oriented] | [nouns] | [verbs] | [status or protocol labels] | [contracts] |
| Admin/operator | [diagnostic, calm] | [nouns] | [verbs] | [standard operational labels] | [constraints] |
| Onboarding | [guided, confidence-building] | [nouns] | [verbs] | [standard setup labels] | [constraints] |
| Support | [empathetic, evidence-based] | [nouns] | [verbs] | [known support categories] | [constraints] |
| Release notes | [impact-first, concrete] | [nouns] | [verbs] | [known change categories] | [constraints] |

## Claim boundaries

| Claim type | Allowed wording | Requires approval | Never imply |
| --- | --- | --- | --- |
| Product capability | [evidence-backed claim] | [owner or source] | [unsupported claim] |
| Reliability or performance | [measured claim] | [metric owner] | [unmeasured guarantee] |
| Regulated/legal claim | [approved wording] | [explicit authorization] | [new regulated/legal claim] |
| API or SDK behavior | [documented semantics] | [contract owner] | [semantic change through copy] |

## Examples

| Surface | Before | After | Evidence used | Why the rewrite is not generic |
| --- | --- | --- | --- | --- |
| [surface] | [current text] | [rewritten text] | [source] | [domain noun, verb, workflow, or audience signal] |

## Last-reviewed metadata

| Field | Value |
| --- | --- |
| Last reviewed | [YYYY-MM-DD] |
| Reviewed by | [name, role, or agent] |
| Evidence window | [date range or source set] |
| Open questions | [known gaps] |
| Next review trigger | [release, product rename, new surface, support spike] |
```

## Handoff notes

Use Impeccable when a UI surface needs detailed button, empty-state, error, accessibility, or interaction-copy mechanics. Use documentation-sdk when docs, OpenAPI references, SDK examples, or release-note structure dominate the task. Use service-vernacular to decide which domain words and registers those collaborators should apply.
