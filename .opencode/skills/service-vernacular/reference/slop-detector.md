# Slop detector

Use this detector before and after rewriting copy. It finds language that sounds plausible but carries no product evidence.

## Required gate

Ask this exact question for every meaningful rewrite:

`Could this copy belong to any generic SaaS app?`

If the honest answer is yes, the copy fails until it names the real workflow, audience, object, event, constraint, or recovery path from evidence.

## Practical rubric

Score each dimension from 0 to 2.

| Dimension | 0 | 1 | 2 |
| --- | --- | --- | --- |
| Evidence | No source named | Source named but weakly applied | Source shapes the noun, verb, claim, or surface register |
| Domain nouns | Generic object words | Mix of generic and domain terms | Canonical nouns from `LANGUAGE.md` or verified evidence |
| Domain verbs | Generic actions | Some workflow verbs | Verbs match what users actually do in the product |
| Surface fit | Same wording would be used everywhere | Some surface adaptation | Register matches UI, docs, CLI, notification, API error, admin, onboarding, support, or release-note context |
| Usefulness | Sounds polished but vague | Understandable but incomplete | Tells the user what happened, why it matters, or what to do next |
| Claim safety | Adds unsupported claims | Claim is plausible but uncited | Claim is backed by source evidence and within approved boundaries |
| Contract safety | May rename contract fields | Mentions contracts but misses one risk | Preserves protected fields from `contract-safety.md` |

Passing bar: no 0 scores, and at least four dimensions score 2. The required gate still wins. If the copy could fit any generic SaaS app, it fails even with a high score.

## Common slop fingerprints

| Fingerprint | Why it fails | Repair move |
| --- | --- | --- |
| "Manage everything in one place" | No workflow, object, or user need | Name the actual objects and workflow |
| "Unlock powerful insights" | Empty value claim | Name the decision, metric, or evidence the product supports |
| "Seamless collaboration" | Generic promise | Name the team action, handoff, or shared artifact |
| "Boost productivity" | Unmeasured outcome | Name time saved only if measured, otherwise name the concrete task made easier |
| "Take control" | Vague empowerment copy | Name the setting, permission, limit, or action |
| "Something went wrong" | No recovery path | Name what failed and the next safe step when known |

## Remediation steps

1. Find the surface. Name whether the text is UI, docs, CLI, notification, backend/API product-facing error, admin/operator, onboarding, support, or release notes.
2. Pull evidence. Read the closest source of truth before rewriting.
3. Replace generic nouns with canonical nouns or verified user words.
4. Replace generic verbs with workflow verbs.
5. Add only the amount of context that surface needs.
6. Keep standard labels generic when they are clearer than a domain phrase.
7. Check contract safety before touching errors, APIs, SDKs, logs, telemetry, localization, or CLI output.
8. Re-run the required gate. If the result still sounds portable to any SaaS app, repeat from evidence.

## When generic is correct

Generic is not always slop. It is acceptable when a term is a standard label, a platform convention, an accessibility expectation, a protocol term, or a stable contract field. `Save`, `Cancel`, `Settings`, `Help`, `version`, `status`, `404`, and `error_code` can remain generic when changing them would reduce clarity or break a contract.

## Boundary with Impeccable and documentation-sdk

Do not copy Impeccable's full UI copy rules into this detector. Use Impeccable for detailed interface writing and accessibility mechanics. Do not copy documentation-sdk's structure rules. Use documentation-sdk for API docs, SDK examples, and release-note structure. This detector only decides whether wording has product-specific evidence and safe domain language.
