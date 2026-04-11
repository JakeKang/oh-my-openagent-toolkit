#!/bin/sh

set -u

ROOT_DIR="agentic-dev-ai-team"
CONFIG_FILE="$ROOT_DIR/.opencode/oh-my-openagent.jsonc"
CAPABILITY_MATRIX_FILE="$ROOT_DIR/.opencode/reference/capability-matrix.json"
MATRIX_FILE="$ROOT_DIR/.opencode/reference/migration-matrix.md"
RUNTIME_ROUTE_FILE="$ROOT_DIR/.opencode/commands/route-domain.md"
ROUTING_MATRIX_FILE="$ROOT_DIR/.opencode/reference/routing-matrix.md"
QUALITY_GATES_FILE="$ROOT_DIR/.opencode/reference/quality-gates.md"
DESIGN_ANTI_SLOP_FILE="$ROOT_DIR/.opencode/reference/design-anti-slop.md"
QA_EXAMPLES_DIR="$ROOT_DIR/.opencode/reference/qa/examples"
CURRENT_STATE_DOCS="
$ROOT_DIR/README.md
$ROOT_DIR/AGENTS.md
$ROOT_DIR/.opencode/reference/routing-matrix.md
$ROOT_DIR/.opencode/reference/workspace-model.md
"

FULL_EXPECTED_SKILLS="
architecture-integration
frontend-web
mobile-app
backend-node
backend-python
backend-jvm
backend-dotnet
backend-go
systems-rust
systems-c-cpp
functional-platform
php-ruby-platform
data-ml-platform
database-engineering
security-engineering
devops-platform
qa-validation
impeccable
adapt
animate
arrange
audit
bolder
clarify
colorize
critique
delight
distill
extract
frontend-design
harden
normalize
onboard
optimize
overdrive
polish
quieter
shape
teach-impeccable
typeset
"

FULL_EXPECTED_SKILL_COUNT=40
FULL_EXPECTED_IMPECCABLE_COUNT=23
FULL_EXPECTED_EXPERT_PACK_COUNT=17

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

print_header() {
  printf '%s\n' '========================================'
  printf '%s\n' 'OpenCode Bundle Validator'
  printf '%s\n' '========================================'
}

print_result() {
  status="$1"
  name="$2"
  message="$3"
  case "$status" in
    PASS) PASS_COUNT=$((PASS_COUNT + 1)) ;;
    FAIL) FAIL_COUNT=$((FAIL_COUNT + 1)) ;;
    WARN) WARN_COUNT=$((WARN_COUNT + 1)) ;;
  esac
  printf '%s %s: %s\n' "$status" "$name" "$message"
}

fail() {
  print_result FAIL "$1" "$2"
}

pass() {
  print_result PASS "$1" "$2"
}

warn() {
  print_result WARN "$1" "$2"
}

require_file() {
  label="$1"
  path="$2"
  if [ -f "$path" ]; then
    pass "$label" "$path exists"
  else
    fail "$label" "$path is missing"
  fi
}

require_dir() {
  label="$1"
  path="$2"
  if [ -d "$path" ]; then
    pass "$label" "$path exists"
  else
    fail "$label" "$path is missing"
  fi
}

check_banned_strings() {
  label="$1"
  path="$2"
  pattern="$3"
  if grep -R -n -E --exclude='validate-opencode-bundle.sh' --exclude='migration-matrix.md' "$pattern" "$path" >/tmp/opencode-validator-grep.txt 2>/dev/null; then
    fail "$label" "stale legacy references found in $path"
    sed 's/^/  /' /tmp/opencode-validator-grep.txt
  else
    pass "$label" "no matches for $pattern"
  fi
}

check_foundation() {
  printf '%s\n' 'Mode: foundation'
  require_file 'Config' "$CONFIG_FILE"
  require_file 'Migration matrix' "$MATRIX_FILE"
  require_dir 'Skills directory' "$ROOT_DIR/.opencode/skills"
  require_dir 'Commands directory' "$ROOT_DIR/.opencode/commands"
  require_dir 'Reference directory' "$ROOT_DIR/.opencode/reference"
  require_dir 'QA examples directory' "$QA_EXAMPLES_DIR"

  if [ ! -d "$ROOT_DIR/.opencode/command" ]; then
    pass 'Canonical naming' 'no singular .opencode/command directory detected'
  else
    fail 'Canonical naming' 'singular .opencode/command directory must not exist'
  fi
}

check_expected_skill_dirs() {
  missing=0
  found=0
  expected_count=0
  for skill in $FULL_EXPECTED_SKILLS; do
    expected_count=$((expected_count + 1))
    if [ -d "$ROOT_DIR/.opencode/skills/$skill" ]; then
      found=$((found + 1))
    else
      printf 'FAIL Skill pack: missing %s\n' "$ROOT_DIR/.opencode/skills/$skill"
      missing=$((missing + 1))
      FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
  done
  if [ "$expected_count" -ne "$FULL_EXPECTED_SKILL_COUNT" ]; then
    fail 'Skill inventory expectation' "validator is configured for $expected_count skills instead of $FULL_EXPECTED_SKILL_COUNT"
  fi
  if [ "$missing" -eq 0 ]; then
    pass 'Skill inventory' "all $FULL_EXPECTED_SKILL_COUNT expected skill directories are present ($FULL_EXPECTED_IMPECCABLE_COUNT impeccable + $FULL_EXPECTED_EXPERT_PACK_COUNT expert packs)"
  else
    printf 'FAIL Skill inventory: %s missing skill directories\n' "$missing"
    fi
}

check_workspace_model_coherence() {
  require_file 'Workspace model' "$ROOT_DIR/.opencode/reference/workspace-model.md"

  if grep -n -F 'workspace/{project-name}-{domain}' "$ROOT_DIR/.opencode/reference/workspace-model.md" >/dev/null 2>&1; then
    pass 'Workspace model greenfield output' 'greenfield outputs are documented under workspace/{project-name}-{domain}'
  else
    fail 'Workspace model greenfield output' 'workspace/{project-name}-{domain} is not documented'
  fi

  if grep -n -F 'keep operating in their current directories' "$ROOT_DIR/.opencode/reference/workspace-model.md" >/dev/null 2>&1; then
    pass 'Workspace model existing projects' 'existing projects are documented as staying in their current directories'
  else
    fail 'Workspace model existing projects' 'existing-project handling is not documented'
  fi

  if grep -R -n -F --exclude='workspace-model.md' --exclude='validate-opencode-bundle.sh' '.opencode/oh-my-openagent.jsonc automatically routes files there' "$ROOT_DIR/.opencode" >/dev/null 2>&1 || \
     grep -R -n -F --exclude='workspace-model.md' --exclude='validate-opencode-bundle.sh' 'natively implement this workspace placement rule' "$ROOT_DIR/.opencode" >/dev/null 2>&1; then
    fail 'Workspace model runtime claim' 'documentation must not claim native runtime routing enforcement'
  else
    pass 'Workspace model runtime claim' 'no native runtime routing enforcement claim found'
  fi

  if grep -n -F 'not a claim that the runtime or `.opencode/oh-my-openagent.jsonc` automatically routes files there' "$ROOT_DIR/.opencode/reference/workspace-model.md" >/dev/null 2>&1; then
    pass 'Workspace model config boundary' 'workspace-model keeps .opencode/oh-my-openagent.jsonc in a non-routing role'
  else
    fail 'Workspace model config boundary' '.opencode/oh-my-openagent.jsonc boundary language is missing'
  fi
}

check_manifest_and_public_claims() {
  require_file 'Capability manifest' "$CAPABILITY_MATRIX_FILE"

  if python3 - "$CAPABILITY_MATRIX_FILE" "$ROOT_DIR/README.md" "$ROOT_DIR/AGENTS.md" "$ROOT_DIR/.opencode/reference/routing-matrix.md" "$ROOT_DIR/.opencode/reference/workspace-model.md" <<'PY'
import json
import re
import sys
from pathlib import Path

manifest_path = Path(sys.argv[1])
doc_paths = [Path(arg) for arg in sys.argv[2:]]
path = manifest_path
data = json.loads(path.read_text())
allowed = {"validated", "guided", "planned"}
planned_ids = {cap["id"] for cap in data["capabilities"] if cap.get("support_level") == "planned"}

if set(data["support_tiers"]) != allowed:
    raise AssertionError(f"support_tiers must be exactly {sorted(allowed)}")
if len(data["flagship_workflows"]) != 4:
    raise AssertionError("flagship_workflows must contain exactly 4 IDs")
if data["public_claims"]["readme_supported_now_requires"] != "validated":
    raise AssertionError("readme_supported_now_requires must be validated")

for capability in data["capabilities"]:
    tier = capability.get("support_level")
    if tier not in allowed:
        raise AssertionError(f"unsupported support tier for {capability.get('id')}: {tier}")

for doc_path in doc_paths:
    text = doc_path.read_text()
    if not re.search(r"supported[\s-]+now", text, re.IGNORECASE):
        continue
    for planned_id in planned_ids:
        if planned_id in text:
            raise AssertionError(f"{doc_path} advertises planned capability {planned_id} as supported now")

print("manifest checks passed")
PY
  then
    pass 'Capability manifest contract' 'manifest parses and frozen support-tier / workflow constraints are satisfied'
  else
    fail 'Capability manifest contract' 'manifest JSON or support-tier contract is invalid'
  fi
}

check_full() {
  printf '%s\n' 'Mode: full'
  check_foundation

  require_file 'Routing command' "$RUNTIME_ROUTE_FILE"
  require_file 'Routing matrix' "$ROUTING_MATRIX_FILE"
  require_file 'Quality gates' "$QUALITY_GATES_FILE"
  require_file 'Design anti-slop' "$DESIGN_ANTI_SLOP_FILE"

  check_manifest_and_public_claims

  check_expected_skill_dirs
  check_workspace_model_coherence

  if [ ! -d "$ROOT_DIR/.claude" ]; then
    pass 'Legacy .claude directory' 'absent as required'
  else
    fail 'Legacy .claude directory' 'must be removed before full cutover'
  fi

  if [ ! -d "$ROOT_DIR/.memory" ]; then
    pass 'Legacy .memory directory' 'absent as required'
  else
    fail 'Legacy .memory directory' 'must be removed before full cutover'
  fi

  check_banned_strings 'Legacy reference scan' "$ROOT_DIR" '\\.claude/'
}

usage() {
  printf 'Usage: %s foundation|full\n' "$0"
}

print_header

if [ "$#" -ne 1 ]; then
  usage
  exit 2
fi

mode="$1"
case "$mode" in
  foundation)
    check_foundation
    ;;
  full)
    check_full
    ;;
  *)
    usage
    exit 2
    ;;
esac

printf '\nSummary: %s PASS, %s WARN, %s FAIL\n' "$PASS_COUNT" "$WARN_COUNT" "$FAIL_COUNT"

if [ "$FAIL_COUNT" -gt 0 ]; then
  printf '%s\n' 'FAIL: bundle validation did not pass.'
  if [ "$mode" = "full" ]; then
    printf '%s\n' 'Full mode expects the final phase-1 cutover state: all 40 skill directories (23 impeccable + 17 expert packs), routing assets, QA/design references, workspace-model coherence, and no legacy runtime surfaces.'
  fi
  exit 1
fi

printf '%s\n' 'PASS: bundle validation succeeded.'
exit 0
