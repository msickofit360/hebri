#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "$repo_root/scripts/lib/install-dependencies.sh"
test_root="$(mktemp -d)"
export INSTALL_TEST_LOG="$test_root/calls"
cat > "$test_root/uv" <<'UV'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$INSTALL_TEST_LOG"
test -z "${UV_NO_CONFIG:-}" && test -z "${UV_CONFIG_FILE:-}" || exit 91
test -d "$XDG_CONFIG_HOME" && test "$XDG_CONFIG_HOME" = "$XDG_CONFIG_DIRS" || exit 92
test -n "$UV_PROJECT_ENVIRONMENT" || exit 93
exit 42
UV
chmod +x "$test_root/uv"
UV_CMD="$test_root/uv"
UV_NO_CONFIG=1
UV_CONFIG_FILE=ambient-config.toml
export UV_NO_CONFIG UV_CONFIG_FILE
run_with_timeout() { shift; "$@"; }
log_info() { :; }
log_error() { echo "$*" >&2; }
log_success() { :; }
if run_locked_uv_sync "$test_root/venv"; then
    echo 'Unexpected success' >&2; exit 1
else
    status=$?
    test "$status" = 42
fi
test "$UV_NO_CONFIG" = 1 && test "$UV_CONFIG_FILE" = ambient-config.toml
test "$(cat "$INSTALL_TEST_LOG")" = 'sync --extra all --no-dev --locked'
echo 'PASS: locked sync isolates configuration, preserves its failure, and restores caller environment'

INSTALL_DIR="$test_root"
DISTRO=linux
USE_VENV=true
cd "$test_root"
: > uv.lock
if hebri_install_deps; then
    echo 'Unexpected fallback success' >&2; exit 1
fi
test "$(wc -l < "$INSTALL_TEST_LOG" | tr -d ' ')" = 2
echo 'PASS: failed verified dependency installation does not run an unlocked fallback'

if run_locked_uv_sync "$test_root/venv" --extra wake --extra voice --inexact; then
    echo 'Unexpected success' >&2; exit 1
fi
test "$(tail -n 1 "$INSTALL_TEST_LOG")" = 'sync --extra all --no-dev --locked --extra wake --extra voice --inexact'
echo 'PASS: optional voice setup preserves both the lock and existing optional dependencies'
