# Multi-Repository Git Management System

**Version**: 1.0.0
**Last Updated**: 2025-12-18
**Status**: Normative

This document defines the multi-repository Git management system for the Agentic Dev AI Team. Each deployable component maintains its own Git repository for independent version control, deployment, and tracking.

---

## 1. Overview

### Why Multi-Repository?

The Agentic Dev AI Team uses a **Hybrid Polyrepo** architecture:

1. **Independent Deployment**: Each component (frontend, backend, mobile) can be deployed separately to different platforms (Vercel, Railway, EAS)
2. **Development Tracking**: Git commit history tracks each skill's development progress
3. **Version Independence**: Components can have different release cycles
4. **Platform Integration**: Easy integration with platform-specific CI/CD (Vercel, Railway, etc.)
5. **Team Scalability**: Different teams/skills can work independently

### System Architecture

```
workspace/
├── shared/             # Git Repository - Shared types & utilities
│   ├── .git/
│   ├── types/
│   └── utils/
│
├── frontend/           # Git Repository - Next.js app → Vercel
│   ├── .git/
│   └── src/
│
├── backend/            # Git Repository - NestJS/FastAPI → Railway
│   ├── .git/
│   └── src/
│
├── mobile/             # Git Repository - React Native → EAS
│   ├── .git/
│   └── src/
│
├── docs/               # NOT a Git repo (stays in project memory)
├── specs/              # NOT a Git repo (API specs, architecture)
└── deployment/         # NOT a Git repo (deployment configs reference)
```

---

## 2. Repository Structure

### Repository Types

| Repository | Purpose | Typical Deploy Target | Init Condition |
|------------|---------|----------------------|----------------|
| `workspace/shared/` | Shared TypeScript types, utilities, constants | npm package / monorepo reference | Always (if multi-component) |
| `workspace/frontend/` | Next.js web application | Vercel, Netlify, AWS Amplify | If web_application or fullstack |
| `workspace/backend/` | NestJS or FastAPI backend API | Railway, Render, AWS ECS | If backend required |
| `workspace/mobile/` | React Native mobile app | EAS Build, App Store, Play Store | If mobile_application |

### Non-Repository Directories

These directories are NOT initialized as Git repositories:

| Directory | Reason |
|-----------|--------|
| `workspace/docs/` | Documentation stays with project memory |
| `workspace/specs/` | API specs shared across repos, managed separately |
| `workspace/deployment/` | Deployment configs reference, not deployed independently |

---

## 3. Initialization Protocol

### When to Initialize

Git repositories are initialized **after architecture design** (03-architecture-design.md completion).

**Trigger**: pm-orchestrator initiates Git initialization when:
1. Architecture design is complete
2. Repository structure is decided
3. Component boundaries are clear

### Initialization Sequence

```
┌─────────────────────────────────────────────────────────────────┐
│ 03-architecture-design.md COMPLETE                              │
│                                                                 │
│ pm-orchestrator initiates Git initialization:                   │
│                                                                 │
│ 1. Determine required repositories based on architecture        │
│    └─ Read .memory/active-context.md for component list        │
│                                                                 │
│ 2. For each required repository:                                │
│    a. Create directory if not exists                           │
│    b. git init                                                 │
│    c. Create .gitignore                                        │
│    d. Create initial README.md                                 │
│    e. Initial commit: "chore: initialize repository"           │
│                                                                 │
│ 3. Update .memory/project-state.json with git_repositories     │
│                                                                 │
│ 4. If shared/ repo created:                                    │
│    └─ Set up shared types structure                            │
└─────────────────────────────────────────────────────────────────┘
```

### Initialization Commands

Each skill uses these commands when initializing a repository:

```bash
# Navigate to workspace directory
cd workspace/{component}

# Initialize Git repository
git init

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
build/
.next/
out/

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Test coverage
coverage/

# Cache
.cache/
.turbo/
EOF

# Create initial README
cat > README.md << 'EOF'
# {Component Name}

## Overview
{Brief description}

## Getting Started
```bash
npm install
npm run dev
```

## Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
EOF

# Initial commit
git add .
git commit -m "chore: initialize repository"
```

### Component-Specific .gitignore Additions

**Frontend (Next.js)**:
```gitignore
# Next.js
.next/
out/
.vercel

# Storybook
storybook-static/
```

**Backend (NestJS)**:
```gitignore
# NestJS
dist/

# TypeORM
.typeorm-cache/
```

**Backend (FastAPI)**:
```gitignore
# Python
__pycache__/
*.py[cod]
.venv/
venv/

# FastAPI
.pytest_cache/
```

**Mobile (React Native)**:
```gitignore
# React Native
ios/Pods/
android/.gradle/
android/app/build/
*.jks
*.keystore

# Expo
.expo/
.expo-shared/
```

---

## 4. Commit Protocol

### Commit Convention

All repositories follow **Conventional Commits** format:

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

See: [ENTERPRISE-STANDARDS.md#git-conventions](./ENTERPRISE-STANDARDS.md#git-conventions)

### When to Commit

Skills MUST commit at these points:

| Trigger | Commit Type | Example |
|---------|-------------|---------|
| **New file creation** | feat/chore | `feat(auth): add login component` |
| **Feature completion** | feat | `feat(dashboard): implement chart widget` |
| **Bug fix** | fix | `fix(api): resolve authentication error` |
| **Refactoring** | refactor | `refactor(users): extract validation logic` |
| **Test addition** | test | `test(auth): add login flow tests` |
| **Documentation** | docs | `docs(readme): update installation guide` |
| **Before session end** | WIP (optional) | `chore(wip): save progress on user module` |

### Atomic Commits

Each commit should represent ONE logical change:

```
✅ Good (Atomic):
- feat(auth): add JWT token generation
- feat(auth): add refresh token logic
- test(auth): add token generation tests

❌ Bad (Non-atomic):
- feat(auth): add authentication system with JWT, refresh tokens, tests, and documentation
```

### Commit Workflow for Skills

```
┌─────────────────────────────────────────────────────────────────┐
│ SKILL Development Workflow                                      │
│                                                                 │
│ 1. Check current branch                                         │
│    git branch                                                   │
│                                                                 │
│ 2. Make changes (implement feature/fix)                        │
│                                                                 │
│ 3. Stage changes                                                │
│    git add <specific-files>                                     │
│    # OR git add . (if all changes are related)                 │
│                                                                 │
│ 4. Commit with conventional message                             │
│    git commit -m "type(scope): description"                    │
│                                                                 │
│ 5. Update .memory/project-state.json                           │
│    - Update git_repositories.{repo}.last_commit                │
│    - Update git_repositories.{repo}.last_commit_message        │
│                                                                 │
│ 6. Continue development or end session                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Branch Strategy

### Simplified GitFlow

```
main (production)
  │
  └── develop (integration)
        │
        ├── feature/AUTH-123-login
        ├── feature/DASH-456-charts
        └── fix/BUG-789-validation
```

### Branch Types

| Branch | Purpose | Created From | Merges To |
|--------|---------|--------------|-----------|
| `main` | Production-ready code | - | - |
| `develop` | Integration branch | main | main |
| `feature/*` | New features | develop | develop |
| `fix/*` | Bug fixes | develop | develop |
| `hotfix/*` | Urgent production fixes | main | main + develop |

### Branch Naming

```
<type>/<ticket>-<short-description>

Examples:
- feature/AUTH-123-social-login
- fix/BUG-456-login-redirect
- hotfix/CRIT-789-security-patch
```

### When to Create Branches

| Lifecycle State | Branch Strategy |
|-----------------|-----------------|
| **initial_development** | Work directly on `main` or `develop` |
| **continuous_development** | Feature branches for all changes |
| **hotfix** | Hotfix branches from `main` |

---

## 6. Remote Repository Setup

### Semi-Automated Setup

Remote repository setup is **semi-automated** by devops-deployment skill:

1. **Documentation**: Generate setup guide for each repository
2. **GitHub CLI Support**: Provide commands for repo creation
3. **User Confirmation**: User executes commands (security)

### Remote Setup Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│ devops-deployment Remote Setup                                  │
│                                                                 │
│ 1. Generate GitHub CLI commands                                 │
│    gh repo create {project}-frontend --public --source=.        │
│    gh repo create {project}-backend --public --source=.         │
│                                                                 │
│ 2. Generate remote add commands                                 │
│    git remote add origin https://github.com/{user}/{repo}.git   │
│                                                                 │
│ 3. Document in workspace/docs/deployment-guide.md               │
│                                                                 │
│ 4. User executes commands (maintains security)                  │
│                                                                 │
│ 5. Verify remote connection                                     │
│    git remote -v                                                │
│                                                                 │
│ 6. Initial push                                                 │
│    git push -u origin main                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Platform-Specific Integration

| Platform | Repository | Integration |
|----------|------------|-------------|
| **Vercel** | frontend | Connect GitHub repo, auto-deploy on push |
| **Railway** | backend | Connect GitHub repo, auto-deploy on push |
| **EAS** | mobile | `eas build` triggered from CI/CD |
| **npm** | shared | Publish as package or reference via git |

---

## 7. Skill-Specific Guidelines

### frontend-nextjs

```markdown
## Git Repository Management

**Repository**: `workspace/frontend/`
**Deploy Target**: Vercel

### Commit Triggers
- Component creation/modification
- Page addition
- Hook implementation
- Style changes
- Configuration updates

### Typical Commits
- feat(components): add UserProfile component
- feat(pages): add dashboard page
- fix(auth): resolve login redirect issue
- style(ui): update button hover states
- chore(config): update Next.js config
```

### backend-nestjs / backend-fastapi

```markdown
## Git Repository Management

**Repository**: `workspace/backend/`
**Deploy Target**: Railway

### Commit Triggers
- Module/endpoint creation
- Entity/model changes
- Service implementation
- Middleware addition
- Configuration updates

### Typical Commits
- feat(auth): add JWT authentication module
- feat(users): add CRUD endpoints
- fix(api): resolve N+1 query issue
- refactor(services): extract validation logic
- chore(config): update database config
```

### mobile-react-native

```markdown
## Git Repository Management

**Repository**: `workspace/mobile/`
**Deploy Target**: EAS Build → App Store / Play Store

### Commit Triggers
- Screen creation
- Component implementation
- Navigation updates
- Native module integration
- Platform-specific changes

### Typical Commits
- feat(screens): add login screen
- feat(nav): implement bottom tab navigation
- fix(ios): resolve keyboard overlap issue
- chore(android): update gradle config
- feat(native): add biometric authentication
```

---

## 8. Integration with Workflows

### Initial Development Workflows

| Workflow | Git Actions |
|----------|-------------|
| 03-architecture-design.md | **Initialize repositories** after design complete |
| Implementation Phase | Commit after each feature/component |
| 06-integration.md | Commit integration configs, shared types |
| 07-deployment.md | Set up remotes, initial push |
| 08-quality-assurance.md | Commit test files, coverage configs |

### Continuous Development Workflows

| Sub-Workflow | Git Actions |
|--------------|-------------|
| feature-development.md | Create feature branch → commits → merge to develop |
| bug-fix.md | Create fix branch → commit fix → merge |
| hotfix.md | Create hotfix from main → commit → merge to main + develop |
| refactoring.md | Create refactor branch → atomic commits → merge |
| performance-optimization.md | Commit performance improvements |
| security-patch.md | Commit security fixes → immediate merge |

### Release Management

```
┌─────────────────────────────────────────────────────────────────┐
│ Release Git Workflow                                            │
│                                                                 │
│ 1. Pre-release                                                  │
│    - Ensure develop branch is stable                           │
│    - All tests pass                                            │
│                                                                 │
│ 2. Merge to main                                                │
│    git checkout main                                           │
│    git merge develop                                           │
│                                                                 │
│ 3. Tag release                                                  │
│    git tag -a v1.2.0 -m "Release v1.2.0"                       │
│    git push origin v1.2.0                                       │
│                                                                 │
│ 4. Deploy (auto-triggered by tag/push)                         │
│                                                                 │
│ 5. Update .memory/version-history.md                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Memory System Integration

### Git State in project-state.json

```json
{
  "git_repositories": {
    "shared": {
      "initialized": true,
      "path": "workspace/shared",
      "remote": "https://github.com/user/project-shared",
      "current_branch": "main",
      "last_commit": "abc1234",
      "last_commit_message": "feat(types): add User interface",
      "last_commit_date": "2025-12-18T10:30:00Z",
      "dirty": false
    },
    "frontend": {
      "initialized": true,
      "path": "workspace/frontend",
      "remote": "https://github.com/user/project-frontend",
      "current_branch": "develop",
      "last_commit": "def5678",
      "last_commit_message": "feat(auth): add login page",
      "last_commit_date": "2025-12-18T11:00:00Z",
      "dirty": true
    },
    "backend": {
      "initialized": true,
      "path": "workspace/backend",
      "remote": null,
      "current_branch": "main",
      "last_commit": "ghi9012",
      "last_commit_message": "feat(users): add user module",
      "last_commit_date": "2025-12-18T10:45:00Z",
      "dirty": false
    },
    "mobile": {
      "initialized": false,
      "path": "workspace/mobile",
      "remote": null,
      "current_branch": null,
      "last_commit": null,
      "last_commit_message": null,
      "last_commit_date": null,
      "dirty": false
    }
  }
}
```

### Git State Updates

**memory-manager** updates git_repositories when:
- Repository initialized
- Commit made (by any skill)
- Branch changed
- Remote added/changed
- Push completed

### Session Continuity with Git

```
┌─────────────────────────────────────────────────────────────────┐
│ Session Start - Git State Restoration                           │
│                                                                 │
│ 1. Read .memory/project-state.json                              │
│    └─ Extract git_repositories                                 │
│                                                                 │
│ 2. For each initialized repository:                             │
│    a. Verify .git exists                                       │
│    b. Check current branch matches state                       │
│    c. Check for uncommitted changes (dirty state)              │
│    d. Report any discrepancies                                 │
│                                                                 │
│ 3. Report Git status summary:                                   │
│    "Git repositories:                                          │
│     - frontend (develop): 3 uncommitted changes                │
│     - backend (main): clean                                    │
│     - shared (main): clean"                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Deployment Integration

### Platform CI/CD Integration

#### Vercel (Frontend)

```yaml
# Automatic on GitHub push
# Configure in Vercel Dashboard:
# - Connect GitHub repository
# - Set build command: npm run build
# - Set output directory: .next
# - Environment variables from Vercel Dashboard
```

#### Railway (Backend)

```yaml
# Automatic on GitHub push
# Configure in Railway Dashboard:
# - Connect GitHub repository
# - Set start command: npm run start:prod
# - Environment variables from Railway Dashboard
```

#### EAS Build (Mobile)

```yaml
# eas.json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  }
}

# GitHub Action for EAS
name: EAS Build
on:
  push:
    branches: [main]
    paths: ['mobile/**']
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: cd mobile && eas build --platform all --non-interactive
```

### Shared Types Distribution

```typescript
// Option 1: npm package (for public projects)
// shared/package.json
{
  "name": "@project/shared",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts"
}

// Option 2: Git reference (for private projects)
// frontend/package.json, backend/package.json
{
  "dependencies": {
    "@project/shared": "git+https://github.com/user/project-shared.git"
  }
}

// Option 3: Local reference (during development)
// Using npm/pnpm workspaces or relative imports
{
  "dependencies": {
    "@project/shared": "file:../shared"
  }
}
```

---

## 11. Commands Reference

### Common Git Commands for Skills

```bash
# Check status
git status

# Stage all changes
git add .

# Stage specific files
git add src/components/UserProfile.tsx

# Commit with message
git commit -m "feat(users): add UserProfile component"

# Check current branch
git branch

# Create and switch to new branch
git checkout -b feature/AUTH-123-login

# Switch to existing branch
git checkout develop

# Merge branch
git merge feature/AUTH-123-login

# Push to remote
git push origin develop

# Pull latest changes
git pull origin develop

# View commit history
git log --oneline -10

# View uncommitted changes
git diff

# Discard changes (careful!)
git checkout -- <file>
```

### Git Commands for Memory Updates

```bash
# Get last commit hash (for memory update)
git rev-parse --short HEAD

# Get last commit message
git log -1 --pretty=%B

# Check if working directory is dirty
git status --porcelain

# Get current branch
git branch --show-current

# Get remote URL
git remote get-url origin
```

---

## 12. Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Merge conflicts | Resolve conflicts, then `git add` and `git commit` |
| Forgot to commit before session end | Resume and commit WIP |
| Wrong branch | `git stash`, switch branch, `git stash pop` |
| Need to undo last commit | `git reset --soft HEAD~1` |
| Remote not set | `git remote add origin <url>` |

### Recovery Commands

```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo all uncommitted changes (DANGEROUS)
git reset --hard HEAD

# Recover deleted branch
git reflog
git checkout -b recovered-branch <commit-hash>

# Fix wrong commit message
git commit --amend -m "new message"
```

---

## Related Documents

- [ENTERPRISE-STANDARDS.md#git-conventions](./ENTERPRISE-STANDARDS.md#git-conventions) - Commit message format
- [pm-orchestrator/SKILL.md](./pm-orchestrator/SKILL.md) - Git initialization coordination
- [devops-deployment/SKILL.md](./devops-deployment/SKILL.md) - Remote setup and CI/CD
- [memory-manager/SKILL.md](./memory-manager/SKILL.md) - Git state tracking
