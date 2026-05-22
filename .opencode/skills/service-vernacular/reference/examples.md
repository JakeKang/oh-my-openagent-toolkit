# Examples

These examples show the shape expected from service-vernacular output. Each example names domain evidence and explains why the rewrite is not generic. The fictional domain is incident response software so the before/after pairs can stay concrete.

## UI text

Surface: UI

Before: "Manage items"

After: "Review active incidents"

Domain evidence: Navigation labels, incident list screen, and support tickets all use `incident` for the primary work object. The list filters by active, muted, and resolved incidents.

Why this is not generic: It names the actual work object and state. A generic SaaS app could manage items, but this product helps responders review incidents.

## Backend/API product-facing error

Surface: error

Before: "Action failed."

After: "This runbook step is locked by another responder. Refresh the incident timeline before editing."

Domain evidence: The error catalog has `RUNBOOK_STEP_LOCKED`, status `409`, and a handler comment naming responder locks on runbook steps.

Contract-safety note: Keep machine-readable error code `RUNBOOK_STEP_LOCKED` and status code `409` unchanged. Rewrite only the human-facing message.

Why this is not generic: It names the locked runbook step, the responder conflict, and the recovery action.

## CLI text

Surface: CLI

Before: "Sync complete."

After: "Synced 12 on-call schedules and 3 escalation policies."

Domain evidence: CLI help, fixtures, and API resource names use `on-call schedule` and `escalation policy` as canonical nouns.

Contract-safety note: Keep command names, flags, exit codes, and parseable output fields unchanged.

Why this is not generic: It reports the specific incident-response resources that changed, not a vague sync result.

## Docs text

Surface: docs

Before: "Use automation to improve your workflow."

After: "Use escalation rules to page the next responder when an incident stays unacknowledged."

Domain evidence: The guide, schema, and examples all describe escalation rules, responders, incidents, and acknowledgement windows.

Why this is not generic: It names the domain rule, trigger, actor, and workflow outcome.

## Notification text

Surface: notification

Before: "You have a new update."

After: "Payment API incident escalated to the database on-call. Ack within 5 minutes to stay primary."

Domain evidence: Notification template variables include service name, incident title, escalation target, acknowledgement window, and responder role.

Why this is not generic: It tells the responder what happened, which service is affected, who is next, and what action preserves ownership.

## Onboarding text

Surface: onboarding

Before: "Set up your workspace to get started."

After: "Add your first service, then connect an on-call schedule so incidents know who to page."

Domain evidence: Activation docs and setup analytics show first value comes from adding a service and connecting an on-call schedule.

Why this is not generic: It teaches the product's first workflow and names the objects that make incidents routable.

## Operator/admin text

Surface: operator/admin

Before: "System health degraded."

After: "Webhook delivery is delayed for 4 incident streams. Retry queue is draining."

Domain evidence: Operator dashboard panels track webhook delivery, incident streams, retry queue depth, and drain rate.

Why this is not generic: It gives the operator subsystem, scope, and current recovery state instead of a vague health label.

## Support text

Surface: support

Before: "Sorry for the inconvenience. Try again later."

After: "The alert reached your team, but the Slack handoff failed. Reconnect the Slack workspace, then replay the incident notification from the timeline."

Domain evidence: Support macros and integration logs distinguish alert delivery from Slack handoff failures and expose replay from the incident timeline.

Why this is not generic: It names the failed integration step and gives a recovery path tied to the product workflow.

## Release-note text

Surface: release notes

Before: "Improved notifications."

After: "Incident notifications now show the escalation policy that selected the current on-call responder."

Domain evidence: The release diff adds escalation policy names to incident notification payloads and UI templates.

Contract-safety note: Do not claim new delivery guarantees or change webhook payload semantics unless the API contract changed.

Why this is not generic: It states the shipped user impact in incident-response terms and avoids a broad improvement claim.
