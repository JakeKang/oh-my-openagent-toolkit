---
name: devops-platform
description: Deliver platform and delivery guidance for Docker, deployment targets, CI/CD boundaries, observability, rollback, and release safety without claiming orchestration authority.
---

# DevOps Platform

Use this pack for delivery and runtime work: Docker and containerization, deployment target guidance, CI/CD design, rollout and rollback planning, monitoring, health checks, and operational readiness.

This is the general platform and delivery pack for the repo. Use the overlay in `reference/docker-kubernetes-ci-cd.md` to sharpen container, rollout, probe, and artifact guidance while keeping execution ownership with the harness and repository workflows rather than this pack.

## Core focus

- Design Docker and containerization choices around reproducible builds, runtime safety, and operable images.
- Match the deployment target to workload shape, networking, data dependencies, and operational maturity.
- Treat CI/CD as guidance for build, test, scan, promote, and deploy boundaries rather than as an all-owning automation persona.
- Make monitoring, logs, metrics, tracing, and health checks part of the deployment design.
- Plan rollback, staged release, and failure handling before the first production push.

## Shared platform standards

- Build once and promote immutable artifacts; prefer versioned tags and digest-aware deployment over mutable `latest` behavior.
- Separate CI concerns from CD concerns. CI should validate, test, scan, and publish artifacts; CD should promote and apply the declared release shape.
- Keep readiness, liveness, startup, and service health explicit so bad releases fail fast and safely.
- Treat secrets, service identity, network policy, and least privilege as runtime controls, not application afterthoughts.
- Design release and rollback paths together, especially when data migrations, background jobs, or shared caches are involved.
- Point release evidence back to `../../reference/quality-gates.md` when rollout readiness depends on shared QA thresholds.

## Default workflow

1. Inspect the runtime model, target platform, deployment constraints, and operational risks.
2. Choose the delivery overlay in `reference/docker-kubernetes-ci-cd.md` when containers, Kubernetes, or CI/CD boundaries dominate the task.
3. Define artifact flow, environment shape, health signals, and rollback approach before broad implementation.
4. Implement container, manifest, pipeline, and observability changes together so deployment behavior stays readable.
5. Run `review-work` after substantial platform or delivery changes.

## Collaboration in this repo

- Use `Explore` before editing so new work matches local deployment, container, and ops patterns.
- Use `Librarian` or `Context7` when platform APIs, registry behavior, or orchestration details need a source-of-truth check.
- Pair with `security-engineering` for runtime secret handling, TLS posture, workload identity, and hardening.
- Pair with `database-engineering` when release safety depends on migrations, replication, backup, or restore coordination.
- Pair with `qa-validation` when release readiness depends on evidence from browser, accessibility, performance, or security validation, and use `../../reference/quality-gates.md` as the shared release bar.

## Overlays

- `reference/docker-kubernetes-ci-cd.md` for image build and publish flow, immutable artifacts, deployments and rollouts, probe design, runtime secret handling, and CI versus CD boundaries.

## Guardrails

- Do not turn this pack into a release-state machine or long-running control plane.
- Do not let CI/CD guidance claim deployment authority that belongs to the harness or repo workflows.
- Do not rely on mutable images, hidden environment drift, or untested rollback assumptions.
