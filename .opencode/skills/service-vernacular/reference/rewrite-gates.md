# Rewrite gates

Use these gates before accepting service-vernacular output. They keep rewrites clear, useful, accessible, evidence-backed, and safe across surfaces.

## Gate 1: evidence first

A rewrite must name the evidence behind its main noun, verb, claim, or register choice. Evidence can be a product surface, source file, schema, error catalog, support article, research note, runbook, docs page, release note, or observed user wording.

Fail if the rewrite only sounds better but cannot point to domain evidence.

## Gate 2: clarity before style

The user should understand the message without knowing internal architecture. Prefer concrete nouns, direct verbs, and short sentences. Do not replace a clear standard label with a branded or clever phrase.

Fail if the rewrite makes the user infer the object, action, consequence, or next step.

## Gate 3: accessibility and comprehension

Copy must work for screen readers, keyboard users, translation, small screens, assistive labels, and low-context moments. For UI, pair this gate with Impeccable when detailed interaction-copy mechanics matter.

Fail if link text, labels, alt text, state text, or instructions lose standalone meaning.

## Gate 4: usefulness over cleverness

The rewrite should help the user decide, act, recover, or understand. Wit, wordplay, and brand flavor lose to accuracy and speed.

Fail if the sentence is memorable but less useful than the original.

## Gate 5: standard-label preservation

Generic standard labels may remain generic when clearest. Keep standard labels when users expect them, assistive technology benefits from them, platform conventions depend on them, or contract stability requires them.

Examples that may stay generic when clear: `Save`, `Cancel`, `Settings`, `Help`, `Search`, `Filter`, `Next`, `Back`, `version`, `status`, `init`, `Error`, `Warning`, `Added`, `Changed`, and `Fixed`.

Fail if a rewrite invents a domain phrase for a standard action and makes the product harder to use.

## Gate 6: before/after requirements

Every accepted rewrite batch should include:

1. Surface name.
2. Before text.
3. After text.
4. Evidence used.
5. Why the rewrite is not generic.
6. Contract-safety note when the text touches API, CLI, localization, logs, telemetry, SDK, or status semantics.

Fail if the rewrite cannot be audited from before to after.

## Gate 7: evidence-backed rewrite rules

1. Change nouns only when evidence supports the new noun.
2. Change verbs only when they match the user's workflow.
3. Change claims only when the product evidence supports them.
4. Change tone only to fit the surface and user state.
5. Keep uncertainty visible. If evidence is weak, mark the rewrite provisional instead of presenting it as doctrine.
6. Do not alter regulated/legal claims without explicit authorization.

Fail if a rewrite adds a capability, guarantee, support promise, performance promise, or regulated/legal claim that the source material does not prove.

## Gate 8: contract safety

Run `contract-safety.md` before accepting changes to backend/API product-facing errors, CLI output, localization strings, SDK docs, telemetry references, logs, or release notes that cite public semantics.

Fail if the rewrite changes a protected contract field without explicit authorization.

## Final acceptance check

Ask the slop-detector gate last:

`Could this copy belong to any generic SaaS app?`

If yes, return to the evidence source and rewrite again, unless the text is a standard label that is generic by design.
