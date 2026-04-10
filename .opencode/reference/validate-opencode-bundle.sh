#!/bin/sh

set -u

ROOT_DIR="agentic-dev-ai-team"
CONFIG_FILE="$ROOT_DIR/.opencode/oh-my-openagent.jsonc"
MATRIX_FILE="$ROOT_DIR/.opencode/reference/migration-matrix.md"
RUNTIME_ROUTE_FILE="$ROOT_DIR/.opencode/commands/route-domain.md"
ROUTING_MATRIX_FILE="$ROOT_DIR/.opencode/reference/routing-matrix.md"
QUALITY_GATES_FILE="$ROOT_DIR/.opencode/reference/quality-gates.md"
DESIGN_ANTI_SLOP_FILE="$ROOT_DIR/.opencode/reference/design-anti-slop.md"
QA_EXAMPLES_DIR="$ROOT_DIR/.opencode/reference/qa/examples"

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
audit
critique
polish
typeset
colorize
adapt
"

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
  for skill in $FULL_EXPECTED_SKILLS; do
    if [ -d "$ROOT_DIR/.opencode/skills/$skill" ]; then
      found=$((found + 1))
    else
      printf 'FAIL Skill pack: missing %s\n' "$ROOT_DIR/.opencode/skills/$skill"
      missing=$((missing + 1))
      FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
  done
  if [ "$missing" -eq 0 ]; then
    pass 'Skill inventory' "all 24 expected skill directories are present"
  else
    printf 'FAIL Skill inventory: %s missing skill directories\n' "$missing"
  fi
}

check_full() {
  printf '%s\n' 'Mode: full'
  check_foundation

  require_file 'Routing command' "$RUNTIME_ROUTE_FILE"
  require_file 'Routing matrix' "$ROUTING_MATRIX_FILE"
  require_file 'Quality gates' "$QUALITY_GATES_FILE"
  require_file 'Design anti-slop' "$DESIGN_ANTI_SLOP_FILE"

  check_expected_skill_dirs

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
    printf '%s\n' 'Full mode expects the final phase-1 cutover state: all 24 skill directories, routing assets, QA/design references, and no legacy runtime surfaces.'
  fi
  exit 1
fi

printf '%s\n' 'PASS: bundle validation succeeded.'
exit 0
