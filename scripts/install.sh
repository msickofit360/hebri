#!/bin/bash
# ============================================================================
# Hebri Installer
# ============================================================================
# Installation script for Linux, macOS, and Android/Termux.
# Uses uv for desktop/server installs and Python's stdlib venv + pip on Termux.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/satoshilove/hebri/main/scripts/install.sh | bash
#
# Or with options:
#   curl -fsSL ... | bash -s -- --no-venv --skip-setup
#
# ============================================================================

set -e

# Guard against environment leakage when the installer is launched from another
# Python-driven tool session (e.g. Hebri terminal tool). A pre-set PYTHONPATH
# can force pip/entrypoints to import a different checkout than the one being
# installed, which makes fresh installs appear broken or stale.
if [ -n "${PYTHONPATH:-}" ]; then
    echo "⚠ Ignoring inherited PYTHONPATH during install to avoid module shadowing"
    unset PYTHONPATH
fi
if [ -n "${PYTHONHOME:-}" ]; then
    echo "⚠ Ignoring inherited PYTHONHOME during install"
    unset PYTHONHOME
fi

# Prevent uv from discovering config files (uv.toml, pyproject.toml) from the
# wrong user's home directory when running under sudo -u <user>.  See #21269.
export UV_NO_CONFIG=1

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Configuration
REPO_URL_SSH="git@github.com:satoshilove/hebri.git"
REPO_URL_HTTPS="https://github.com/satoshilove/hebri.git"
HERMES_HOME="${HEBRI_HOME:-$HOME/.hebri}"
# INSTALL_DIR is resolved AFTER arg parsing and OS detection so we can pick an
# FHS-style layout for root installs.  Track whether the user gave us an
# explicit directory — if so we never override it.
if [ -n "${HERMES_INSTALL_DIR:-}" ]; then
    INSTALL_DIR="$HERMES_INSTALL_DIR"
    INSTALL_DIR_EXPLICIT=true
else
    INSTALL_DIR=""
    INSTALL_DIR_EXPLICIT=false
fi
PYTHON_VERSION="3.11"
PYTHON_SUPPORTED_RANGE=">=3.11,<3.14"  # pyproject requires-python; keep in sync
NODE_VERSION="22"

# FHS-style root install layout (set by resolve_install_layout when applicable):
#   code at /usr/local/lib/hebri-agent, command at /usr/local/bin/hebri,
#   data still at /root/.hebri (HERMES_HOME).  Matches Claude Code / Codex CLI
#   and keeps Docker bind-mounted /root/ volumes lean.
ROOT_FHS_LAYOUT=false
DETECTED_BROWSER_EXECUTABLE=""

# Options
USE_VENV=true
RUN_SETUP=true
SKIP_BROWSER=false
SKIP_COMPUTER_USE=false
NO_SKILLS=false
BRANCH="main"
INSTALL_COMMIT=""
FORCE_COMMIT=false
# Local-source install: copy the agent source tree from this directory
# (the bundle shipped inside the desktop app, or a local checkout) instead of
# cloning from GitHub. Required for desktop builds stamped to commits upstream
# does not have, and for air-gapped first-launch installs.
SOURCE_DIR=""
ENSURE_DEPS=""

MANIFEST_MODE=false
STAGE_NAME=""
JSON_OUTPUT=false
NON_INTERACTIVE=false
INCLUDE_DESKTOP=false

# Detect non-interactive mode (e.g. curl | bash)
# When stdin is not a terminal, read -p will fail with EOF,
# causing set -e to silently abort the entire script.
if [ -t 0 ]; then
    IS_INTERACTIVE=true
else
    IS_INTERACTIVE=false
fi

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-venv)
            USE_VENV=false
            shift
            ;;
        --skip-setup)
            RUN_SETUP=false
            shift
            ;;
        --skip-browser|--no-playwright)
            SKIP_BROWSER=true
            shift
            ;;
        --skip-computer-use)
            SKIP_COMPUTER_USE=true
            shift
            ;;
        --no-skills)
            NO_SKILLS=true
            shift
            ;;
        --branch|-Branch)
            BRANCH="$2"
            shift 2
            ;;
        --commit|-Commit)
            INSTALL_COMMIT="$2"
            shift 2
            ;;
        --force-commit|-ForceCommit)
            FORCE_COMMIT=true
            shift
            ;;
        --source-dir|-SourceDir)
            SOURCE_DIR="$2"
            shift 2
            ;;
        --manifest|-Manifest)
            MANIFEST_MODE=true
            shift
            ;;
        --stage|-Stage)
            STAGE_NAME="$2"
            shift 2
            ;;
        --json|-Json)
            JSON_OUTPUT=true
            shift
            ;;
        --non-interactive|-NonInteractive)
            NON_INTERACTIVE=true
            shift
            ;;
        --include-desktop|-IncludeDesktop)
            INCLUDE_DESKTOP=true
            shift
            ;;
        --dir)
            INSTALL_DIR="$2"
            INSTALL_DIR_EXPLICIT=true
            shift 2
            ;;
        --hermes-home)
            HERMES_HOME="$2"
            shift 2
            ;;
        --ensure)
            ENSURE_DEPS="$2"
            shift 2
            ;;

        -h|--help)
            echo "Hebri Installer"
            echo ""
            echo "Usage: install.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --no-venv      Don't create virtual environment"
            echo "  --skip-setup   Skip interactive setup wizard"
            echo "  --skip-browser Skip Playwright/Chromium install (browser tools won't work)"
            echo "  --skip-computer-use  Skip the cua-driver (Computer Use) install"
            echo "  --no-skills    Start with a blank slate — seed no bundled skills, and"
            echo "                   write \$HERMES_HOME/.no-bundled-skills so future"
            echo "                   'hebri update' runs never inject bundled skills either"
            echo "  --branch NAME  Git branch to install (default: main)"
            echo "  --commit SHA   Pin checkout to a specific commit after clone/update"
            echo "                   (ignored when it would roll an existing install back)"
            echo "  --force-commit Apply --commit even if it rolls the install backwards"
            echo "  --manifest     Print desktop bootstrap stage manifest as JSON"
            echo "  --stage NAME   Run one desktop bootstrap stage"
            echo "  --json         Print a JSON result frame for --stage"
            echo "  --non-interactive  Skip stages that require user input"
            echo "  --include-desktop  Also build the desktop app (apps/desktop -> Hebri.app)"
            echo "  --dir PATH     Installation directory"
            echo "                   default (non-root):  ~/.hebri/hebri-agent"
            echo "                   default (root, Linux): /usr/local/lib/hebri-agent"
            echo "  --hermes-home PATH  Data directory (default: ~/.hebri, or \$HERMES_HOME)"
            echo "  -h, --help     Show this help"
            echo ""
            echo "Notes:"
            echo "  When running as root on Linux, Hebri installs the code under"
            echo "  /usr/local/lib/hebri-agent and links the command into"
            echo "  /usr/local/bin/hebri (Hermes commands are left unchanged)."
            echo "  Data, config, sessions, and logs still live in \$HERMES_HOME"
            echo "  (default /root/.hebri).  This keeps Docker bind-mounted volumes"
            echo "  small and ensures the command is on PATH for all shells."
            echo "  Existing installs at \$HERMES_HOME/hebri-agent are preserved in-place."
            echo "  --ensure DEPS  Install only specified deps (comma-separated)"
            echo "                   Supported: node, browser, ripgrep, ffmpeg"
            echo "                   Does NOT clone repo or create venv"

            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# ============================================================================
# Helper functions
# ============================================================================

print_banner() {
    echo ""
    echo -e "${MAGENTA}${BOLD}"
    echo "┌─────────────────────────────────────────────────────────┐"
    echo "│               ☤ Hebri Installer                         │"
    echo "├─────────────────────────────────────────────────────────┤"
    echo "│  Synapsek's local-first agent workspace.                │"
    echo "└─────────────────────────────────────────────────────────┘"
    echo -e "${NC}"
}

log_info() {
    echo -e "${CYAN}→${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

json_escape() {
    # Enough for short installer status strings; avoids requiring jq during
    # pre-install bootstrap.
    printf '%s' "$1" | tr '\n' ' ' | sed \
        -e 's/\\/\\\\/g' \
        -e 's/"/\\"/g'
}

# npm rewrites tracked package-lock.json files non-deterministically during
# `npm install` / `npm run pack`. On a managed install those diffs are never
# intentional, but they leave the checkout dirty — which forces `hebri update`
# to autostash on every run and makes branch switches fragile. Restore them so
# a fresh install ends with a clean tree. Best-effort; only touches lockfiles.
restore_dirty_lockfiles() {
    local repo="${1:-$INSTALL_DIR}"
    [ -n "$repo" ] && [ -d "$repo/.git" ] || return 0
    command -v git >/dev/null 2>&1 || return 0
    local dirty
    dirty=$(git -C "$repo" diff --name-only 2>/dev/null | grep 'package-lock\.json$' || true)
    [ -z "$dirty" ] && return 0
    echo "$dirty" | while IFS= read -r f; do
        [ -n "$f" ] && git -C "$repo" checkout -- "$f" 2>/dev/null || true
    done
}

# npm rewrites tracked package-lock.json files non-deterministically during
# local builds. On a managed install those diffs are usually runtime churn, not
# intentional user edits, so discard them before the repository-stage stash.
# If package.json in the same directory is also dirty we keep both changes.
discard_update_lockfile_churn() {
    local repo="${1:-$INSTALL_DIR}"
    [ -n "$repo" ] && [ -d "$repo/.git" ] || return 0
    command -v git >/dev/null 2>&1 || return 0

    local dirty_diff
    dirty_diff=$(git -C "$repo" diff --name-only 2>/dev/null) || return 0
    [ -n "$dirty_diff" ] || return 0

    local dirty_package_dirs=""
    local root_lock_protected=0
    while IFS= read -r path; do
        case "$path" in
            *package.json)
                local pkg_dir
                pkg_dir=$(dirname "$path")
                dirty_package_dirs="${dirty_package_dirs}${pkg_dir}"$'\n'
                # The single root lockfile records every workspace's specs (root
                # package.json "workspaces" globs), so a dirty workspace manifest
                # such as apps/desktop/package.json protects it; reverting it there
                # desyncs spec and lock and every later npm ci fails (#112378). A
                # manifest outside the graph (website/) has its own lockfile.
                if [ "$pkg_dir" = "." ]; then
                    root_lock_protected=1
                else
                    # Read the globs line by line: an unquoted $(...) would pathname-expand
                    # them against the caller's CWD before `case` ever sees the pattern.
                    # `case` globs match across "/", so a manifest nested under a workspace
                    # also protects the root lock (fail-safe; Python matches one level).
                    local ws_glob
                    while IFS= read -r ws_glob; do
                        [ -n "$ws_glob" ] || continue
                        case "$pkg_dir" in
                            $ws_glob) root_lock_protected=1 ;;
                        esac
                    done <<WS_EOF
$(sed -n '/"workspaces"[[:space:]]*:/,/\]/p' "$repo/package.json" 2>/dev/null \
        | grep -o '"[^"]*"' | tr -d '"' | grep -v -e '^workspaces$' -e '^packages$')
WS_EOF
                fi
                ;;
        esac
    done <<EOF
$dirty_diff
EOF

    local dirty_locks=""
    local dirty_count=0
    while IFS= read -r path; do
        case "$path" in
            *package-lock.json)
                local lock_dir
                lock_dir=$(dirname "$path")
                if [ "$lock_dir" = "." ]; then
                    [ "$root_lock_protected" -eq 0 ] || continue
                else
                    case $'\n'"$dirty_package_dirs" in
                        *$'\n'"$lock_dir"$'\n'*) continue ;;
                    esac
                fi
                dirty_locks="${dirty_locks}${path}"$'\n'
                dirty_count=$((dirty_count + 1))
                ;;
        esac
    done <<EOF
$dirty_diff
EOF

    [ "$dirty_count" -gt 0 ] || return 0
    while IFS= read -r path; do
        [ -n "$path" ] || continue
        git -C "$repo" checkout -- "$path" 2>/dev/null || true
    done <<EOF
$dirty_locks
EOF
    log_info "Discarded npm lockfile churn (${dirty_count} file(s))"
}

emit_manifest() {
    # Stage-Desktop is included only with --include-desktop, mirroring
    # install.ps1: the signed bootstrap installer (Hermes-Setup) passes it so
    # a GUI install ends up with a launchable app; the Electron app's own
    # first-launch bootstrap and the CLI one-liner omit it (building the
    # desktop from inside the already-running app would clobber it).
    local desktop_stage=""
    if [ "$INCLUDE_DESKTOP" = true ]; then
        desktop_stage='{"name":"desktop","title":"Build desktop app","category":"runtime","needs_user_input":false},'
    fi
    printf '%s' '{"protocol_version":1,"stages":[{"name":"prerequisites","title":"System prerequisites","category":"runtime","needs_user_input":false},{"name":"repository","title":"Download Hebri","category":"runtime","needs_user_input":false},{"name":"venv","title":"Create Python virtual environment","category":"runtime","needs_user_input":false},{"name":"python-deps","title":"Install Python dependencies","category":"runtime","needs_user_input":false},{"name":"node-deps","title":"Install browser-tool dependencies","category":"runtime","needs_user_input":false},{"name":"path","title":"Install hebri command","category":"runtime","needs_user_input":false},{"name":"config","title":"Prepare config and skills","category":"configuration","needs_user_input":false},{"name":"setup","title":"Configure API keys and settings","category":"configuration","needs_user_input":true},{"name":"gateway","title":"Configure gateway service","category":"configuration","needs_user_input":true},'"$desktop_stage"'{"name":"complete","title":"Finish install","category":"runtime","needs_user_input":false}]}'
    printf '\n'
}

stage_needs_user_input() {
    case "$1" in
        setup|gateway) return 0 ;;
        *) return 1 ;;
    esac
}

emit_stage_json() {
    local stage="$1"
    local ok="$2"
    local skipped="${3:-false}"
    local reason="${4:-}"
    local escaped_reason
    escaped_reason="$(json_escape "$reason")"
    if [ -n "$escaped_reason" ]; then
        printf '{"ok":%s,"stage":"%s","skipped":%s,"reason":"%s"}\n' "$ok" "$stage" "$skipped" "$escaped_reason"
    else
        printf '{"ok":%s,"stage":"%s","skipped":%s}\n' "$ok" "$stage" "$skipped"
    fi
}

prompt_yes_no() {
    local question="$1"
    local default="${2:-yes}"
    local prompt_suffix
    local answer=""

    # Use case patterns (not ${var,,}) so this works on bash 3.2 (macOS /bin/bash).
    case "$default" in
        [yY]|[yY][eE][sS]|[tT][rR][uU][eE]|1) prompt_suffix="[Y/n]" ;;
        *) prompt_suffix="[y/N]" ;;
    esac

    if [ "$NON_INTERACTIVE" = true ]; then
        answer=""
    elif [ "$IS_INTERACTIVE" = true ]; then
        read -r -p "$question $prompt_suffix " answer || answer=""
    elif [ -r /dev/tty ] && [ -w /dev/tty ]; then
        printf "%s %s " "$question" "$prompt_suffix" > /dev/tty
        IFS= read -r answer < /dev/tty || answer=""
    else
        answer=""
    fi

    answer="${answer#"${answer%%[![:space:]]*}"}"
    answer="${answer%"${answer##*[![:space:]]}"}"

    if [ -z "$answer" ]; then
        case "$default" in
            [yY]|[yY][eE][sS]|[tT][rR][uU][eE]|1) return 0 ;;
            *) return 1 ;;
        esac
    fi

    case "$answer" in
        [yY]|[yY][eE][sS]) return 0 ;;
        *) return 1 ;;
    esac
}

is_termux() {
    [ -n "${TERMUX_VERSION:-}" ] || [[ "${PREFIX:-}" == *"com.termux/files/usr"* ]]
}

# Decide where the repo checkout + venv live, and where the `hermes` command
# symlink goes.  Called after detect_os so $OS/$DISTRO are known.
#
# Defaults:
#   - Non-root, any OS:       INSTALL_DIR = $HERMES_HOME/hebri-agent
#                             command link in $HOME/.local/bin
#   - Termux (any uid):       INSTALL_DIR = $HERMES_HOME/hebri-agent
#                             command link in $PREFIX/bin (already on PATH)
#   - Root on Linux (new):    INSTALL_DIR = /usr/local/lib/hebri-agent
#                             command link in /usr/local/bin
#                             (unless a legacy install already exists at
#                              $HERMES_HOME/hebri-agent — then preserve it)
#
# Always no-op when the user set --dir or $HERMES_INSTALL_DIR.
resolve_install_layout() {
    if [ "$INSTALL_DIR_EXPLICIT" = true ]; then
        log_info "Install directory: $INSTALL_DIR (explicit)"
        return 0
    fi

    # Termux: package manager manages /data/data/..., keep code in HERMES_HOME.
    if is_termux; then
        INSTALL_DIR="$HERMES_HOME/hebri-agent"
        return 0
    fi

    # Root on Linux: prefer FHS layout unless a legacy install already exists.
    # macOS root installs keep the legacy layout because /usr/local/ on macOS
    # is Homebrew territory and we don't want to fight that.
    if [ "$OS" = "linux" ] && [ "$(id -u)" -eq 0 ]; then
        if [ -d "$HERMES_HOME/hebri-agent/.git" ]; then
            INSTALL_DIR="$HERMES_HOME/hebri-agent"
            log_info "Existing install detected at $INSTALL_DIR — keeping legacy layout"
            log_info "  (new root installs use /usr/local/lib/hebri-agent)"
            return 0
        fi
        INSTALL_DIR="/usr/local/lib/hebri-agent"
        ROOT_FHS_LAYOUT=true
        # Place uv-managed Python under /usr/local/share so the venv interpreter
        # is world-readable.  Default uv paths land in /root/.local/share/uv,
        # which non-root users can't traverse — leaving the shared
        # /usr/local/bin/hebri wrapper unable to exec the bad-interpreter venv
        # python.  See #21457.
        export UV_PYTHON_INSTALL_DIR="${UV_PYTHON_INSTALL_DIR:-/usr/local/share/uv/python}"
        export UV_PYTHON_BIN_DIR="${UV_PYTHON_BIN_DIR:-/usr/local/share/uv/bin}"
        log_info "Root install on Linux — using FHS layout"
        log_info "  Code:    $INSTALL_DIR"
        log_info "  Command: /usr/local/bin/hebri"
        log_info "  Data:    $HERMES_HOME (unchanged)"
        log_info "  uv Python: $UV_PYTHON_INSTALL_DIR (world-readable)"
        return 0
    fi

    # Default: non-root, non-Termux → legacy user-scoped layout.
    INSTALL_DIR="$HERMES_HOME/hebri-agent"
}

get_command_link_dir() {
    if is_termux && [ -n "${PREFIX:-}" ]; then
        echo "$PREFIX/bin"
    elif [ "$ROOT_FHS_LAYOUT" = true ]; then
        echo "/usr/local/bin"
    else
        echo "$HOME/.local/bin"
    fi
}

get_command_link_display_dir() {
    if is_termux && [ -n "${PREFIX:-}" ]; then
        echo '$PREFIX/bin'
    elif [ "$ROOT_FHS_LAYOUT" = true ]; then
        echo '/usr/local/bin'
    else
        echo '~/.local/bin'
    fi
}

# Point a Hermes-managed Node's `npm install -g` at a directory that is on
# PATH. npm's default global prefix for a bundled Node is the Node dir itself,
# so global package binaries land in $HERMES_HOME/node/bin — which is NOT on
# PATH (only the command link dir is) and is wiped on every Node upgrade.
# Redirecting the prefix to the link dir's parent makes global bins resolve to
# the command link dir (node/npm/npx live there too, already on PATH) and
# survive upgrades. Scoped to the managed Node via its prefix-local global
# npmrc, so the user's other Node installs and their ~/.npmrc are untouched.
# Hermes's own global installs pass an explicit --prefix and are unaffected.
# Idempotent and a no-op when there is no Hermes-managed npm, so calling it on
# every install run repairs pre-existing installs, not just fresh ones.
configure_managed_node_npm_prefix() {
    [ -x "$HERMES_HOME/node/bin/npm" ] || return 0
    local link_dir
    link_dir="$(get_command_link_dir)"
    mkdir -p "$HERMES_HOME/node/etc"
    printf 'prefix=%s\n' "$(dirname "$link_dir")" > "$HERMES_HOME/node/etc/npmrc"
}

get_hermes_command_path() {
    local link_dir
    link_dir="$(get_command_link_dir)"
    if [ -x "$link_dir/hebri" ]; then
        echo "$link_dir/hebri"
    else
        echo "hebri"
    fi
}

# ============================================================================
# System detection
# ============================================================================

detect_os() {
    case "$(uname -s)" in
        Linux*)
            if is_termux; then
                OS="android"
                DISTRO="termux"
            else
                OS="linux"
                if [ -f /etc/os-release ]; then
                    . /etc/os-release
                    DISTRO="$ID"
                    # VERSION_ID (e.g. "26.04", "14") lets us tell whether the
                    # apt release is newer than the newest one Playwright's
                    # platform resolver recognizes — the #35166 hang condition.
                    DISTRO_VERSION="${VERSION_ID:-}"
                else
                    DISTRO="unknown"
                    DISTRO_VERSION=""
                fi
            fi
            ;;
        Darwin*)
            OS="macos"
            DISTRO="macos"
            ;;
        CYGWIN*|MINGW*|MSYS*)
            OS="windows"
            DISTRO="windows"
            log_error "Windows detected. Please use the PowerShell installer:"
            log_info "  iex (irm https://raw.githubusercontent.com/satoshilove/hebri/main/scripts/install.ps1)"
            exit 1
            ;;
        *)
            OS="unknown"
            DISTRO="unknown"
            log_warn "Unknown operating system"
            ;;
    esac

    log_success "Detected: $OS ($DISTRO)"
}

# ============================================================================
# Dependency checks
# ============================================================================

# Check a release-pinned digest before executing or extracting a download.
verify_download_sha256() {
    local actual
    if command -v sha256sum >/dev/null 2>&1; then
        actual="$(sha256sum "$1")" || return 1
    else
        actual="$(shasum -a 256 "$1")" || return 1
    fi
    actual="${actual%% *}"
    if [ "$actual" != "$2" ]; then
        log_error "Download integrity check failed: $1. The file was not executed."
        return 1
    fi
}

install_uv() {
    if [ "$DISTRO" = "termux" ]; then
        log_info "Termux detected — using Python's stdlib venv + pip instead of uv"
        UV_CMD=""
        return 0
    fi

    # Hermes owns its own uv at $HERMES_HOME/bin/uv.  Always install there —
    # no PATH probing, no conda guards, no multi-location resolution chains.
    # The runtime update path (hermes_cli/managed_uv.py) looks in the same
    # place, so install.sh and `hebri update` stay in sync.
    local _managed_uv="$HERMES_HOME/bin/uv"

    if [ -x "$_managed_uv" ]; then
        UV_CMD="$_managed_uv"
        UV_VERSION=$($UV_CMD --version 2>/dev/null)
        log_success "Managed uv found ($UV_VERSION)"
        return 0
    fi

    log_info "Installing managed uv into $HERMES_HOME/bin ..."
    mkdir -p "$HERMES_HOME/bin"

    # Two-stage: download the installer, then run it.  Piping
    # `curl | sh` masks curl failures (sh exits 0 on empty stdin)
    # and conflates network errors with installer errors.
    local _uv_install_log _uv_installer
    _uv_install_log="$(mktemp 2>/dev/null || echo "${TMPDIR:-$HERMES_HOME}/hermes-uv-install.$$.log")"
    _uv_installer="$(mktemp 2>/dev/null || echo "${TMPDIR:-$HERMES_HOME}/hermes-uv-installer.$$.sh")"
    if ! curl --connect-timeout 30 --max-time 600 -LsSf https://github.com/astral-sh/uv/releases/download/0.13.6/uv-installer.sh -o "$_uv_installer" 2>"$_uv_install_log"; then
        log_error "Failed to download uv installer from https://astral.sh/uv/install.sh"
        log_info "curl output:"
        sed 's/^/    /' "$_uv_install_log" >&2
        log_info "Install manually: https://docs.astral.sh/uv/getting-started/installation/"
        rm -f "$_uv_install_log" "$_uv_installer"
        exit 1
    fi
    if ! verify_download_sha256 "$_uv_installer" 'f7a56e7afaec49a3bcbc3ac3cdbe917e7c6ce30e0d815308a12e531aa5ef23b7'; then
        rm -f "$_uv_installer"
        return 1
    fi
    # UV_UNMANAGED_INSTALL tells the astral installer to place the binary
    # directly into $HERMES_HOME/bin instead of ~/.local/bin.
    if run_with_timeout 600 env UV_UNMANAGED_INSTALL="$HERMES_HOME/bin" sh "$_uv_installer" >>"$_uv_install_log" 2>&1; then
        rm -f "$_uv_installer"
        if [ -x "$_managed_uv" ]; then
            UV_CMD="$_managed_uv"
        else
            log_error "uv installer reported success but binary not found at $_managed_uv"
            log_info "Installer output:"
            sed 's/^/    /' "$_uv_install_log" >&2
            rm -f "$_uv_install_log"
            exit 1
        fi
        rm -f "$_uv_install_log"
        UV_VERSION=$($UV_CMD --version 2>/dev/null)
        log_success "Managed uv installed ($UV_VERSION)"
    else
        log_error "Failed to install uv"
        log_info "Installer output:"
        sed 's/^/    /' "$_uv_install_log" >&2
        log_info "Install manually: https://docs.astral.sh/uv/getting-started/installation/"
        rm -f "$_uv_install_log" "$_uv_installer"
        exit 1
    fi
}

check_python() {
    if [ "$DISTRO" = "termux" ]; then
        log_info "Checking Termux Python..."
        # Hermes currently declares requires-python >=3.11,<3.14.  Termux can
        # expose a newer default `python` before dependencies have compatible
        # wheels, so do not accept the default interpreter until the upper bound
        # is verified. Prefer the project's pinned minor when present, then
        # other explicit compatible interpreters.
        for python_cmd in python3.11 python3.12 python3.13 python; do
            if command -v "$python_cmd" >/dev/null 2>&1; then
                local candidate_path
                candidate_path="$(command -v "$python_cmd")"
                if "$candidate_path" -c 'import sys; raise SystemExit(0 if (3, 11) <= sys.version_info[:2] < (3, 14) else 1)' 2>/dev/null; then
                    PYTHON_PATH="$candidate_path"
                    PYTHON_FOUND_VERSION="$("$PYTHON_PATH" --version 2>/dev/null)"
                    log_success "Python found: $PYTHON_FOUND_VERSION"
                    return 0
                fi
            fi
        done

        log_info "Installing Python via pkg..."
        pkg install -y python >/dev/null
        PYTHON_PATH="$(command -v python)"
        if "$PYTHON_PATH" -c 'import sys; raise SystemExit(0 if (3, 11) <= sys.version_info[:2] < (3, 14) else 1)' 2>/dev/null; then
            PYTHON_FOUND_VERSION="$("$PYTHON_PATH" --version 2>/dev/null)"
            log_success "Python installed: $PYTHON_FOUND_VERSION"
            return 0
        fi

        # Termux's default `python` package is outside the supported range
        # (e.g. 3.14.x before Rust transitives ship cp314 wheels). The Termux
        # User Repository (TUR) publishes versioned CPython packages
        # (python3.13, python3.11), so try to provision a supported
        # interpreter from there before giving up.
        PYTHON_FOUND_VERSION="$("$PYTHON_PATH" --version 2>/dev/null || true)"
        log_warn "Termux Python $PYTHON_FOUND_VERSION is outside the supported range (>=3.11,<3.14)"
        log_info "Trying the Termux User Repository (TUR) for a supported Python..."
        pkg install -y tur-repo >/dev/null 2>&1 || true
        local tur_pkg
        for tur_pkg in python3.13 python3.12 python3.11; do
            if ! pkg install -y "$tur_pkg" >/dev/null 2>&1; then
                continue
            fi
            if ! command -v "$tur_pkg" >/dev/null 2>&1; then
                continue
            fi
            local tur_path
            tur_path="$(command -v "$tur_pkg")"
            if "$tur_path" -c 'import sys; raise SystemExit(0 if (3, 11) <= sys.version_info[:2] < (3, 14) else 1)' 2>/dev/null; then
                PYTHON_PATH="$tur_path"
                PYTHON_FOUND_VERSION="$("$PYTHON_PATH" --version 2>/dev/null)"
                log_success "Python installed from TUR: $PYTHON_FOUND_VERSION"
                return 0
            fi
        done

        log_error "Termux Python $PYTHON_FOUND_VERSION is not supported; Hebri requires Python >=3.11,<3.14"
        log_info "Install a supported interpreter and re-run this script:"
        log_info "  pkg install tur-repo && pkg install python3.13"
        exit 1
    fi

    log_info "Checking Python $PYTHON_VERSION..."

    # Let uv handle Python — it can download and manage Python versions
    # First check if a suitable Python is already available
    if PYTHON_PATH="$("$UV_CMD" python find "$PYTHON_VERSION" 2>/dev/null)"; then
        PYTHON_FOUND_VERSION="$("$PYTHON_PATH" --version 2>/dev/null)"
        log_success "Python found: $PYTHON_FOUND_VERSION"
        return 0
    fi

    # No 3.11, but any interpreter inside requires-python (>=3.11,<3.14) works: reuse it rather
    # than downloading 3.11 — the download is a hard failure on hosts that cannot reach GitHub
    # releases, and the user already has a supported Python (#10778).
    # --system: with the install's own venv activated (a re-run), `uv python find` would return
    # venv/bin/python3, which setup_venv is about to delete out from under itself.
    if PYTHON_PATH="$("$UV_CMD" python find --system "$PYTHON_SUPPORTED_RANGE" 2>/dev/null)"; then
        PYTHON_FOUND_VERSION="$("$PYTHON_PATH" --version 2>/dev/null)"
        PYTHON_VERSION="$PYTHON_PATH"  # uv venv --python / UV_PYTHON pin onto this interpreter
        log_success "Python found: $PYTHON_FOUND_VERSION (supported; reusing instead of downloading 3.11)"
        return 0
    fi

    # Python not found — use uv to install it (no sudo needed!)
    log_info "Python $PYTHON_VERSION not found, installing via uv..."
    if "$UV_CMD" python install "$PYTHON_VERSION"; then
        PYTHON_PATH="$("$UV_CMD" python find "$PYTHON_VERSION")"
        PYTHON_FOUND_VERSION="$("$PYTHON_PATH" --version 2>/dev/null)"
        log_success "Python installed: $PYTHON_FOUND_VERSION"
    else
        log_error "Failed to install Python $PYTHON_VERSION"
        log_info "Install Python $PYTHON_VERSION manually, then re-run this script"
        exit 1
    fi
}

# Best-effort automatic git provisioning, mirroring install.ps1's Install-Git
# (which downloads PortableGit on Windows). git is required to clone the repo,
# and a fresh "normie" machine with no developer tools won't have it. Returns 0
# if git is available afterwards, non-zero otherwise (caller prints manual
# instructions and aborts).
attempt_install_git() {
    case "$OS" in
        macos)
            # Prefer Homebrew — fully headless when present.
            if command -v brew >/dev/null 2>&1; then
                log_info "Installing Git via Homebrew..."
                brew install git >/dev/null 2>&1 || true
                command -v git >/dev/null 2>&1 && return 0
            fi
            # Fall back to Apple Command Line Tools, which provide git AND the
            # compiler some Python wheels need. `xcode-select --install` pops a
            # system dialog (Apple gates CLT behind it — it cannot be fully
            # silent without MDM), so we trigger it and poll for git to appear.
            if command -v xcode-select >/dev/null 2>&1; then
                log_info "Requesting Apple Command Line Tools (provides git + compiler)..."
                log_info "If a macOS dialog appears, click \"Install\" and accept the license."
                xcode-select --install >/dev/null 2>&1 || true
                local waited=0
                local timeout=900
                while [ "$waited" -lt "$timeout" ]; do
                    if command -v git >/dev/null 2>&1 && git --version >/dev/null 2>&1; then
                        return 0
                    fi
                    sleep 5
                    waited=$((waited + 5))
                    if [ $((waited % 60)) -eq 0 ]; then
                        log_info "Still waiting for Command Line Tools install ($((waited / 60))m)..."
                    fi
                done
            fi
            return 1
            ;;
        linux)
            local sudo_cmd=""
            if [ "$(id -u 2>/dev/null || echo 1000)" -ne 0 ]; then
                command -v sudo >/dev/null 2>&1 && sudo_cmd="sudo"
            fi
            case "$DISTRO" in
                ubuntu|debian)
                    log_info "Installing Git via apt..."
                    $sudo_cmd env DEBIAN_FRONTEND=noninteractive apt-get update -qq >/dev/null 2>&1 || true
                    $sudo_cmd env DEBIAN_FRONTEND=noninteractive apt-get install -y -qq git >/dev/null 2>&1 || true
                    ;;
                fedora)
                    log_info "Installing Git via dnf..."
                    $sudo_cmd dnf install -y git >/dev/null 2>&1 || true
                    ;;
                arch)
                    log_info "Installing Git via pacman..."
                    $sudo_cmd pacman -S --noconfirm git >/dev/null 2>&1 || true
                    ;;
                *)
                    return 1
                    ;;
            esac
            command -v git >/dev/null 2>&1 && return 0
            return 1
            ;;
    esac
    return 1
}

check_git() {
    log_info "Checking Git..."

    # On fresh macOS /usr/bin/git is a stub that exits non-zero until CLT is installed.
    if command -v git &> /dev/null && git --version &> /dev/null; then
        GIT_VERSION=$(git --version | awk '{print $3}')
        log_success "Git $GIT_VERSION found"
        return 0
    fi

    log_error "Git not found"

    if [ "$DISTRO" = "termux" ]; then
        log_info "Installing Git via pkg..."
        pkg install -y git >/dev/null
        if command -v git >/dev/null 2>&1; then
            GIT_VERSION=$(git --version | awk '{print $3}')
            log_success "Git $GIT_VERSION installed"
            return 0
        fi
    fi

    # Try to install it automatically before giving up (parity with install.ps1).
    log_info "Attempting to install Git automatically..."
    if attempt_install_git; then
        GIT_VERSION=$(git --version | awk '{print $3}')
        log_success "Git $GIT_VERSION installed"
        return 0
    fi

    log_warn "Could not install Git automatically. Please install it manually:"

    case "$OS" in
        linux)
            case "$DISTRO" in
                ubuntu|debian)
                    log_info "  sudo apt update && sudo apt install git"
                    ;;
                fedora)
                    log_info "  sudo dnf install git"
                    ;;
                arch)
                    log_info "  sudo pacman -S git"
                    ;;
                *)
                    log_info "  Use your package manager to install git"
                    ;;
            esac
            ;;
        android)
            log_info "  pkg install git"
            ;;
        macos)
            log_info "  xcode-select --install"
            log_info "  Or: brew install git"
            ;;
    esac

    exit 1
}

# Node deps below (install_node_deps) build native addons — most notably
# node-pty, which every install needs — via node-gyp. node-gyp needs a C/C++
# toolchain (make + a compiler); Python and make are already covered by
# check_python/check_node's prerequisites, but the compiler itself was never
# checked, so a missing g++/clang++ only surfaced as a wall of node-gyp/make
# output deep inside `npm install`, with no earlier, actionable warning.
# Best-effort like install_system_packages: warns and lets the caller decide
# whether to proceed rather than aborting the whole install (unlike git,
# which is hard-required much earlier for clone_repo).
check_cxx_compiler() {
    log_info "Checking for a C++ compiler (needed to build native Node modules like node-pty)..."

    if command -v g++ &> /dev/null || command -v clang++ &> /dev/null; then
        log_success "C++ compiler found"
        HAS_CXX_COMPILER=true
        return 0
    fi

    HAS_CXX_COMPILER=false
    log_warn "No C++ compiler found"

    case "$OS" in
        macos)
            # Same Command Line Tools path as attempt_install_git — CLT provides
            # git AND a compiler, so this is usually already satisfied by the
            # check_git step above. Handles the case where git was present
            # without CLT (e.g. installed via Homebrew) so CLT never triggered.
            log_info "Attempting to install Xcode Command Line Tools (provides a C++ compiler)..."
            log_info "If a macOS dialog appears, click \"Install\" and accept the license."
            xcode-select --install >/dev/null 2>&1 || true
            local waited=0
            local timeout=900
            while [ "$waited" -lt "$timeout" ]; do
                if command -v g++ &> /dev/null || command -v clang++ &> /dev/null; then
                    log_success "C++ compiler installed"
                    HAS_CXX_COMPILER=true
                    return 0
                fi
                sleep 5
                waited=$((waited + 5))
                if [ $((waited % 60)) -eq 0 ]; then
                    log_info "Still waiting for Command Line Tools install ($((waited / 60))m)..."
                fi
            done
            ;;
        linux)
            local sudo_cmd=""
            if [ "$(id -u 2>/dev/null || echo 1000)" -ne 0 ]; then
                command -v sudo >/dev/null 2>&1 && sudo_cmd="sudo"
            fi
            log_info "Attempting to install a C++ compiler automatically..."
            case "$DISTRO" in
                ubuntu|debian)
                    log_info "Installing build-essential via apt..."
                    $sudo_cmd env DEBIAN_FRONTEND=noninteractive apt-get update -qq >/dev/null 2>&1 || true
                    $sudo_cmd env DEBIAN_FRONTEND=noninteractive apt-get install -y -qq build-essential >/dev/null 2>&1 || true
                    ;;
                fedora)
                    log_info "Installing gcc-c++ via dnf..."
                    $sudo_cmd dnf install -y gcc-c++ >/dev/null 2>&1 || true
                    ;;
                arch)
                    log_info "Installing base-devel via pacman..."
                    $sudo_cmd pacman -S --noconfirm base-devel >/dev/null 2>&1 || true
                    ;;
            esac
            if command -v g++ &> /dev/null || command -v clang++ &> /dev/null; then
                log_success "C++ compiler installed"
                HAS_CXX_COMPILER=true
                return 0
            fi
            ;;
    esac

    log_warn "Could not install a C++ compiler automatically."
    log_warn "Node steps that compile native modules (e.g. node-pty) will fail below until one is installed."
    log_info "Install it manually, then re-run this installer:"
    case "$OS" in
        linux)
            case "$DISTRO" in
                ubuntu|debian) log_info "  sudo apt install build-essential" ;;
                fedora)        log_info "  sudo dnf install gcc-c++" ;;
                arch)          log_info "  sudo pacman -S base-devel" ;;
                *)             log_info "  Install a C++ compiler (g++/gcc-c++) via your package manager" ;;
            esac
            ;;
        android)
            log_info "  pkg install clang"
            ;;
        macos)
            log_info "  xcode-select --install"
            ;;
    esac
    return 1
}

# The dependency tree supports Node 22.22+, 24.11+, and 26+. nanoid 6 excludes
# Node 23 and 25 while its >=26 arm accepts later releases, and @babel/* 8.x
# requires ^22.18.0 || >=24.11.0 — so accepting 23/25 or an early Node 24
# here only defers the failure to `npm ci` under engine-strict. Keep this in
# sync with the root package.json. Anything outside the supported lines is
# replaced with the Hermes-managed Node $NODE_VERSION.
node_satisfies_build() {
    local ver="${1#v}"
    # Pre-release builds are rejected outright, however new they are. `node-pty`
    # ships no Linux prebuild, so every install compiles it with node-gyp, which
    # fetches the headers named by `process.release.headersUrl` — a URL only
    # published for final releases. nodejs.org/dist/latest-v26.x currently
    # serves node-v26.8.0-<os>-<arch>.tar.xz whose binary reports
    # v26.8.0-alpha.0.0.0; its headers 404, and the install dies at
    # `node-gyp rebuild` with the underlying error swallowed by the
    # `node scripts/prebuild.js || node-gyp rebuild` fallback.
    case "$ver" in *-*) return 1 ;; esac
    local major="${ver%%.*}"
    local minor="${ver#*.}"; minor="${minor%%.*}"
    case "$major" in ''|*[!0-9]*) return 1 ;; esac
    case "$minor" in ''|*[!0-9]*) minor=0 ;; esac
    if [ "$major" -eq 22 ] && [ "$minor" -ge 22 ]; then return 0; fi
    if [ "$major" -eq 24 ] && [ "$minor" -ge 11 ]; then return 0; fi
    if [ "$major" -ge 26 ]; then return 0; fi
    return 1
}

# npm 11.10.0–11.16.x honor `min-release-age` but ignore
# `min-release-age-exclude`, both of which `.npmrc` sets. That combination
# applies the 14-day age gate to packages we deliberately exempted, so every
# install fails ETARGET on a freshly published dependency. The root
# package.json excludes that band via `engines.npm`, and `engine-strict=true`
# makes it fatal — so a system npm in the band cannot install this repo, no
# matter how new its Node is. Returns 0 when the npm is usable.
npm_supports_npmrc() {
    local ver="${1#v}"
    local major="${ver%%.*}"
    local minor="${ver#*.}"; minor="${minor%%.*}"
    case "$major" in ''|*[!0-9]*) return 1 ;; esac
    case "$minor" in ''|*[!0-9]*) minor=0 ;; esac
    # The bad band is 11.10.0 through 11.16.x.
    if [ "$major" -eq 11 ] && [ "$minor" -ge 10 ] && [ "$minor" -le 16 ]; then
        return 1
    fi
    return 0
}

check_node() {
    log_info "Checking Node.js (for browser tools)..."

    # Repair pre-existing Hermes-managed installs where `npm install -g` lands
    # off PATH. No-op when there's no managed Node, so this is safe to run on
    # every install — including re-runs that skip the Node (re)install below.
    configure_managed_node_npm_prefix

    # The system toolchain is only usable when BOTH halves work: a Node new
    # enough for the desktop build AND an npm that can read our .npmrc. A
    # bad-band npm (see npm_supports_npmrc) fails `npm ci` outright, and the
    # managed Node we install instead bundles one that works.
    #
    # npm must actually be reachable, not just node: a stray `node` symlink
    # without a sibling npm (leftover from a node version manager) makes
    # `command -v node` succeed while every later `npm install` silently
    # fails and the desktop build dies with an opaque "Node.js / npm
    # unavailable" (#77003). Node only counts as found when npm resolves on
    # the same PATH.
    if command -v node &> /dev/null && command -v npm &> /dev/null \
        && node_satisfies_build "$(node --version)"; then
        if npm_supports_npmrc "$(npm --version 2>/dev/null)"; then
            log_success "Node.js $(node --version) found"
            HAS_NODE=true
            return 0
        fi
        log_warn "npm $(npm --version) cannot honor this repo's .npmrc (npm 11.10-11.16 ignore"
        log_warn "min-release-age-exclude) — installing Hebri-managed Node $NODE_VERSION instead..."
        install_node
        return
    fi

    # Prefer a Hermes-managed Node from a previous run over a too-old system one.
    if [ -x "$HERMES_HOME/node/bin/node" ] && [ -x "$HERMES_HOME/node/bin/npm" ] \
        && node_satisfies_build "$("$HERMES_HOME/node/bin/node" --version)"; then
        export PATH="$HERMES_HOME/node/bin:$PATH"
        log_success "Node.js $("$HERMES_HOME/node/bin/node" --version) found (Hebri-managed)"
        HAS_NODE=true
        return 0
    fi

    if command -v node &> /dev/null && ! command -v npm &> /dev/null; then
        log_warn "node found but npm is not on PATH (stray node symlink?) — installing Hebri-managed Node $NODE_VERSION LTS..."
    elif command -v node &> /dev/null; then
        log_warn "Node.js $(node --version) is unsupported (Hebri requires Node 22.22+, 24.11+, or 26+) — installing Hebri-managed Node $NODE_VERSION..."
    elif [ "$DISTRO" = "termux" ]; then
        log_info "Node.js not found — installing Node.js via pkg..."
    else
        log_info "Node.js not found — installing Node.js $NODE_VERSION LTS..."
    fi
    install_node
}

# Download and adopt one Node release line (e.g. 26) into ~/.hermes/node/.
#
# Split out of install_node() so the caller can walk a list of candidate lines.
# A line is rejected — and the caller should try an older one — when nodejs.org
# publishes no tarball for this platform, when the download or extraction
# fails, or when the tree it ships fails node_satisfies_build.
#
# Returns 0 with the tree in place, PATH exported and HAS_NODE=true; 1 when the
# line is unusable. Nothing on disk is replaced until the candidate passes, so
# a rejected line leaves any existing managed Node untouched.
install_node_line() {
    local node_line="$1"
    local node_os="$2"
    local node_arch="$3"

    # One reviewed Node release across desktop/server platforms.
    local index_url="https://nodejs.org/dist/v22.23.4/"
    local extension=gz
    command -v xz >/dev/null 2>&1 && extension=xz
    local tarball_name="node-v22.23.4-${node_os}-${node_arch}.tar.${extension}"
    local expected_hash
    case "$tarball_name" in
        node-v22.23.4-darwin-arm64.tar.gz) expected_hash='c9e1dbc748b33ed2d14f42445191ecaf14c56259c7a9a26d0042c49ec2b66428' ;;
        node-v22.23.4-darwin-arm64.tar.xz) expected_hash='037650d0839f457747396f052073fb48333d31bf5abd3c98b74da20d89ebb1ad' ;;
        node-v22.23.4-darwin-x64.tar.gz) expected_hash='efcc2b0db6f94bf53eddb038fe2b370277a042bd29e4f19b8f8e23598795b819' ;;
        node-v22.23.4-darwin-x64.tar.xz) expected_hash='f42abca7aaac61efc57d49fb42ea84fc53bbeba9a749cb03a291ce6e4e7a69c1' ;;
        node-v22.23.4-linux-arm64.tar.gz) expected_hash='f7a1e486dbc8b286847815b477d4fb5e9fb963ed4489c3e1588853d685f589f9' ;;
        node-v22.23.4-linux-arm64.tar.xz) expected_hash='6287aa46b6c375d816e63ae66d024fbbfd70404825aabdfdf898a970871d2f4b' ;;
        node-v22.23.4-linux-armv7l.tar.gz) expected_hash='4318e0c68f62e18583dae85eb645f55c7f2b8a2e8d1fffe91a2e8abd046880ab' ;;
        node-v22.23.4-linux-armv7l.tar.xz) expected_hash='c9057c6a3b8fbb9651ed115c1e96d4a7281b7b9c9ca89fa05865c98ed7ffd437' ;;
        node-v22.23.4-linux-ppc64le.tar.gz) expected_hash='6684903ee2795aafe639dc07203e8a51ed20ae161cf21b6da7c213c8abfed442' ;;
        node-v22.23.4-linux-ppc64le.tar.xz) expected_hash='e4732f45e0cad787d6ba70c4eb6db45dbdb3f286f67dee429dbc6b4ff36eac43' ;;
        node-v22.23.4-linux-s390x.tar.gz) expected_hash='0bdc80fa27331e7f416d1d8553b9aabbc3c158709dc32859e4e85724ac1ac302' ;;
        node-v22.23.4-linux-s390x.tar.xz) expected_hash='07ae074fc218fc42e24c939df0dc0209443fb08eb5b2ed6d26b1bf6757781fff' ;;
        node-v22.23.4-linux-x64-musl.tar.gz) expected_hash='63189402eaa222aabf51b4983e512592131cd2d4a9efc3ad9bf291fe74e3e4de' ;;
        node-v22.23.4-linux-x64-musl.tar.xz) expected_hash='38355b952f0392b91703d38a0d9af84eb0ff77d69828ca4bc8cc3bc3af80a720' ;;
        node-v22.23.4-linux-x64.tar.gz) expected_hash='b8492284c76a54baf58d61668dd0e41ee0fc98adabf9503d30f05d08f55b4406' ;;
        node-v22.23.4-linux-x64.tar.xz) expected_hash='1805bcd35e6815559bd2eb97db438d3fdb0eb3a5e6a977b7c1badca76337e9ce' ;;
        *) log_warn "No reviewed Node archive for $node_os-$node_arch"; return 1 ;;
    esac

    local download_url="${index_url}${tarball_name}"
    local tmp_dir
    tmp_dir=$(mktemp -d)

    log_info "Downloading $tarball_name..."
    if ! curl --connect-timeout 30 --max-time 600 -fsSL "$download_url" -o "$tmp_dir/$tarball_name"; then
        log_warn "Download failed"
        rm -rf "$tmp_dir"
        return 1
    fi

    if ! verify_download_sha256 "$tmp_dir/$tarball_name" "$expected_hash"; then
        rm -rf "$tmp_dir"
        return 1
    fi
    log_info "Extracting the verified Node runtime..."
    if [[ "$tarball_name" == *.tar.xz ]]; then
        tar xf "$tmp_dir/$tarball_name" -C "$tmp_dir"
    else
        tar xzf "$tmp_dir/$tarball_name" -C "$tmp_dir"
    fi

    local extracted_dir
    extracted_dir=$(ls -d "$tmp_dir"/node-v* 2>/dev/null | head -1)

    if [ ! -d "$extracted_dir" ]; then
        log_warn "Extraction failed"
        rm -rf "$tmp_dir"
        return 1
    fi

    # Trust the binary, not the filename. A tarball named for a final release
    # can still carry a pre-release build — latest-v26.x serves
    # node-v26.8.0-<os>-<arch>.tar.xz whose `node --version` is
    # v26.8.0-alpha.0.0.0 — and adopting it leaves node-pty unbuildable for the
    # life of the install. Probe the extracted tree before it replaces anything.
    local candidate_ver
    candidate_ver=$("$extracted_dir/bin/node" --version 2>/dev/null)
    if ! node_satisfies_build "$candidate_ver"; then
        log_warn "Node.js ${candidate_ver:-unreadable} from ${index_url} cannot build native modules — trying an older release line..."
        rm -rf "$tmp_dir"
        return 1
    fi

    # Place into ~/.hermes/node/ and symlink binaries into the same bin dir
    # the hermes command uses (get_command_link_dir): /usr/local/bin for root
    # FHS installs, $PREFIX/bin on Termux, ~/.local/bin otherwise.
    rm -rf "$HERMES_HOME/node"
    mkdir -p "$HERMES_HOME"
    mv "$extracted_dir" "$HERMES_HOME/node"
    rm -rf "$tmp_dir"

    # Node's official linux-x64 builds (observed: v26.7.0) link
    # libatomic.so.1, which minimal Debian/Ubuntu images do not ship —
    # the freshly downloaded binary then fails to start. Install the
    # library up front, best-effort; the version probe below reports
    # clearly if the binary still cannot run (#87460).
    if [ "$OS" = "linux" ] && { [ "$DISTRO" = "ubuntu" ] || [ "$DISTRO" = "debian" ]; }; then
        if command -v apt-get >/dev/null 2>&1; then
            local sudo_cmd=""
            if [ "$(id -u 2>/dev/null || echo 1000)" -ne 0 ]; then
                command -v sudo >/dev/null 2>&1 && sudo_cmd="sudo"
            fi
            $sudo_cmd env DEBIAN_FRONTEND=noninteractive apt-get install -y -qq libatomic1 >/dev/null 2>&1 || true
        fi
    fi

    local node_link_dir
    node_link_dir="$(get_command_link_dir)"
    mkdir -p "$node_link_dir"
    ln -sf "$HERMES_HOME/node/bin/node" "$node_link_dir/node"
    ln -sf "$HERMES_HOME/node/bin/npm"  "$node_link_dir/npm"
    ln -sf "$HERMES_HOME/node/bin/npx"  "$node_link_dir/npx"

    configure_managed_node_npm_prefix

    export PATH="$HERMES_HOME/node/bin:$PATH"

    local installed_ver
    if ! installed_ver=$("$HERMES_HOME/node/bin/node" --version 2>&1); then
        # The adopted Node exists but cannot start (observed: missing
        # libatomic.so.1 on minimal Debian/Ubuntu, #87460). Degrade loudly,
        # surface the loader's real error, and remove the broken tree and
        # bin links so later steps and retry runs start clean. Signal the
        # caller to try an older release line rather than claiming success.
        log_error "Downloaded Node.js failed to start:"
        printf '%s\n' "$installed_ver" >&2
        log_info "On Debian/Ubuntu the usual fix is: sudo apt-get install -y libatomic1"
        rm -rf "$HERMES_HOME/node"
        rm -f "$node_link_dir/node" "$node_link_dir/npm" "$node_link_dir/npx"
        return 1
    fi
    log_success "Node.js $installed_ver installed to ~/.hermes/node/"
    HAS_NODE=true
    return 0
}

install_node() {
    if [ "$DISTRO" = "termux" ]; then
        log_info "Installing Node.js via pkg..."
        if pkg install -y nodejs >/dev/null; then
            local installed_ver
            installed_ver=$(node --version 2>/dev/null || true)
            if [ -n "$installed_ver" ]; then
                log_success "Node.js $installed_ver installed via pkg"
                HAS_NODE=true
            else
                # pkg succeeded but the binary cannot start — the same
                # silent-success class the managed-download probe guards
                # against (#87460). Degrade instead of claiming success.
                log_error "Node.js installed via pkg failed to start:"
                node --version >&2 || true
                HAS_NODE=false
            fi
        else
            log_warn "Failed to install Node.js via pkg"
            HAS_NODE=false
        fi
        return 0
    fi

    local arch=$(uname -m)
    local node_arch
    case "$arch" in
        x86_64)        node_arch="x64"    ;;
        aarch64|arm64) node_arch="arm64"  ;;
        armv7l)        node_arch="armv7l" ;;
        *)
            log_warn "Unsupported architecture ($arch) for Node.js auto-install"
            log_info "Install manually: https://nodejs.org/en/download/"
            HAS_NODE=false
            return 0
            ;;
    esac

    local node_os
    case "$OS" in
        linux) node_os="linux"  ;;
        macos) node_os="darwin" ;;
        *)
            log_warn "Unsupported OS for Node.js auto-install"
            HAS_NODE=false
            return 0
            ;;
    esac

    if install_node_line 22 "$node_os" "$node_arch"; then
        return 0
    fi

    log_warn "No usable Node.js release line found for $node_os-$node_arch"
    log_info "Install manually: https://nodejs.org/en/download/"
    HAS_NODE=false
    return 0
}

check_network_prerequisites() {
    log_info "Checking internet connectivity for package install and web tools..."

    local url
    local failed=false
    local checks=("https://pypi.org/simple/" "https://duckduckgo.com/")

    if ! command -v curl >/dev/null 2>&1; then
        log_warn "curl not found; skipping connectivity probes"
        return 0
    fi

    # Run the probes in parallel — serially, two blocked probes cost
    # 2 × --max-time (16 s) before the user sees any useful error; in
    # parallel the worst case is one --max-time (8 s).
    local pids=()
    local tmpdir
    tmpdir=$(mktemp -d)
    local i=0
    for url in "${checks[@]}"; do
        (
            if curl -fsSI --max-time 8 "$url" >/dev/null 2>&1; then
                : > "$tmpdir/ok_$i"
            fi
        ) &
        pids+=($!)
        i=$((i + 1))
    done
    wait "${pids[@]}" 2>/dev/null

    i=0
    for url in "${checks[@]}"; do
        if [ ! -e "$tmpdir/ok_$i" ]; then
            failed=true
            log_warn "Could not reach $url"
        fi
        i=$((i + 1))
    done
    rm -rf "$tmpdir"

    if [ "$failed" = false ]; then
        log_success "Internet connectivity looks good"
        return 0
    fi

    if [ "$DISTRO" = "termux" ]; then
        log_warn "Termux network prerequisites may be incomplete."
        log_info "Try: pkg install -y ca-certificates curl && pkg update"
        log_info "If mirrors are stale: termux-change-repo"
        log_info "Then test: curl -I https://pypi.org/simple/ && curl -I https://duckduckgo.com/"
    else
        log_warn "Network checks failed. Hebri install may complete, but web search and dependency downloads can fail."
        log_info "Verify internet/DNS and retry if pip install fails."
    fi
}

install_system_packages() {
    # setup_path persists this directory later, but dependency probes must also
    # see commands that were pre-staged there during a fresh install.
    local PATH="$(get_command_link_dir):$PATH"

    # Detect what's missing
    HAS_RIPGREP=false
    HAS_FFMPEG=false
    local need_ripgrep=false
    local need_ffmpeg=false

    log_info "Checking ripgrep (fast file search)..."
    if command -v rg &> /dev/null; then
        log_success "$(rg --version | head -1) found"
        HAS_RIPGREP=true
    else
        need_ripgrep=true
    fi

    log_info "Checking ffmpeg (TTS voice messages)..."
    if command -v ffmpeg &> /dev/null; then
        local ffmpeg_ver=$(ffmpeg -version 2>/dev/null | head -1 | awk '{print $3}')
        log_success "ffmpeg $ffmpeg_ver found"
        HAS_FFMPEG=true
    else
        need_ffmpeg=true
    fi

    # Termux always needs the Android build toolchain for the tested pip path,
    # even when ripgrep/ffmpeg are already present.
    if [ "$DISTRO" = "termux" ]; then
        local termux_pkgs=(clang rust make pkg-config libffi openssl ca-certificates curl)
        if [ "$need_ripgrep" = true ]; then
            termux_pkgs+=("ripgrep")
        fi
        if [ "$need_ffmpeg" = true ]; then
            termux_pkgs+=("ffmpeg")
        fi

        log_info "Installing Termux packages: ${termux_pkgs[*]}"
        if pkg install -y "${termux_pkgs[@]}" >/dev/null; then
            [ "$need_ripgrep" = true ] && HAS_RIPGREP=true && log_success "ripgrep installed"
            [ "$need_ffmpeg" = true ]  && HAS_FFMPEG=true  && log_success "ffmpeg installed"
            log_success "Termux build dependencies installed"
            return 0
        fi

        log_warn "Could not auto-install all Termux packages"
        log_info "Install manually: pkg install ${termux_pkgs[*]}"
        return 0
    fi

    # Nothing to install — done
    if [ "$need_ripgrep" = false ] && [ "$need_ffmpeg" = false ]; then
        return 0
    fi

    # Build a human-readable description + package list
    local desc_parts=()
    local pkgs=()
    if [ "$need_ripgrep" = true ]; then
        desc_parts+=("ripgrep for faster file search")
        pkgs+=("ripgrep")
    fi
    if [ "$need_ffmpeg" = true ]; then
        desc_parts+=("ffmpeg for TTS voice messages")
        pkgs+=("ffmpeg")
    fi
    local description
    description=$(IFS=" and "; echo "${desc_parts[*]}")

    # ── macOS: brew ──
    if [ "$OS" = "macos" ]; then
        if command -v brew &> /dev/null; then
            log_info "Installing ${pkgs[*]} via Homebrew..."
            if brew install "${pkgs[@]}"; then
                [ "$need_ripgrep" = true ] && HAS_RIPGREP=true && log_success "ripgrep installed"
                [ "$need_ffmpeg" = true ]  && HAS_FFMPEG=true  && log_success "ffmpeg installed"
                return 0
            fi
        fi
        log_warn "Could not auto-install (brew not found or install failed)"
        log_info "Install manually: brew install ${pkgs[*]}"
        return 0
    fi

    # ── Linux: resolve package manager command ──
    local pkg_install=""
    case "$DISTRO" in
        ubuntu|debian) pkg_install="apt install -y"   ;;
        fedora)        pkg_install="dnf install -y"   ;;
        arch)          pkg_install="pacman -S --noconfirm" ;;
    esac

    if [ -n "$pkg_install" ]; then
        local install_cmd="$pkg_install ${pkgs[*]}"

        # Prevent needrestart/whiptail dialogs from blocking non-interactive installs
        case "$DISTRO" in
            ubuntu|debian) export DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=a ;;
        esac

        # Already root — just install
        if [ "$(id -u)" -eq 0 ]; then
            log_info "Installing ${pkgs[*]}..."
            if $install_cmd; then
                [ "$need_ripgrep" = true ] && HAS_RIPGREP=true && log_success "ripgrep installed"
                [ "$need_ffmpeg" = true ]  && HAS_FFMPEG=true  && log_success "ffmpeg installed"
                return 0
            fi
        # Passwordless sudo — just install
        elif command -v sudo &> /dev/null && sudo -n true 2>/dev/null; then
            log_info "Installing ${pkgs[*]}..."
            if sudo DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=a $install_cmd; then
                [ "$need_ripgrep" = true ] && HAS_RIPGREP=true && log_success "ripgrep installed"
                [ "$need_ffmpeg" = true ]  && HAS_FFMPEG=true  && log_success "ffmpeg installed"
                return 0
            fi
        # sudo needs password — ask once for everything
        elif command -v sudo &> /dev/null; then
            if [ "$IS_INTERACTIVE" = true ]; then
                echo ""
                log_info "sudo is needed ONLY to install optional system packages (${pkgs[*]}) via your package manager."
                log_info "Hebri itself does not require or retain root access."
                if prompt_yes_no "Install ${description}? (requires sudo)" "no"; then
                    if sudo DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=a $install_cmd; then
                        [ "$need_ripgrep" = true ] && HAS_RIPGREP=true && log_success "ripgrep installed"
                        [ "$need_ffmpeg" = true ]  && HAS_FFMPEG=true  && log_success "ffmpeg installed"
                        return 0
                    fi
                fi
            elif (: </dev/tty) 2>/dev/null; then
                # Non-interactive (e.g. curl | bash) but a terminal is available.
                # Read the prompt from /dev/tty (same approach the setup wizard uses).
                # Probe by actually opening /dev/tty: a bare existence test passes
                # in Docker builds where the device node is in the mount namespace
                # but opening fails with ENXIO. See #16746.
                echo ""
                log_info "sudo is needed ONLY to install optional system packages (${pkgs[*]}) via your package manager."
                log_info "Hebri itself does not require or retain root access."
                if prompt_yes_no "Install ${description}?" "yes"; then
                    if sudo DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=a $install_cmd < /dev/tty; then
                        [ "$need_ripgrep" = true ] && HAS_RIPGREP=true && log_success "ripgrep installed"
                        [ "$need_ffmpeg" = true ]  && HAS_FFMPEG=true  && log_success "ffmpeg installed"
                        return 0
                    fi
                fi
            else
                log_warn "Non-interactive mode and no terminal available — cannot install system packages"
                log_info "Install manually after setup completes: sudo $install_cmd"
            fi
        fi
    fi

    # ── Fallback for ripgrep: cargo ──
    if [ "$need_ripgrep" = true ] && [ "$HAS_RIPGREP" = false ]; then
        if command -v cargo &> /dev/null; then
            log_info "Trying cargo install ripgrep (no sudo needed)..."
            if cargo install ripgrep; then
                log_success "ripgrep installed via cargo"
                HAS_RIPGREP=true
            fi
        fi
    fi

    # ── Show manual instructions for anything still missing ──
    if [ "$HAS_RIPGREP" = false ] && [ "$need_ripgrep" = true ]; then
        log_warn "ripgrep not installed (file search will use grep fallback)"
        show_manual_install_hint "ripgrep"
    fi
    if [ "$HAS_FFMPEG" = false ] && [ "$need_ffmpeg" = true ]; then
        log_warn "ffmpeg not installed (TTS voice messages will be limited)"
        show_manual_install_hint "ffmpeg"
    fi
}

show_manual_install_hint() {
    local pkg="$1"
    log_info "To install $pkg manually:"
    case "$OS" in
        linux)
            case "$DISTRO" in
                ubuntu|debian) log_info "  sudo apt install $pkg" ;;
                fedora)        log_info "  sudo dnf install $pkg" ;;
                arch)          log_info "  sudo pacman -S $pkg"   ;;
                *)             log_info "  Use your package manager or visit the project homepage" ;;
            esac
            ;;
        android)
            log_info "  pkg install $pkg"
            ;;
        macos) log_info "  brew install $pkg" ;;
    esac
}

# ============================================================================
# Installation
# ============================================================================

clone_repo() {
    log_info "Installing to $INSTALL_DIR..."

    # An interrupted previous clone leaves a .git with no initial commit, where
    # the update path's `git stash` / `git checkout` abort with "You do not
    # have the initial commit yet" and fail the install (#40998). Move such a
    # partial checkout aside -- never delete it, in case it holds something the
    # user wants -- so the fresh-clone path below can proceed.
    if [ -d "$INSTALL_DIR/.git" ] && ! git -C "$INSTALL_DIR" rev-parse --verify HEAD >/dev/null 2>&1; then
        backup_dir="${INSTALL_DIR}.broken-$(date -u +%Y%m%d-%H%M%S)"
        log_warn "Existing checkout at $INSTALL_DIR has no commits (interrupted clone)."
        log_warn "Moving it aside to $backup_dir before re-cloning."
        mv "$INSTALL_DIR" "$backup_dir"
    fi

    if [ -d "$INSTALL_DIR" ]; then
        if [ -d "$INSTALL_DIR/.git" ]; then
            # Bundle install (no origin remote): refresh by re-copying from the
            # local source dir instead of a git pull (Repair install path).
            if [ -n "$SOURCE_DIR" ] && [ -f "$SOURCE_DIR/pyproject.toml" ] \
               && ! git -C "$INSTALL_DIR" remote 2>/dev/null | grep -q .; then
                log_info "Existing bundle install found; refreshing from local source: $SOURCE_DIR"
                # cp -R overlays the source onto the checkout; runtime state
                # (managed Pythons in .hermes-runtime, the venv, node_modules)
                # is deliberately PRESERVED -- deleting it would force
                # re-downloads on every Repair run.
                cp -R "$SOURCE_DIR/." "$INSTALL_DIR/"
                (cd "$INSTALL_DIR" && git add -A \
                    && git -c user.email=hebri@synapsek.local -c user.name="Hebri Installer" commit -q --allow-empty -m "Hebri: bundle refresh") || true
                log_success "Bundle install refreshed from local source"
                return 0
            fi

            log_info "Existing installation found, updating..."
            cd "$INSTALL_DIR"

            local autostash_ref=""
            discard_update_lockfile_churn "$INSTALL_DIR"
            if [ -n "$(git status --porcelain)" ]; then
                # A previously interrupted update can leave the index with
                # unmerged entries. In that state `git stash` aborts with
                # "could not write index" and the later `git checkout` aborts
                # with "you need to resolve your current index first", failing
                # the whole install at the repository stage. Clear the conflict
                # markers with `git reset` first -- this keeps working-tree
                # changes (they're still stashed just below) and only drops the
                # index-level conflict state. Mirrors the `hebri update` path
                # (#4735).
                if [ -n "$(git ls-files --unmerged)" ]; then
                    log_info "Clearing unmerged index entries from a previous conflict..."
                    git reset -q
                fi
                local stash_name
                stash_name="hermes-install-autostash-$(date -u +%Y%m%d-%H%M%S)"
                log_info "Local changes detected, stashing before update..."
                git stash push --include-untracked -m "$stash_name"
                autostash_ref="stash@{0}"
            fi

            # Fetch only the target branch. A bare `git fetch origin` pulls
            # every ref, and this repo carries thousands of auto-generated
            # branches — on a non-single-branch checkout that turns each update
            # into a multi-minute download that can stall the installer.
            git remote set-branches origin "$BRANCH" 2>/dev/null || true
            git fetch origin "$BRANCH"
            git checkout "$BRANCH"
            # Managed installs should follow origin/$BRANCH exactly. If the
            # checkout has diverged (or has local-only commits), ff-only pull
            # cannot succeed — mirror ``hebri update`` and reset to the
            # fetched remote so bootstrap/install can recover.
            if ! git pull --ff-only origin "$BRANCH"; then
                log_warn "Fast-forward not possible; resetting managed install to origin/$BRANCH..."
                # Park commits the reset drops behind a rescue ref, same namespace
                # as ``hebri update`` (which also prunes these refs).
                local dropped rescue_kind rescue_ref
                dropped="$(git rev-list --count "origin/$BRANCH..HEAD" 2>/dev/null || echo 0)"
                if [ "${dropped:-0}" -gt 0 ]; then
                    rescue_kind="diverged"
                    git merge-base HEAD "origin/$BRANCH" >/dev/null 2>&1 || rescue_kind="orphan"
                    rescue_ref="refs/hermes-update-backups/$rescue_kind-$BRANCH-$(date -u +%Y%m%d-%H%M%S)-$(git rev-parse --short=12 HEAD)"
                    if git update-ref "$rescue_ref" HEAD; then
                        log_warn "$dropped commit(s) not on origin/$BRANCH backed up to $rescue_ref"
                        log_warn "List them with: git -C \"$INSTALL_DIR\" log origin/$BRANCH..$rescue_ref"
                    else
                        log_warn "Could not back up local commits (HEAD was $(git rev-parse HEAD))"
                    fi
                fi
                git reset --hard "origin/$BRANCH"
            fi

            if [ -n "$autostash_ref" ]; then
                local restore_now="yes"
                if [ -t 0 ] && [ -t 1 ]; then
                    echo
                    log_warn "Local changes were stashed before updating."
                    log_warn "Restoring them may reapply local customizations onto the updated codebase."
                    printf "Restore local changes now? [Y/n] "
                    read -r restore_answer
                    case "$restore_answer" in
                        ""|y|Y|yes|YES|Yes) restore_now="yes" ;;
                        *) restore_now="no" ;;
                    esac
                fi

                if [ "$restore_now" = "yes" ]; then
                    log_info "Restoring local changes..."
                    local restore_output=""
                    local restore_ok="yes"
                    if restore_output="$(git stash apply "$autostash_ref" 2>&1)"; then
                        restore_ok="yes"
                    else
                        restore_ok="no"
                    fi
                    local conflicted_files=""
                    conflicted_files="$(git diff --name-only --diff-filter=U || true)"
                    if [ "$restore_ok" = "yes" ] && [ -z "$conflicted_files" ]; then
                        git stash drop "$autostash_ref" >/dev/null
                        log_warn "Local changes were restored on top of the updated codebase."
                        log_warn "Review git diff / git status if Hebri behaves unexpectedly."
                    else
                        log_error "Update pulled new code, but restoring local changes hit conflicts."
                        if [ -n "$restore_output" ]; then
                            printf '%s\n' "$restore_output"
                        fi
                        if [ -n "$conflicted_files" ]; then
                            printf '\nConflicted files:\n'
                            while IFS= read -r file; do
                                [ -n "$file" ] && printf '  • %s\n' "$file"
                            done <<EOF
$conflicted_files
EOF
                        fi
                        printf '\n'
                        log_info "Your stashed changes are preserved — nothing is lost."
                        log_info "  Stash ref: $autostash_ref"
                        git reset --hard HEAD >/dev/null 2>&1 || true
                        log_info "Working tree reset to clean state."
                        log_info "Restore your changes later with: git stash apply $autostash_ref"
                    fi
                else
                    log_info "Skipped restoring local changes."
                    log_info "Your changes are still preserved in git stash."
                    log_info "Restore manually with: git stash apply $autostash_ref"
                fi
            fi
        else
            log_error "Directory exists but is not a git repository: $INSTALL_DIR"
            log_info "Remove it or choose a different directory with --dir"
            exit 1
        fi
    else
        # Local-source install (desktop bundle or dev checkout): copy the tree
        # instead of fetching from GitHub. Desktop builds are stamped to
        # locally-committed SHAs that upstream does not have, so every network
        # path 404s for them. This is also the air-gapped/offline path.
        if [ -n "$SOURCE_DIR" ]; then
            if [ -f "$SOURCE_DIR/pyproject.toml" ]; then
                log_info "Installing from local source directory: $SOURCE_DIR"
                rm -rf "$INSTALL_DIR" 2>/dev/null
                mkdir -p "$(dirname "$INSTALL_DIR")"
                cp -R "$SOURCE_DIR" "$INSTALL_DIR"
                rm -rf "$INSTALL_DIR/.git" "$INSTALL_DIR/node_modules" "$INSTALL_DIR/.venv" "$INSTALL_DIR/__pycache__" 2>/dev/null || true
                # Give the checkout a resolvable HEAD so the bootstrap marker,
                # stamps, and update bookkeeping work (mirrors install.ps1).
                if (cd "$INSTALL_DIR" && git init -q && git checkout -q -b main && git add -A \
                    && git -c user.email=hebri@synapsek.local -c user.name="Hebri Installer" commit -q -m "Hebri: local bundle install"); then
                    log_success "Local source checkout committed (HEAD resolvable)"
                else
                    log_warn "Local source copied; git commit failed (marker will fall back to the install pin)"
                fi
                return 0
            else
                log_warn "SOURCE_DIR '$SOURCE_DIR' not found or missing pyproject.toml; falling through to GitHub."
            fi
        fi

        # Try SSH first (for private repo access), fall back to HTTPS
        # GIT_SSH_COMMAND disables interactive prompts and sets a short timeout
        # so SSH fails fast instead of hanging when no key is configured.
        log_info "Trying SSH clone..."
        if GIT_SSH_COMMAND="ssh -o BatchMode=yes -o ConnectTimeout=5" \
           git clone --depth 1 --branch "$BRANCH" "$REPO_URL_SSH" "$INSTALL_DIR" 2>/dev/null; then
            log_success "Cloned via SSH"
        else
            rm -rf "$INSTALL_DIR" 2>/dev/null  # Clean up partial SSH clone
            log_info "SSH failed, trying HTTPS..."
            # GitHub throttles packfile generation for large repos (this one:
            # ~9.6k files at HEAD plus thousands of auto-generated branches)
            # with repo-scoped HTTP 429s that are NOT client IP rate limits —
            # an anonymous clone of a small repo succeeds and the API quota
            # is untouched, but the single big pack behind `--depth 1` dies
            # mid-transfer with "RPC failed; HTTP 429 / expected 'packfile'"
            # (#89624, same throttle as the update path in #89287). Retry
            # with backoff, then degrade to a blobless partial clone + fetch
            # (many small packs instead of one big one — what gets past the
            # throttle). Fully materialize the tree afterwards so the rest of
            # the installer sees the normal files.
            local clone_ok=false
            local attempt=0
            local max_attempts=4
            for attempt in $(seq 1 "$max_attempts"); do
                [ "$attempt" -gt 1 ] && log_info "Retrying HTTPS clone (attempt $attempt/$max_attempts)..."
                if git clone --depth 1 --single-branch --branch "$BRANCH" \
                     "$REPO_URL_HTTPS" "$INSTALL_DIR"; then
                    clone_ok=true
                    break
                fi
                rm -rf "$INSTALL_DIR" 2>/dev/null  # partial clone is unusable
                [ "$attempt" -lt "$max_attempts" ] && sleep $((attempt * 5))
            done
            if [ "$clone_ok" != true ]; then
                log_info "Direct clone throttled — trying blobless partial clone..."
                # --no-checkout keeps the clone itself to commits+trees (small,
                # gets past the pack throttle). Without it the blob fetch runs
                # inside `git clone`'s own checkout step, the throttle kills
                # the whole clone, and this fallback degrades to one more
                # failed clone. The blobs are fetched by the reset below — a
                # separate request the retry can actually wrap.
                if git clone --depth 1 --single-branch --filter=blob:none \
                     --no-checkout --branch "$BRANCH" "$REPO_URL_HTTPS" "$INSTALL_DIR"; then
                    # Materialize the working tree: on a --no-checkout clone
                    # this reset is the step that fetches the blobs (several
                    # small packs instead of one big one). Fail closed — a
                    # half-materialized checkout must not report success and
                    # hand the rest of the installer an unusable tree.
                    if (cd "$INSTALL_DIR" \
                        && (git reset --hard HEAD >/dev/null 2>&1 \
                            || { sleep 5; git reset --hard HEAD >/dev/null 2>&1; })); then
                        clone_ok=true
                    else
                        rm -rf "$INSTALL_DIR" 2>/dev/null  # unusable checkout
                    fi
                else
                    rm -rf "$INSTALL_DIR" 2>/dev/null
                fi
            fi
            if [ "$clone_ok" = true ]; then
                log_success "Cloned via HTTPS"
            else
                log_error "Failed to clone repository"
                exit 1
            fi
        fi
    fi

    cd "$INSTALL_DIR"

    if [ -n "$INSTALL_COMMIT" ]; then
        # Validate the commit argument: must look like a hex SHA (full 40-char
        # or abbreviated 7-39 char). Reject anything else early so the user
        # gets a clear error instead of a misleading git message (#87268).
        if ! printf '%s' "$INSTALL_COMMIT" | grep -qE '^[0-9a-fA-F]{7,40}$'; then
            log_error "--commit expects a hex SHA (7-40 chars), got: $INSTALL_COMMIT"
            return 1
        fi
        # A commit pin must never move an existing install BACKWARDS. The
        # bootstrap installer bakes its build-time commit into the binary
        # (BUILD_PIN_COMMIT) and passes it as --commit on every install-mode
        # run -- including the one the desktop's failure screen retries. An
        # installer built months ago would otherwise rewind a current checkout
        # to its build commit, stranding the user on ancient code with a
        # current venv. Only pin when the target is not already an ancestor of
        # HEAD; a fresh clone has no such ancestry and pins normally.
        if ! git cat-file -e "$INSTALL_COMMIT^{commit}" 2>/dev/null; then
            if ! git fetch origin "$INSTALL_COMMIT"; then
                log_error "Could not fetch commit $INSTALL_COMMIT from origin."
                log_error "Abbreviated SHAs are not supported — use the full 40-char hash."
                log_error "Find it with: git ls-remote origin | grep <short-sha>"
                return 1
            fi
        fi
        if git rev-parse --verify --quiet HEAD >/dev/null 2>&1 \
           && git merge-base --is-ancestor "$INSTALL_COMMIT" HEAD 2>/dev/null \
           && [ "$(git rev-parse "$INSTALL_COMMIT^{commit}" 2>/dev/null)" != "$(git rev-parse HEAD)" ]; then
            if [ "$FORCE_COMMIT" = true ]; then
                log_warn "--force-commit: rolling this install back to $INSTALL_COMMIT."
                if ! git checkout --detach "$INSTALL_COMMIT"; then
                    log_error "Failed to detach at $INSTALL_COMMIT"
                    return 1
                fi
            else
                log_warn "Ignoring --commit $INSTALL_COMMIT: the checkout is already newer."
                log_warn "Pinning to it would roll this install back. Pass --force-commit to override."
            fi
        else
            log_info "Pinning checkout to commit $INSTALL_COMMIT..."
            if ! git checkout --detach "$INSTALL_COMMIT"; then
                log_error "Failed to detach at $INSTALL_COMMIT"
                return 1
            fi
        fi
    fi

    log_success "Repository ready"
}

setup_venv() {
    if [ "$USE_VENV" = false ]; then
        log_info "Skipping virtual environment (--no-venv)"
        return 0
    fi

    if [ "$DISTRO" = "termux" ]; then
        log_info "Creating virtual environment with Termux Python..."

        if [ -d "venv" ]; then
            log_info "Virtual environment already exists, recreating..."
            rm -rf venv
        fi

        "$PYTHON_PATH" -m venv venv
        log_success "Virtual environment ready ($(./venv/bin/python --version 2>/dev/null))"
        return 0
    fi

    log_info "Creating virtual environment with Python $PYTHON_VERSION..."

    if [ -d "venv" ]; then
        log_info "Virtual environment already exists, recreating..."
        rm -rf venv
    fi

    # uv creates the venv and pins the Python version in one step. Fail loudly: `set -e` does not
    # reach this line's callers on every path, and a missing venv used to be reported as ready.
    if ! $UV_CMD venv venv --python "$PYTHON_VERSION" || [ ! -x "venv/bin/python" ]; then
        log_error "Failed to create the virtual environment with Python $PYTHON_VERSION"
        exit 1
    fi

    # Neutralize any inherited UV_PYTHON (e.g. UV_PYTHON=3.14 left in the
    # user's shell env). uv honours UV_PYTHON over an existing venv for the
    # later `uv sync` / `uv pip install` tiers, so without this it would
    # silently delete this 3.11 venv and recreate it at the inherited
    # version — building Rust transitives that have no wheel for that
    # version from source via maturin, which fails. Pinning UV_PYTHON to the
    # interpreter we just created forces every subsequent uv command onto it.
    if [ -x "$INSTALL_DIR/venv/bin/python" ]; then
        export UV_PYTHON="$INSTALL_DIR/venv/bin/python"
    fi

    log_success "Virtual environment ready ($(./venv/bin/python --version 2>/dev/null || echo "Python $PYTHON_VERSION"))"
}

install_deps() {
    source "$INSTALL_DIR/scripts/lib/install-dependencies.sh"
    hebri_install_deps
}

setup_path() {
    log_info "Setting up hebri command..."

    if [ "$USE_VENV" = true ]; then
        HERMES_BIN="$INSTALL_DIR/venv/bin/python"
        HERMES_ENTRYPOINT="$INSTALL_DIR/hermes"
    else
        HERMES_BIN="$(which hebri 2>/dev/null || echo "")"
        if [ -z "$HERMES_BIN" ]; then
            log_warn "hebri not found on PATH after install"
            return 0
        fi
    fi

    # Verify the interpreter and the checked-in entrypoint needed by the launcher.
    if [ ! -x "$HERMES_BIN" ] || { [ "$USE_VENV" = true ] && [ ! -f "$HERMES_ENTRYPOINT" ]; }; then
        log_warn "Hebri launcher prerequisites not found"
        log_info "This usually means the Python package install didn't complete successfully."
        if [ "$DISTRO" = "termux" ]; then
            log_info "Try: cd $INSTALL_DIR && python -m pip install -e '.[termux-all]' -c constraints-termux.txt"
        else
            log_info "Try: cd $INSTALL_DIR && uv pip install -e '.[all]'"
        fi
        return 0
    fi

    local command_link_dir
    local command_link_display_dir
    command_link_dir="$(get_command_link_dir)"
    command_link_display_dir="$(get_command_link_display_dir)"

    # Publish only Hebri commands. An existing Hermes installation owns its names.
    # We intentionally clear PYTHONPATH/PYTHONHOME here so inherited env vars
    # can't make this launcher import modules from another checkout.
    mkdir -p "$command_link_dir"
    # Retire only aliases proven to target this exact Hebri checkout. Original
    # Hermes wrappers (and ambiguous symlinks) are never removed by this repair.
    local legacy_command
    for legacy_command in hermes hermes-agent hermes-acp; do
        local legacy_path="$command_link_dir/$legacy_command"
        if [ -f "$legacy_path" ] && [ ! -L "$legacy_path" ] \
            && grep -Fq "\"$INSTALL_DIR/venv/bin/python\"" "$legacy_path"; then
            rm -f "$legacy_path"
        fi
    done
    # Older installs created this path as a symlink to $HERMES_BIN. Without
    # the rm, `cat >` follows the symlink and overwrites the venv pip entry
    # point with this shim — making `exec "$HERMES_BIN"` self-recurse. (#21454)
    rm -f "$command_link_dir/hebri"
    if [ "$USE_VENV" = true ]; then
        # uv-generated console scripts resolve themselves through `realpath`,
        # which stock macOS does not provide. Run the checked-in entrypoint
        # with the venv interpreter instead, so the public launcher remains
        # independent of non-standard shell utilities.
        cat > "$command_link_dir/hebri" <<EOF
#!/usr/bin/env bash
unset PYTHONPATH
unset PYTHONHOME
export HEBRI_HOME="\${HEBRI_HOME:-$HERMES_HOME}"
export HERMES_HOME="\$HEBRI_HOME"
exec "$HERMES_BIN" "$HERMES_ENTRYPOINT" "\$@"
EOF
    else
        cat > "$command_link_dir/hebri" <<EOF
#!/usr/bin/env bash
unset PYTHONPATH
unset PYTHONHOME
export HEBRI_HOME="\${HEBRI_HOME:-$HERMES_HOME}"
export HERMES_HOME="\$HEBRI_HOME"
exec "$HERMES_BIN" "\$@"
EOF
    fi
    chmod +x "$command_link_dir/hebri"
    log_success "Installed hebri launcher → $command_link_display_dir/hebri"

    # Also expose `hermes-agent`. The `hermes-agent` console script declared in
    # pyproject.toml's [project.scripts] lives inside the venv, which is not on
    # the login-shell PATH. Without this launcher users can't invoke the agent
    # entrypoint directly from outside the venv. (#74819)
    rm -f "$command_link_dir/hebri-agent"
    if [ "$USE_VENV" = true ]; then
        cat > "$command_link_dir/hebri-agent" <<EOF
#!/usr/bin/env bash
unset PYTHONPATH
unset PYTHONHOME
export HEBRI_HOME="\${HEBRI_HOME:-$HERMES_HOME}"
export HERMES_HOME="\$HEBRI_HOME"
exec "$HERMES_BIN" "$INSTALL_DIR/run_agent.py" "\$@"
EOF
    else
        cat > "$command_link_dir/hebri-agent" <<EOF
#!/usr/bin/env bash
unset PYTHONPATH
unset PYTHONHOME
export HEBRI_HOME="\${HEBRI_HOME:-$HERMES_HOME}"
export HERMES_HOME="\$HEBRI_HOME"
exec "$HERMES_BIN" run_agent.py "\$@"
EOF
    fi
    chmod +x "$command_link_dir/hebri-agent"
    log_success "Installed hermes-agent launcher → $command_link_display_dir/hebri-agent"

    # Also expose `hermes-acp`. ACP hosts (Zed, JetBrains, Buzz) resolve the
    # agent by command name on the login-shell PATH, and the `hermes-acp`
    # console script lives inside the venv, which is not on that PATH. Without
    # this launcher those hosts report Hermes as not installed. (#21454 applies
    # here too: clear the path first so `cat >` cannot follow an old symlink
    # into the venv and overwrite the console script.)
    rm -f "$command_link_dir/hebri-acp"
    if [ "$USE_VENV" = true ]; then
        cat > "$command_link_dir/hebri-acp" <<EOF
#!/usr/bin/env bash
unset PYTHONPATH
unset PYTHONHOME
export HEBRI_HOME="\${HEBRI_HOME:-$HERMES_HOME}"
export HERMES_HOME="\$HEBRI_HOME"
exec "$HERMES_BIN" "$HERMES_ENTRYPOINT" acp "\$@"
EOF
    else
        cat > "$command_link_dir/hebri-acp" <<EOF
#!/usr/bin/env bash
unset PYTHONPATH
unset PYTHONHOME
export HEBRI_HOME="\${HEBRI_HOME:-$HERMES_HOME}"
export HERMES_HOME="\$HEBRI_HOME"
exec "$HERMES_BIN" acp "\$@"
EOF
    fi
    chmod +x "$command_link_dir/hebri-acp"
    log_success "Installed hermes-acp launcher → $command_link_display_dir/hebri-acp"

    if [ "$DISTRO" = "termux" ]; then
        export PATH="$command_link_dir:$PATH"
        log_info "$command_link_display_dir is the native Termux command path"
        log_success "hebri command ready"
        return 0
    fi

    # FHS layout: /usr/local/bin is normally on PATH for login shells (via
    # /etc/profile pathmunge), but on RHEL/CentOS/Rocky/Alma 8+ non-login
    # interactive root shells (su, sudo -s, tmux panes, some web terminals)
    # only source /etc/bashrc, which does NOT add /usr/local/bin — and
    # /root/.bash_profile doesn't either.  So verify with `command -v` and
    # fall back to writing a PATH guard into /root/.bashrc when needed.
    if [ "$ROOT_FHS_LAYOUT" = true ]; then
        export PATH="$command_link_dir:$PATH"
        # Probe a fresh non-login interactive bash the way the user will use it.
        # `bash -i -c` sources ~/.bashrc but NOT ~/.bash_profile or /etc/profile,
        # which is the exact scenario where RHEL root loses /usr/local/bin.
        if env -i HOME="$HOME" TERM="${TERM:-dumb}" bash -i -c 'command -v hebri' \
                >/dev/null 2>&1; then
            log_info "/usr/local/bin is already on PATH for all shells"
            log_success "hebri command ready"
            return 0
        fi

        log_info "hebri not on PATH in non-login shells (common on RHEL-family)"
        PATH_LINE='export PATH="/usr/local/bin:$PATH"'
        PATH_COMMENT='# Hebri Agent — ensure /usr/local/bin is on PATH (RHEL non-login shells)'
        for SHELL_CONFIG in "$HOME/.bashrc" "$HOME/.bash_profile"; do
            [ -f "$SHELL_CONFIG" ] || continue
            if ! grep -v '^[[:space:]]*#' "$SHELL_CONFIG" 2>/dev/null \
                    | grep -qE 'PATH=.*(/usr/local/bin|\$command_link_dir)'; then
                echo "" >> "$SHELL_CONFIG"
                echo "$PATH_COMMENT" >> "$SHELL_CONFIG"
                echo "$PATH_LINE" >> "$SHELL_CONFIG"
                log_success "Added /usr/local/bin to PATH in $SHELL_CONFIG"
            fi
        done
        log_success "hebri command ready"
        return 0
    fi

    # Check if ~/.local/bin is on PATH; if not, add it to shell config.
    # Detect the user's actual login shell (not the shell running this script,
    # which is always bash when piped from curl).
    if ! echo "$PATH" | tr ':' '\n' | grep -q "^$command_link_dir$"; then
        SHELL_CONFIGS=()
        IS_FISH=false
        LOGIN_SHELL="$(basename "${SHELL:-/bin/bash}")"
        case "$LOGIN_SHELL" in
            zsh)
                [ -f "$HOME/.zshrc" ] && SHELL_CONFIGS+=("$HOME/.zshrc")
                [ -f "$HOME/.zprofile" ] && SHELL_CONFIGS+=("$HOME/.zprofile")
                # If neither exists, create ~/.zshrc (common on fresh macOS installs)
                if [ ${#SHELL_CONFIGS[@]} -eq 0 ]; then
                    touch "$HOME/.zshrc"
                    SHELL_CONFIGS+=("$HOME/.zshrc")
                fi
                ;;
            bash)
                [ -f "$HOME/.bashrc" ] && SHELL_CONFIGS+=("$HOME/.bashrc")
                [ -f "$HOME/.bash_profile" ] && SHELL_CONFIGS+=("$HOME/.bash_profile")
                ;;
            fish)
                # fish uses ~/.config/fish/config.fish and fish_add_path — not export PATH=
                IS_FISH=true
                FISH_CONFIG="$HOME/.config/fish/config.fish"
                mkdir -p "$(dirname "$FISH_CONFIG")"
                touch "$FISH_CONFIG"
                ;;
            *)
                [ -f "$HOME/.bashrc" ] && SHELL_CONFIGS+=("$HOME/.bashrc")
                [ -f "$HOME/.zshrc" ] && SHELL_CONFIGS+=("$HOME/.zshrc")
                ;;
        esac
        # Also ensure ~/.profile has it (sourced by login shells on
        # Ubuntu/Debian/WSL even when ~/.bashrc is skipped)
        [ "$IS_FISH" = "false" ] && [ -f "$HOME/.profile" ] && SHELL_CONFIGS+=("$HOME/.profile")

        PATH_LINE='export PATH="$HOME/.local/bin:$PATH"'

        for SHELL_CONFIG in "${SHELL_CONFIGS[@]}"; do
            if ! grep -v '^[[:space:]]*#' "$SHELL_CONFIG" 2>/dev/null | grep -qE 'PATH=.*\.local/bin'; then
                echo "" >> "$SHELL_CONFIG"
                echo "# Hebri Agent — ensure ~/.local/bin is on PATH" >> "$SHELL_CONFIG"
                echo "$PATH_LINE" >> "$SHELL_CONFIG"
                log_success "Added ~/.local/bin to PATH in $SHELL_CONFIG"
            fi
        done

        # fish uses fish_add_path instead of export PATH=...
        if [ "$IS_FISH" = "true" ]; then
            if ! grep -q 'fish_add_path.*\.local/bin' "$FISH_CONFIG" 2>/dev/null; then
                echo "" >> "$FISH_CONFIG"
                echo "# Hebri Agent — ensure ~/.local/bin is on PATH" >> "$FISH_CONFIG"
                echo 'fish_add_path "$HOME/.local/bin"' >> "$FISH_CONFIG"
                log_success "Added ~/.local/bin to PATH in $FISH_CONFIG"
            fi
        fi

        if [ "$IS_FISH" = "false" ] && [ ${#SHELL_CONFIGS[@]} -eq 0 ]; then
            log_warn "Could not detect shell config file to add ~/.local/bin to PATH"
            log_info "Add manually: $PATH_LINE"
        fi
    else
        log_info "~/.local/bin already on PATH"
    fi

    # Export for current session so hermes works immediately
    export PATH="$command_link_dir:$PATH"

    log_success "hebri command ready"
}

copy_config_templates() {
    log_info "Setting up configuration files..."

    # Create ~/.hermes directory structure (config at top level, code in subdir)
    mkdir -p "$HERMES_HOME"/{cron,sessions,logs,pairing,hooks,image_cache,audio_cache,memories,skills}

    # Create .env at ~/.hermes/.env (top level, easy to find)
    if [ ! -f "$HERMES_HOME/.env" ]; then
        if [ -f "$INSTALL_DIR/.env.example" ]; then
            cp "$INSTALL_DIR/.env.example" "$HERMES_HOME/.env"
            log_success "Created ~/.hermes/.env from template"
        else
            touch "$HERMES_HOME/.env"
            log_success "Created ~/.hermes/.env"
        fi
    else
        log_info "~/.hermes/.env already exists, keeping it"
    fi
    # Restrict .env permissions — this file holds API keys and tokens.
    # 0600 ensures only the file owner can read/write, matching standard
    # practice for credential files (.netrc, .aws/credentials, .ssh/config).
    chmod 600 "$HERMES_HOME/.env"
    configure_browser_env_from_system_browser

    # Create config.yaml at ~/.hermes/config.yaml (top level, easy to find)
    if [ ! -f "$HERMES_HOME/config.yaml" ]; then
        if [ -f "$INSTALL_DIR/cli-config.yaml.example" ]; then
            cp "$INSTALL_DIR/cli-config.yaml.example" "$HERMES_HOME/config.yaml"
            log_success "Created ~/.hermes/config.yaml from template"
        fi
    else
        log_info "~/.hermes/config.yaml already exists, keeping it"
    fi

    # Create SOUL.md if it doesn't exist (global persona file).
    # This MUST match DEFAULT_SOUL_MD in hermes_cli/default_soul.py — the
    # runtime (_ensure_default_soul_md) treats the old comment-only scaffold as
    # "never customized" and upgrades it to this text on next run, so any drift
    # here is self-healing, but keep them in sync to avoid a churn on first run.
    if [ ! -f "$HERMES_HOME/SOUL.md" ]; then
        cat > "$HERMES_HOME/SOUL.md" << 'SOUL_EOF'
You are Hebri, built by Synapsek Labs — a witness-gated agent that verifies code correctness. Be direct: match the length of your reply to the weight of the ask — a one-line question gets a one-line answer, and finished work gets a short report of what changed, what's verified, and what's left, never a replay of the process. No filler ("Great question," "I'd be happy to"), no restating the request back, no re-summarizing what you already said, no narrating tool calls the user can see. Plain claims over adjectives; when unsure, say so plainly. Agree because it's right, not because the user said it. Depth is earned — give it when the user asks for detail, teaches, or the stakes demand it, not by default.
SOUL_EOF
        log_success "Created ~/.hermes/SOUL.md (edit to customize personality)"
    fi

    log_success "Configuration directory ready: ~/.hermes/"

    # Seed bundled skills into ~/.hermes/skills/ (manifest-based, one-time per skill)
    if [ "$NO_SKILLS" = true ]; then
        # Blank-slate install: write the opt-out marker and skip seeding.
        # skills_sync.py and `hebri update` both honor this marker, so the
        # default profile stays empty across future updates too.
        printf '%s\n' \
            "This profile opted out of bundled-skill seeding (installed with --no-skills)." \
            "Delete this file to re-enable sync on the next 'hebri update'." \
            > "$HERMES_HOME/.no-bundled-skills" 2>/dev/null || true
        log_info "Skipping bundled skills (--no-skills). Wrote $HERMES_HOME/.no-bundled-skills"
        log_info "  Future 'hebri update' runs will not inject bundled skills. Delete the marker to opt back in."
    else
        log_info "Syncing bundled skills to ~/.hermes/skills/ ..."
        if "$INSTALL_DIR/venv/bin/python" "$INSTALL_DIR/tools/skills_sync.py" 2>/dev/null; then
            log_success "Skills synced to ~/.hermes/skills/"
        else
            # Fallback: simple directory copy if Python sync fails
            if [ -d "$INSTALL_DIR/skills" ] && [ ! "$(ls -A "$HERMES_HOME/skills/" 2>/dev/null | grep -v '.bundled_manifest')" ]; then
                cp -r "$INSTALL_DIR/skills/"* "$HERMES_HOME/skills/" 2>/dev/null || true
                log_success "Skills copied to ~/.hermes/skills/"
            fi
        fi
    fi
}

find_system_browser() {
    # Honor ONLY an explicit, user-set AGENT_BROWSER_EXECUTABLE_PATH override.
    #
    # We deliberately do NOT scan PATH or well-known app locations any more.
    # Auto-detection silently bound the install to whatever `command -v chromium`
    # resolved to — most damagingly a Snap Chromium (/snap/bin/chromium), whose
    # sandbox blocks agent-browser's control socket under /tmp, so every
    # browser_navigate hung until the 60s timeout fired ("opening web page
    # failed"). Every install now uses the bundled Playwright Chromium unless the
    # user explicitly points elsewhere.
    local override="${AGENT_BROWSER_EXECUTABLE_PATH:-}"

    if [ -z "$override" ]; then
        return 1
    fi

    # A Snap binary is never a valid target — its confinement is the very bug we
    # are fixing — so reject it even when set explicitly.
    case "$override" in
        /snap/*) return 1 ;;
    esac

    if [ -x "$override" ]; then
        echo "$override"
        return 0
    fi
    if command -v "$override" >/dev/null 2>&1; then
        command -v "$override"
        return 0
    fi

    return 1
}

strip_snap_browser_override() {
    # Existing installs created before the system-browser fallback was dropped
    # may carry an auto-written AGENT_BROWSER_EXECUTABLE_PATH pointing at a Snap
    # Chromium (/snap/bin/chromium). That path is the root cause of the "opening
    # web page failed" hang, and the runtime reads it straight from .env — so
    # removing the fallback in the installer is not enough on its own. Strip any
    # snap-pointing override here (and its auto-written comment) so the bundled
    # Chromium download runs and the agent stops using the broken binary. A
    # deliberately-set non-snap override is left untouched.
    local env_file="$HERMES_HOME/.env"

    [ -f "$env_file" ] || return 0
    grep -Eq '^AGENT_BROWSER_EXECUTABLE_PATH=/snap/' "$env_file" 2>/dev/null || return 0

    local tmp
    tmp="$(mktemp)" || return 0
    if grep -Ev '^AGENT_BROWSER_EXECUTABLE_PATH=/snap/|^# Hebri Agent browser tools' "$env_file" > "$tmp"; then
        mv "$tmp" "$env_file"
        log_warn "Removed stale Snap browser override (AGENT_BROWSER_EXECUTABLE_PATH=/snap/...) from $env_file"
        log_info "Hebri will use the bundled Chromium instead."
        # Drop it from this process too so the rest of the run doesn't re-detect it.
        unset AGENT_BROWSER_EXECUTABLE_PATH
    else
        rm -f "$tmp"
    fi
}

run_browser_install_with_timeout() {
    run_with_timeout "$@"
}

# Run a command with a hard wall-clock timeout, returning non-zero if it is
# killed. Prefers GNU coreutils `timeout` (Linux) or `gtimeout` (macOS via
# Homebrew) for an external-command target; otherwise (and always for a shell
# function target, which the `timeout` binary cannot exec) it uses a pure-shell
# watchdog: launch the command in its own process group, poll until it finishes,
# and SIGTERM (then SIGKILL) the whole group on timeout. The pure-shell path is
# what protects the bug-#39219 case — a stalled Electron download on macOS,
# where `timeout` is usually absent — turning an indefinite hang into a non-zero
# exit so callers (install_desktop) can self-heal via the mirror fallback.
#
# $1 (timeout) must be a bare integer number of seconds — the pure-shell loop
# compares it arithmetically (the `timeout` binary would also accept suffixes
# like 15m, but we normalize so both paths share one contract). On timeout the
# return code is 124, matching GNU `timeout`.
run_with_timeout() {
    local timeout_seconds="$1"
    shift

    # Normalize to a bare integer; fall back to the desktop default if a caller
    # ever passes a suffixed/empty value (the pure-shell loop needs an int).
    case "$timeout_seconds" in
        ''|*[!0-9]*) timeout_seconds=900 ;;
    esac

    # The `timeout` binary can only exec an external command, not a shell
    # function. Use it only when the target is NOT a function; functions always
    # go through the pure-shell watchdog (which runs them in a subshell of the
    # current shell and sees them directly — no fragile env export needed).
    if [ "$(type -t "$1" 2>/dev/null)" != "function" ]; then
        local timeout_bin=""
        if command -v timeout >/dev/null 2>&1; then
            timeout_bin="timeout"
        elif command -v gtimeout >/dev/null 2>&1; then
            timeout_bin="gtimeout"
        fi
        if [ -n "$timeout_bin" ]; then
            # GNU `timeout` runs the command in its own process group, so a
            # terminal Ctrl+C is delivered to `timeout` but never reaches the
            # child — the download looks frozen and ignores Ctrl+C (#35166).
            # `--foreground` keeps the command in the shell's foreground group
            # so Ctrl+C reaches it; `-k 10` sends SIGKILL 10s after the deadline
            # so a wedged download can't outlive the timeout. Both flags are
            # GNU-only — probe once and fall back to plain `timeout` on BusyBox
            # (Alpine). When neither binary exists (stock macOS) we drop to the
            # pure-shell watchdog below.
            if "$timeout_bin" --foreground -k 10 1 true >/dev/null 2>&1; then
                "$timeout_bin" --foreground -k 10 "$timeout_seconds" "$@"
            else
                "$timeout_bin" "$timeout_seconds" "$@"
            fi
            return $?
        fi
    fi

    # Pure-shell fallback: run in a new process group so we can kill the whole
    # subtree (npm spawns node + the Electron downloader as children).
    set -m
    ( "$@" ) &
    local cmd_pid=$!
    set +m

    local waited=0
    local rc
    while [ "$waited" -lt "$timeout_seconds" ]; do
        if ! kill -0 "$cmd_pid" 2>/dev/null; then
            # `|| rc=$?` keeps the non-zero child status without letting `set -e`
            # abort the caller here (this would fire if run_with_timeout were
            # ever called outside an if/|| context).
            rc=0; wait "$cmd_pid" 2>/dev/null || rc=$?
            return "$rc"
        fi
        sleep 1
        waited=$((waited + 1))
    done

    # Final boundary recheck: the command may have finished during the last
    # poll interval — don't kill (and mislabel as 124) a process that already
    # exited cleanly in the last second of the budget.
    if ! kill -0 "$cmd_pid" 2>/dev/null; then
        rc=0; wait "$cmd_pid" 2>/dev/null || rc=$?
        return "$rc"
    fi

    # Timed out: kill the process group (negative PID), escalate to KILL.
    kill -TERM "-$cmd_pid" 2>/dev/null || kill -TERM "$cmd_pid" 2>/dev/null || true
    sleep 2
    kill -KILL "-$cmd_pid" 2>/dev/null || kill -KILL "$cmd_pid" 2>/dev/null || true
    wait "$cmd_pid" 2>/dev/null || true
    return 124
}

# Return success only when the host is an apt release NEWER than the newest one
# Playwright's platform resolver recognizes — the exact condition that makes
# `playwright install` hang uninterruptibly (#35166). We scope the override
# retry to this case rather than retrying on *any* failure, so a genuine
# network/disk/permission failure doesn't get a mismatched-glibc build forced
# onto it. Newest Playwright-known apt releases as of this writing: Ubuntu
# 24.04, Debian 13. Anything above triggers the fallback; everything Playwright
# already handles (and every non-apt distro) does not.
playwright_host_unrecognized() {
    # Compare dotted versions: returns 0 if $1 > $2.
    _ver_gt() {
        [ "$1" = "$2" ] && return 1
        [ "$(printf '%s\n%s\n' "$1" "$2" | sort -V | tail -n1)" = "$1" ]
    }
    case "$DISTRO" in
        ubuntu) _ver_gt "${DISTRO_VERSION:-0}" "24.04" ;;
        debian) _ver_gt "${DISTRO_VERSION:-0}" "13" ;;
        *) return 1 ;;  # Non-apt or unknown — not the #35166 hang condition.
    esac
}

# Compute the PLAYWRIGHT_HOST_PLATFORM_OVERRIDE value to retry an install with
# when Playwright's platform resolver rejects the host. ubuntu24.04 is the
# newest Linux build Playwright has shipped across recent releases and runs on
# newer apt releases (its binaries are dynamically linked); we point too-new /
# unrecognized hosts at it. Only x64/arm64 Linux have Playwright builds — emit
# nothing for anything else so the caller skips the retry. Echoes the value
# (e.g. "ubuntu24.04-x64") or nothing.
playwright_fallback_platform() {
    case "$(uname -m)" in
        x86_64|amd64) echo "ubuntu24.04-x64" ;;
        aarch64|arm64) echo "ubuntu24.04-arm64" ;;
        *) : ;;  # No Playwright Linux build for this arch.
    esac
}

# Run a `playwright install ...` command, and if it fails or hangs (the
# uninterruptible "Installing Playwright Chromium with system dependencies"
# stall on apt releases Playwright doesn't recognize yet — Ubuntu 26.04,
# Debian 14, future distros — see #35166), retry it ONCE with
# PLAYWRIGHT_HOST_PLATFORM_OVERRIDE pinned to the newest known build.
#
# The override retry is scoped to the actual hang condition: it fires only when
# the host is an apt release NEWER than Playwright recognizes
# (playwright_host_unrecognized). On every release Playwright already supports
# (Ubuntu <=24.04, Debian <=13) and every non-apt distro, the first attempt is
# authoritative and a failure is reported as-is — we never force a
# mismatched-glibc build (microsoft/playwright#35114) onto a host Playwright
# handles correctly. This is deliberately narrower than a retry-on-any-failure:
# a network/disk/permission error on a supported host should surface, not get
# papered over with a platform override. Playwright's maintainers bless this
# env var as the supported escape hatch for unrecognized platforms
# (microsoft/playwright#33434); a hardcoded full distro/version table was
# rejected upstream (microsoft/playwright#33432), so we only need the
# newest-known floor here.
#
# An operator-provided PLAYWRIGHT_HOST_PLATFORM_OVERRIDE is always respected:
# it is inherited by the first attempt, and the retry is skipped.
#
# Usage: run_playwright_install <timeout_seconds> npx --no-install playwright install [args...]
run_playwright_install() {
    local timeout_seconds="$1"
    shift

    # First attempt: native platform resolution (inherits any operator override).
    if run_browser_install_with_timeout "$timeout_seconds" "$@" 2>/dev/null; then
        return 0
    fi

    # Operator already pinned the platform — their choice already applied to the
    # attempt above; a second identical run won't help.
    if [ -n "${PLAYWRIGHT_HOST_PLATFORM_OVERRIDE:-}" ]; then
        return 1
    fi

    # Only retry with an override on the apt releases too new for Playwright to
    # recognize (the #35166 hang). Any other failure is a real failure and is
    # surfaced unchanged.
    if ! playwright_host_unrecognized; then
        return 1
    fi

    local fallback
    fallback="$(playwright_fallback_platform)"
    if [ -z "$fallback" ]; then
        return 1  # No usable fallback build for this arch.
    fi

    log_warn "Playwright doesn't recognize ${DISTRO} ${DISTRO_VERSION} yet — retrying with PLAYWRIGHT_HOST_PLATFORM_OVERRIDE=$fallback"
    log_info "(apt releases newer than Playwright knows hang at this step; see #35166)"
    PLAYWRIGHT_HOST_PLATFORM_OVERRIDE="$fallback" \
        run_browser_install_with_timeout "$timeout_seconds" "$@"
}

configure_browser_env_from_system_browser() {
    local env_file="$HERMES_HOME/.env"
    local browser_path="${DETECTED_BROWSER_EXECUTABLE:-}"

    if [ -z "$browser_path" ]; then
        browser_path="$(find_system_browser 2>/dev/null || true)"
    fi

    if [ -z "$browser_path" ]; then
        return 0
    fi

    mkdir -p "$HERMES_HOME"
    if [ ! -f "$env_file" ]; then
        touch "$env_file"
    fi

    if grep -q '^AGENT_BROWSER_EXECUTABLE_PATH=' "$env_file" 2>/dev/null; then
        log_info "AGENT_BROWSER_EXECUTABLE_PATH already configured"
        return 0
    fi

    {
        echo ""
        echo "# Hebri Agent browser tools — explicit browser override."
        echo "AGENT_BROWSER_EXECUTABLE_PATH=$browser_path"
    } >> "$env_file"
    log_success "Configured browser tools to use $browser_path"
}

# Select the npm workspaces a CLI install actually needs, into the
# NODE_DEPS_WORKSPACE_ARGS array.
#
# A bare `npm install` at the repo root resolves package.json's `apps/*`
# glob, which materializes apps/desktop — and with it node-pty, which ships
# no Linux prebuild and falls back to `node-gyp rebuild`. On a host without
# make/gcc that rebuild fails, and since #85297 made a failed npm install
# fatal it aborts the whole install of a machine that will never launch
# Electron or a PTY addon (#38311, #38772). Desktop dependencies are
# installed by install_desktop(), reachable only via --include-desktop.
#
# Naming ui-tui/web excludes the unnamed apps/* workspaces, and
# --include-workspace-root keeps the root's own devDependencies (the shared
# ESLint flat config each workspace imports) from being pruned by the scoped
# install — the same closure `hebri update` installs
# (hermes_cli/main.py::_update_node_dependencies). Prebuilt/partial checkouts
# can lack a workspace, and naming a missing one makes npm fail hard, so fall
# back to a root-only install that still skips apps/*.
node_deps_workspace_args() {
    local install_dir="$1"
    NODE_DEPS_WORKSPACE_ARGS=()
    [ -f "$install_dir/ui-tui/package.json" ] && NODE_DEPS_WORKSPACE_ARGS+=(--workspace ui-tui)
    [ -f "$install_dir/web/package.json" ] && NODE_DEPS_WORKSPACE_ARGS+=(--workspace web)
    if [ "${#NODE_DEPS_WORKSPACE_ARGS[@]}" -eq 0 ]; then
        NODE_DEPS_WORKSPACE_ARGS=(--workspaces=false)
        return 0
    fi
    NODE_DEPS_WORKSPACE_ARGS+=(--include-workspace-root)
}

install_node_deps() {
    if [ "$HAS_NODE" = false ]; then
        log_info "Skipping Node.js dependencies (Node not installed)"
        return 0
    fi

    if [ "$DISTRO" = "termux" ]; then
        log_info "Skipping automatic Node/browser dependency setup on Termux"
        log_info "Browser automation is not part of the tested Termux install path yet."
        log_info "If you want to experiment manually later, run: cd $INSTALL_DIR && npm install"
        return 0
    fi

    if [ -f "$INSTALL_DIR/package.json" ]; then
        log_info "Installing Node.js dependencies (browser tools)..."
        cd "$INSTALL_DIR"
        # Time-boxed: a stalled registry fetch would otherwise hang here with no
        # progress (same #39219 stall class as the desktop build below).
        # A failed npm install used to still print "✓ Node.js dependencies
        # installed", hiding the degradation from the user (#77003). Now it
        # fails the install outright instead of burying the warning (#85297).
        # Capture npm output so failures are diagnosable (#87340).
        # Scoped to the workspaces a CLI install needs so apps/desktop's
        # node-pty is never built here — see node_deps_workspace_args().
        node_deps_workspace_args "$INSTALL_DIR"
        local npm_log
        npm_log="$(mktemp)"
        if ! run_with_timeout "$NODE_DEPS_TIMEOUT" npm ci "${NODE_DEPS_WORKSPACE_ARGS[@]}" --no-fund --no-audit \
                >"$npm_log" 2>&1; then
            log_error "npm install failed or timed out; Node.js dependencies were not installed"
            if [ -s "$npm_log" ]; then
                log_error "npm output:"
                cat "$npm_log" >&2
            fi
            rm -f "$npm_log"
            restore_dirty_lockfiles "$INSTALL_DIR"
            return 1
        fi
        rm -f "$npm_log"
        log_success "Node.js dependencies installed"

        # Install Playwright browser + system dependencies.
        # Playwright's --with-deps only supports apt-based systems natively.
        # For Arch/Manjaro we install the system libs via pacman first.
        # Other systems must install Chromium dependencies manually.
        if [ "$SKIP_BROWSER" = true ]; then
            log_info "Skipping Playwright/Chromium install (--skip-browser)"
            log_info "Browser tools will be unavailable until you run manually:"
            log_info "  cd $INSTALL_DIR && npx --no-install playwright install chromium"
            log_info "On apt-based systems, an admin also needs to run:"
            log_info "  sudo npx --no-install playwright install-deps chromium"
        else
        log_info "Installing browser engine (Playwright Chromium)..."
        strip_snap_browser_override
        DETECTED_BROWSER_EXECUTABLE="$(find_system_browser 2>/dev/null || true)"
        if [ -n "$DETECTED_BROWSER_EXECUTABLE" ]; then
            log_success "Using explicit browser override: $DETECTED_BROWSER_EXECUTABLE"
            log_info "Skipping bundled Chromium download (AGENT_BROWSER_EXECUTABLE_PATH is set)."
        else
            case "$DISTRO" in
                ubuntu|debian|raspbian|pop|linuxmint|elementary|zorin|kali|parrot)
                    # Use --with-deps only when sudo is available non-interactively
                    # (root, or a user with passwordless sudo). Non-sudo users
                    # — typical for systemd service accounts and unprivileged
                    # operator users — would otherwise get blocked on an
                    # interactive sudo prompt that they can't satisfy. Fall back
                    # to the browser-only install in that case, and print the
                    # exact command the admin needs to run separately.
                    if [ "$(id -u)" -eq 0 ] || (command -v sudo >/dev/null 2>&1 && sudo -n true 2>/dev/null); then
                        log_info "Installing Playwright Chromium with system dependencies..."
                        cd "$INSTALL_DIR" && run_playwright_install 600 npx --no-install playwright install --with-deps chromium || {
                            log_warn "Playwright browser installation failed — browser tools will not work."
                            log_warn "Try running manually: cd $INSTALL_DIR && npx --no-install playwright install --with-deps chromium"
                        }
                    else
                        log_warn "No sudo available — skipping system-library install (--with-deps)."
                        log_info "Ask an administrator to run, one time, as root:"
                        log_info "  sudo npx --no-install playwright install-deps chromium"
                        log_info "  (from $INSTALL_DIR, after Node.js deps are installed)"
                        log_info "Installing Chromium binary into this user's Playwright cache..."
                        cd "$INSTALL_DIR" && run_playwright_install 600 npx --no-install playwright install chromium || {
                            log_warn "Playwright browser installation failed — browser tools will not work."
                            log_warn "Try running manually: cd $INSTALL_DIR && npx --no-install playwright install chromium"
                        }
                    fi
                    ;;
                arch|manjaro|cachyos|endeavouros|garuda)
                    if command -v pacman &> /dev/null; then
                        log_info "Arch-family distro detected — installing Chromium system dependencies via pacman..."
                        if command -v sudo &> /dev/null && sudo -n true 2>/dev/null; then
                            sudo NEEDRESTART_MODE=a pacman -S --noconfirm --needed \
                                nss atk at-spi2-core cups libdrm libxkbcommon mesa pango cairo alsa-lib >/dev/null 2>&1 || true
                        elif [ "$(id -u)" -eq 0 ]; then
                            pacman -S --noconfirm --needed \
                                nss atk at-spi2-core cups libdrm libxkbcommon mesa pango cairo alsa-lib >/dev/null 2>&1 || true
                        else
                            log_warn "Cannot install browser deps without sudo. Run manually:"
                            log_warn "  sudo pacman -S nss atk at-spi2-core cups libdrm libxkbcommon mesa pango cairo alsa-lib"
                        fi
                    fi
                    cd "$INSTALL_DIR" && run_playwright_install 600 npx --no-install playwright install chromium || {
                        log_warn "Playwright browser installation failed — browser tools will not work."
                    }
                    ;;
                fedora|rhel|centos|rocky|alma)
                    log_warn "Playwright does not support automatic dependency installation on RPM-based systems."
                    log_info "Install Chromium system dependencies manually before using browser tools:"
                    log_info "  sudo dnf install nss atk at-spi2-core cups-libs libdrm libxkbcommon mesa-libgbm pango cairo alsa-lib"
                    cd "$INSTALL_DIR" && run_playwright_install 600 npx --no-install playwright install chromium || {
                        log_warn "Playwright browser installation failed — install dependencies above and retry."
                    }
                    ;;
                opensuse*|sles)
                    log_warn "Playwright does not support automatic dependency installation on zypper-based systems."
                    log_info "Install Chromium system dependencies manually before using browser tools:"
                    log_info "  sudo zypper install mozilla-nss libatk-1_0-0 at-spi2-core cups-libs libdrm2 libxkbcommon0 Mesa-libgbm1 pango cairo libasound2"
                    cd "$INSTALL_DIR" && run_playwright_install 600 npx --no-install playwright install chromium || {
                        log_warn "Playwright browser installation failed — install dependencies above and retry."
                    }
                    ;;
                *)
                    log_warn "Playwright does not support automatic dependency installation on $DISTRO."
                    log_info "Install Chromium/browser system dependencies for your distribution, then run:"
                    log_info "  cd $INSTALL_DIR && npx --no-install playwright install chromium"
                    log_info "Browser tools will not work until dependencies are installed."
                    cd "$INSTALL_DIR" && run_playwright_install 600 npx --no-install playwright install chromium || true
                    ;;
            esac
        fi
        fi
        log_success "Browser engine setup complete"
    fi

    # The scoped root npm ci already installs the TUI and web workspaces.

    # Keep the checkout clean so `hebri update` doesn't autostash every run.
    restore_dirty_lockfiles "$INSTALL_DIR"
}



run_setup_wizard() {
    if [ "$RUN_SETUP" = false ]; then
        log_info "Skipping setup wizard (--skip-setup)"
        return 0
    fi

    # The setup wizard reads from /dev/tty, so it works even when the
    # install script itself is piped (curl | bash). Only skip if no
    # terminal is available at all (e.g. Docker build, CI).
    #
    # Probe by actually opening /dev/tty: a bare existence test passes
    # in Docker builds where the device node is in the mount namespace
    # but opening fails with ENXIO, so the wizard would proceed and
    # then crash on `< /dev/tty` below.
    if ! (: </dev/tty) 2>/dev/null; then
        log_info "Setup wizard skipped (no terminal available). Run 'hebri setup' after install."
        return 0
    fi

    echo ""
    log_info "Starting setup wizard..."
    echo ""

    cd "$INSTALL_DIR"

    # Run hebri setup using the venv Python directly (no activation needed).
    # Redirect stdin from /dev/tty so interactive prompts work when piped from curl.
    if [ "$USE_VENV" = true ]; then
        "$INSTALL_DIR/venv/bin/python" -m hermes_cli.main setup < /dev/tty
    else
        python -m hermes_cli.main setup < /dev/tty
    fi
}

maybe_start_gateway() {
    # Check if any messaging platform tokens were configured
    ENV_FILE="$HERMES_HOME/.env"
    if [ ! -f "$ENV_FILE" ]; then
        return 0
    fi

    HAS_MESSAGING=false
    for VAR in TELEGRAM_BOT_TOKEN DISCORD_BOT_TOKEN SLACK_BOT_TOKEN SLACK_APP_TOKEN WHATSAPP_ENABLED; do
        VAL=$(grep "^${VAR}=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2-)
        if [ -n "$VAL" ] && [ "$VAL" != "your-token-here" ]; then
            HAS_MESSAGING=true
            break
        fi
    done

    if [ "$HAS_MESSAGING" = false ]; then
        return 0
    fi

    echo ""
    log_info "Messaging platform token detected!"
    log_info "The gateway needs to be running for Hebri to send/receive messages."

    # If WhatsApp is enabled and no session exists yet, run foreground first for QR scan
    WHATSAPP_VAL=$(grep "^WHATSAPP_ENABLED=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2-)
    WHATSAPP_SESSION="$HERMES_HOME/whatsapp/session/creds.json"
    if [ "$WHATSAPP_VAL" = "true" ] && [ ! -f "$WHATSAPP_SESSION" ]; then
        if [ "$IS_INTERACTIVE" = true ]; then
            echo ""
            log_info "WhatsApp is enabled but not yet paired."
            log_info "Running 'hebri whatsapp' to pair via QR code..."
            echo ""
            if prompt_yes_no "Pair WhatsApp now?" "yes"; then
                HERMES_CMD="$(get_hermes_command_path)"
                $HERMES_CMD whatsapp || true
            fi
        else
            log_info "WhatsApp pairing skipped (non-interactive). Run 'hebri whatsapp' to pair."
        fi
    fi

    # Probe by actually opening /dev/tty: a bare existence test passes
    # in Docker builds where the device node is in the mount namespace
    # but opening fails with ENXIO. See #16746.
    if ! (: </dev/tty) 2>/dev/null; then
        log_info "Gateway setup skipped (no terminal available). Run 'hebri gateway install' later."
        return 0
    fi

    echo ""
    local should_install_gateway=false
    if [ "$DISTRO" = "termux" ]; then
        if prompt_yes_no "Would you like to start the gateway in the background?" "yes"; then
            should_install_gateway=true
        fi
    else
        if prompt_yes_no "Would you like to install the gateway as a background service?" "yes"; then
            should_install_gateway=true
        fi
    fi

    if [ "$should_install_gateway" = true ]; then
        HERMES_CMD="$(get_hermes_command_path)"

        if [ "$DISTRO" != "termux" ] && command -v systemctl &> /dev/null; then
            log_info "Installing systemd service..."
            if $HERMES_CMD gateway install 2>/dev/null; then
                log_success "Gateway service installed"
                if $HERMES_CMD gateway start 2>/dev/null; then
                    log_success "Gateway started! Your bot is now online."
                else
                    log_warn "Service installed but failed to start. Try: hebri gateway start"
                fi
            else
                log_warn "Systemd install failed. You can start manually: hebri gateway"
            fi
        else
            if [ "$DISTRO" = "termux" ]; then
                log_info "Termux detected — starting gateway in best-effort background mode..."
            else
                log_info "systemd not available — starting gateway in background..."
            fi
            nohup $HERMES_CMD gateway > "$HERMES_HOME/logs/gateway.log" 2>&1 &
            GATEWAY_PID=$!
            log_success "Gateway started (PID $GATEWAY_PID). Logs: ~/.hermes/logs/gateway.log"
            log_info "To stop: kill $GATEWAY_PID"
            log_info "To restart later: hebri gateway"
            if [ "$DISTRO" = "termux" ]; then
                log_warn "Android may stop background processes when Termux is suspended or the system reclaims resources."
            fi
        fi
    else
        log_info "Skipped. Start the gateway later with: hebri gateway"
    fi
}

write_bootstrap_marker() {
    # Writes $INSTALL_DIR/.hermes-bootstrap-complete, which tells the Hermes
    # desktop app (apps/desktop/electron/main.ts) and the macOS launcher fast
    # path (apps/bootstrap-installer) "a real install finished here -- don't
    # re-run first-run bootstrap."
    #
    # Schema mirrors install.ps1's Write-BootstrapMarker and main.ts's
    # writeBootstrapMarker(). Keep the three in lockstep:
    #   schemaVersion 1 + pinnedCommit (length >= 7) are what the desktop
    #   validator requires; desktopVersion is omitted because only the desktop
    #   app knows its own version.
    if [ ! -d "$INSTALL_DIR" ]; then
        log_warn "Skipping bootstrap marker: $INSTALL_DIR doesn't exist"
        return 0
    fi

    # Explicit --commit wins; otherwise read HEAD from the checkout we just
    # installed. If neither resolves, skip the marker entirely rather than
    # write one the desktop will reject -- an absent marker is a clean
    # "bootstrap needed", a malformed one is a confusing half-state.
    local pinned_commit="$INSTALL_COMMIT"
    if [ -z "$pinned_commit" ]; then
        pinned_commit=$(git -C "$INSTALL_DIR" rev-parse HEAD 2>/dev/null) || pinned_commit=""
    fi

    if [ -z "$pinned_commit" ]; then
        log_warn "Skipping bootstrap marker: could not resolve HEAD in $INSTALL_DIR"
        return 0
    fi

    local marker_path="$INSTALL_DIR/.hermes-bootstrap-complete"
    local tmp_path="$marker_path.tmp"

    # Atomic publish: the macOS launcher predicate only checks existence, so a
    # torn write would arm the fast path against a half-written marker.
    printf '{\n  "schemaVersion": 1,\n  "pinnedCommit": "%s",\n  "pinnedBranch": "%s",\n  "completedAt": "%s"\n}\n' \
        "$pinned_commit" \
        "$BRANCH" \
        "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)" > "$tmp_path"
    mv -f "$tmp_path" "$marker_path"
}

print_success() {
    echo ""
    echo -e "${GREEN}${BOLD}"
    echo "┌─────────────────────────────────────────────────────────┐"
    echo "│              ✓ Installation Complete!                   │"
    echo "└─────────────────────────────────────────────────────────┘"
    echo -e "${NC}"
    echo ""

    # Show file locations
    echo -e "${CYAN}${BOLD}📁 Your files:${NC}"
    echo ""
    echo -e "   ${YELLOW}Config:${NC}    $HERMES_HOME/config.yaml"
    echo -e "   ${YELLOW}API Keys:${NC}  $HERMES_HOME/.env"
    echo -e "   ${YELLOW}Data:${NC}      $HERMES_HOME/cron/, sessions/, logs/"
    echo -e "   ${YELLOW}Code:${NC}      $INSTALL_DIR"
    echo ""

    echo -e "${CYAN}─────────────────────────────────────────────────────────${NC}"
    echo ""
    echo -e "${CYAN}${BOLD}🚀 Commands:${NC}"
    echo ""
    echo -e "   ${GREEN}hermes${NC}              Start chatting"
    echo -e "   ${GREEN}hebri setup${NC}        Configure API keys & settings"
    echo -e "   ${GREEN}hebri config${NC}       View/edit configuration"
    echo -e "   ${GREEN}hebri config edit${NC}  Open config in editor"
    echo -e "   ${GREEN}hebri gateway install${NC} Install gateway service (messaging + cron)"
    echo -e "   ${GREEN}hebri update${NC}       Update to latest version"
    echo ""

    echo -e "${CYAN}─────────────────────────────────────────────────────────${NC}"
    echo ""
    if [ "$DISTRO" = "termux" ]; then
        echo -e "${YELLOW}⚡ 'hebri' was linked into $(get_command_link_display_dir), which is already on PATH in Termux.${NC}"
        echo ""
    elif [ "$ROOT_FHS_LAYOUT" = true ]; then
        echo -e "${YELLOW}⚡ 'hebri' was linked into /usr/local/bin and is ready to use — no shell reload needed.${NC}"
        echo ""
    else
        echo -e "${YELLOW}⚡ Reload your shell to use 'hebri' command:${NC}"
        echo ""
        LOGIN_SHELL="$(basename "${SHELL:-/bin/bash}")"
        if [ "$LOGIN_SHELL" = "zsh" ]; then
            echo "   source ~/.zshrc"
        elif [ "$LOGIN_SHELL" = "bash" ]; then
            echo "   source ~/.bashrc"
        elif [ "$LOGIN_SHELL" = "fish" ]; then
            echo "   source ~/.config/fish/config.fish"
        else
            echo "   source ~/.bashrc   # or ~/.zshrc"
        fi
        echo ""
    fi

    # Show Node.js warning if auto-install failed
    if [ "$HAS_NODE" = false ]; then
        echo -e "${YELLOW}"
        echo "Note: Node.js could not be installed automatically."
        echo "Browser tools need Node.js. Install manually:"
        if [ "$DISTRO" = "termux" ]; then
            echo "  pkg install nodejs"
        else
            echo "  https://nodejs.org/en/download/"
        fi
        echo -e "${NC}"
    fi

    # Show ripgrep note if not installed
    if [ "$HAS_RIPGREP" = false ]; then
        echo -e "${YELLOW}"
        echo "Note: ripgrep (rg) was not found. File search will use"
        echo "grep as a fallback. For faster search in large codebases,"
        if [ "$DISTRO" = "termux" ]; then
            echo "install ripgrep: pkg install ripgrep"
        else
            echo "install ripgrep: sudo apt install ripgrep (or brew install ripgrep)"
        fi
        echo -e "${NC}"
    fi
}

ensure_browser() {
    if ! command -v node >/dev/null 2>&1; then
        local node_bin="$HERMES_HOME/node/bin/node"
        if [ -x "$node_bin" ]; then
            export PATH="$HERMES_HOME/node/bin:$PATH"
        else
            log_error "Node.js not found. Run with --ensure node first."
            return 1
        fi
    fi

    local npm_bin
    npm_bin="$(command -v npm 2>/dev/null || echo "$HERMES_HOME/node/bin/npm")"
    if [ ! -x "$npm_bin" ]; then
        log_error "npm not found"
        return 1
    fi

    # agent-browser itself is intentionally NOT installed here (#43564 /
    # PR #44772 review): it resolves lazily via `npx agent-browser` instead,
    # which every consumer (tools/browser_tool.py, `hebri update`'s npx
    # cache warm) already goes through. Eagerly npm-installing a second,
    # separately version-pinned copy here -- only reachable via this
    # explicit --ensure browser fallback in the first place -- was redundant
    # complexity and an extra credential/supply-chain surface for a path
    # npx already covers.
    log_info "Installing camofox browser server..."
    local log_file
    log_file="$(mktemp)"
    # Time-boxed (#39219): a stalled npm registry fetch here would otherwise
    # hang the installer with no progress, same class as the desktop build.
    if ! run_with_timeout "$NODE_DEPS_TIMEOUT" "$npm_bin" install -g --prefix "$HERMES_HOME/node" --silent --ignore-scripts \
        "@askjo/camofox-browser@^1.5.2" \
        >"$log_file" 2>&1; then
        log_error "npm install failed or timed out:"
        cat "$log_file" >&2
        rm -f "$log_file"
        return 1
    fi
    rm -f "$log_file"
    export PATH="$HERMES_HOME/node/bin:$PATH"

    strip_snap_browser_override
    local sys_browser
    sys_browser="$(find_system_browser 2>/dev/null || true)"
    if [ -n "$sys_browser" ]; then
        configure_browser_env_from_system_browser "$sys_browser"
        log_info "Explicit browser override set -- Chromium download will be skipped when agent-browser installs on demand"
    fi

    return 0
}

ensure_mode() {
    detect_os

    IFS=',' read -ra DEPS <<< "$ENSURE_DEPS"
    for dep in "${DEPS[@]}"; do
        dep="$(echo "$dep" | tr -d '[:space:]')"
        case "$dep" in
            node)
                check_node
                ;;
            browser)
                check_node
                if [ "$HAS_NODE" = true ]; then
                    ensure_browser
                fi
                ;;
            ripgrep)
                if ! command -v rg &>/dev/null; then
                    HAS_RIPGREP=false
                    HAS_FFMPEG=true
                    install_system_packages
                fi
                ;;
            ffmpeg)
                if ! command -v ffmpeg &>/dev/null; then
                    HAS_FFMPEG=false
                    HAS_RIPGREP=true
                    install_system_packages
                fi
                ;;
            *)
                log_warn "Unknown dependency: $dep"
                ;;
        esac
    done
}


# Clear the cached Electron download + any half-written unpacked output so the
# next `npm run pack` re-downloads and re-stages from scratch. A corrupt zip in
# the per-user Electron download cache - most often a partial/resumed download
# that leaves concatenated junk - makes electron-builder's `unpack-electron`
# extract a tree MISSING the electron binary, so the `electron`->`Hermes` rename
# dies with ENOENT and every re-run repeats the broken extraction forever. This
# is the bash sibling of install.ps1's Clear-ElectronBuildCache and the Python
# _purge_electron_build_cache() used by `hebri desktop`; install.sh was the only
# build path lacking it. Echoes the removed paths (one per line); best-effort.
clear_electron_build_cache() {
    local desktop_dir="$1"
    local removed=""

    # Per-user Electron download cache dirs, honoring the overrides @electron/get
    # respects, then the platform defaults (macOS: ~/Library/Caches/electron,
    # Linux: $XDG_CACHE_HOME/electron or ~/.cache/electron).
    local cache_dirs=()
    [ -n "${electron_config_cache:-}" ] && cache_dirs+=("$electron_config_cache")
    [ -n "${ELECTRON_CACHE:-}" ] && cache_dirs+=("$ELECTRON_CACHE")
    if [ "$OS" = "macos" ]; then
        cache_dirs+=("$HOME/Library/Caches/electron")
    else
        [ -n "${XDG_CACHE_HOME:-}" ] && cache_dirs+=("$XDG_CACHE_HOME/electron")
        cache_dirs+=("$HOME/.cache/electron")
    fi

    local dir zip
    for dir in "${cache_dirs[@]}"; do
        [ -d "$dir" ] || continue
        # Recurse: the bad copy may be the top-level zip OR a copy inside an
        # @electron/get hash subdir.
        while IFS= read -r zip; do
            [ -n "$zip" ] || continue
            if rm -f "$zip" 2>/dev/null; then
                removed="$removed$zip
"
            fi
        done <<EOF
$(find "$dir" -type f -name 'electron-*.zip' 2>/dev/null)
EOF
    done

    # A half-written unpacked dir from an interrupted prior pack poisons the
    # rename even after the zip is fixed (mac-arm64-unpacked / linux-unpacked).
    local release_dir="$desktop_dir/release"
    if [ -d "$release_dir" ]; then
        local unpacked
        while IFS= read -r unpacked; do
            [ -n "$unpacked" ] || continue
            if rm -rf "$unpacked" 2>/dev/null; then
                removed="$removed$unpacked
"
            fi
        done <<EOF
$(find "$release_dir" -maxdepth 1 -type d -name '*-unpacked' 2>/dev/null)
EOF
    fi

    printf '%s' "$removed"
}

# Run the desktop pack in $1 (the apps/desktop dir). `npm run pack` = tsc +
# vite build + electron-builder --dir, producing an unpacked app for the
# current OS. Signing auto-discovery is disabled so electron-builder falls back
# to an ad-hoc signature instead of grabbing an unrelated Developer ID from the
# keychain (a real signed/notarized .dmg needs Apple credentials — a separate
# release concern). Optional $2 = an ELECTRON_MIRROR base URL for this attempt,
# used as a fallback when the default GitHub release download is blocked.
_desktop_pack() {
    local desktop_dir="$1"
    local mirror="${2:-}"
    if [ -n "$mirror" ]; then
        ( cd "$desktop_dir" && ELECTRON_MIRROR="$mirror" CSC_IDENTITY_AUTO_DISCOVERY=false npm run pack )
    else
        ( cd "$desktop_dir" && CSC_IDENTITY_AUTO_DISCOVERY=false npm run pack )
    fi
}

# Last-resort Electron mirror after GitHub download fails (#47266).
DESKTOP_ELECTRON_FALLBACK_MIRROR="https://npmmirror.com/mirrors/electron/"

# Per-attempt wall-clock cap for the desktop npm install / electron-builder pack
# (#39219). A stalled (not failed) Electron download on a throttled/blocked link
# never returns, so without this the installer hangs forever on "Build desktop
# app". 900s is generous enough for a slow-but-progressing ~150MB fetch + build;
# override with DESKTOP_BUILD_TIMEOUT for very slow links.
DESKTOP_BUILD_TIMEOUT="${DESKTOP_BUILD_TIMEOUT:-900}"

# Wall-clock cap for the plain registry `npm install`s (browser-tools + TUI
# deps). Same #39219 stall class but no ~150MB Electron binary, so a shorter
# default; override with NODE_DEPS_TIMEOUT for very slow links.
NODE_DEPS_TIMEOUT="${NODE_DEPS_TIMEOUT:-600}"

# Electron package dir — workspace-local nest first, then root hoist.
_electron_dir() {
    local install_dir="$1"
    if [ -d "$install_dir/apps/desktop/node_modules/electron" ]; then
        printf '%s\n' "$install_dir/apps/desktop/node_modules/electron"
    else
        printf '%s\n' "$install_dir/node_modules/electron"
    fi
}

# True when dist/ holds a usable Electron binary (#38673 / run-electron-builder.mjs).
_electron_dist_ok() {
    local install_dir="$1"
    local electron_dir
    electron_dir="$(_electron_dir "$install_dir")"
    if [ "$OS" = "macos" ]; then
        [ -e "$electron_dir/dist/Electron.app/Contents/MacOS/Electron" ]
    else
        [ -e "$electron_dir/dist/electron" ]
    fi
}

# Best-effort: run electron/install.js to populate dist/ (optional mirror).
_restore_electron_dist() {
    local install_dir="$1"
    local mirror="${2:-}"
    local electron_dir
    electron_dir="$(_electron_dir "$install_dir")"
    _electron_dist_ok "$install_dir" && return 0

    [ -f "$electron_dir/install.js" ] || return 1
    command -v node >/dev/null 2>&1 || return 1

    rm -rf "$electron_dir/dist" 2>/dev/null || true
    rm -f "$electron_dir/path.txt" 2>/dev/null || true

    if [ -n "$mirror" ]; then
        ( cd "$electron_dir" && ELECTRON_MIRROR="$mirror" node install.js ) || true
    else
        ( cd "$electron_dir" && node install.js ) || true
    fi
    _electron_dist_ok "$install_dir"
}

_electron_pkg_staged_missing_dist() {
    local install_dir="$1"
    local electron_dir
    electron_dir="$(_electron_dir "$install_dir")"
    [ -f "$electron_dir/package.json" ] && [ -f "$electron_dir/install.js" ] && ! _electron_dist_ok "$install_dir"
}

_restore_electron_dist_with_fallback() {
    local install_dir="$1"
    _restore_electron_dist "$install_dir" \
        || { [ -z "${ELECTRON_MIRROR:-}" ] && _restore_electron_dist "$install_dir" "$DESKTOP_ELECTRON_FALLBACK_MIRROR"; }
}

# Build apps/desktop into a launchable native app. Mirrors install.ps1's
# Install-Desktop: a root-level npm install so the apps/* workspace resolves
# the desktop's own deps (Electron ~150MB), then `npm run pack`
# (electron-builder --dir) which emits an unpacked app for the current OS. Only invoked
# via the 'desktop' stage / --include-desktop, which the Electron app's own
# first-launch bootstrap never requests (it must not rebuild itself).
install_desktop_voice_deps() {
    # Desktop ships with working voice out of the box: eagerly install the
    # wake-word + local-STT stacks ([wake] + [voice] extras) instead of
    # leaving them to lazy first-use install. Policy change (Teknium, July
    # 2026, #70509 testing): the first ear-click used to trigger a
    # multi-minute onnxruntime pip install that froze the UI and blew RPC
    # timeouts. Lazy install remains the fallback for CLI-only installs and
    # for anything this best-effort step fails to fetch.
    local _prev_venv="${VIRTUAL_ENV:-}"
    if [ "$USE_VENV" = true ]; then
        export VIRTUAL_ENV="$INSTALL_DIR/venv"
    fi
    if [ -z "${UV_CMD:-}" ]; then
        install_uv || true
    fi
    if [ -z "${UV_CMD:-}" ]; then
        log_warn "uv unavailable — voice/wake deps will lazy-install at first use instead"
        return 0
    fi
    log_info "Installing voice + wake-word dependencies (onnxruntime, faster-whisper — 1-3min)..."
    if (cd "$INSTALL_DIR" && source "$INSTALL_DIR/scripts/lib/install-dependencies.sh" && run_locked_uv_sync "$INSTALL_DIR/venv" --extra wake --extra voice --inexact) ; then
        log_success "Voice + wake-word dependencies installed"
    else
        log_warn "Voice/wake dependency install failed — they will lazy-install at first use"
    fi
    if [ "$USE_VENV" = true ] && [ -z "$_prev_venv" ]; then
        unset VIRTUAL_ENV
    fi
    return 0
}

install_desktop() {
    local desktop_dir="$INSTALL_DIR/apps/desktop"

    # The desktop stage only runs when a build is explicitly requested
    # (--include-desktop / 'desktop' stage), so a missing toolchain is a hard
    # failure, not a silent skip — a silent skip yields a "complete" install
    # with no app and a confusing "couldn't find a built desktop" at launch.
    # Always re-resolve Node here. Stages run in separate processes, so we can't
    # trust an earlier check; more importantly check_node now enforces the
    # supported Node lines and prepends the Hermes-managed Node to PATH, so
    # the build never runs on a too-old system Node — the cause of the opaque
    # "Build desktop app … exit code 1" failure (Vite crashes on old Node).
    check_node
    if ! command -v npm >/dev/null 2>&1; then
        log_error "Cannot build desktop app: Node.js / npm unavailable"
        log_info "Install Node.js and retry: cd $desktop_dir && npm run pack"
        return 1
    fi
    if [ ! -f "$desktop_dir/package.json" ]; then
        log_warn "Skipping desktop build (apps/desktop not present in checkout)"
        return 0
    fi

    # 1. Root workspace install so apps/desktop's deps (Electron, Vite,
    #    node-pty prebuilds) resolve. The browser-tools install runs in the
    #    repo-root package workspace, which does not pull apps/* deps.
    #
    #    Prefer `npm ci`: it deletes node_modules and reinstalls from the
    #    lockfile, so it always produces a complete tree. Bare `npm install`
    #    can report "up to date" against a stale node_modules/.package-lock.json
    #    marker while node_modules is actually empty (Windows workspace-hoisting
    #    flake) — leaving tsc/typescript unresolved and `npm run pack`'s
    #    `tsc -b` failing with no obvious cause. A stale lock must fail the
    #    install so the user can retry a corrected release.
    #
    #    Both the install and the build below are wrapped in a hard wall-clock
    #    timeout (#39219): the Electron binary (~150MB) is fetched from GitHub,
    #    and on a throttled/blocked connection that download can *stall* — npm
    #    neither errors nor exits, so the installer sits on "Build desktop app"
    #    forever with only `npm warn deprecated` lines visible. A stall now
    #    converts to a non-zero exit, which feeds the existing self-heal /
    #    mirror-fallback escalation instead of hanging the whole install.
    #
    log_info "Installing desktop workspace dependencies (includes Electron ~150MB, 1-3min)..."
    if run_with_timeout "$DESKTOP_BUILD_TIMEOUT" bash -c 'cd "$1" && npm ci --include=optional && node apps/desktop/scripts/ensure-rolldown-binding.mjs' _ "$INSTALL_DIR"; then
        log_success "Desktop workspace dependencies installed"
    else
        log_error "Desktop workspace npm install failed"
        # Common cause: a previous 'sudo npm'/'sudo npx' left root-owned files in
        # ~/.npm, so this non-root install can't write the shared cache. npm hides
        # it behind a confusing EEXIST / "File exists" message while the real errno
        # is EACCES (-13). Point the user at the fix instead of a raw npm trace.
        log_info "If the errors above mention EACCES / 'permission denied' / EEXIST while"
        log_info "writing the npm cache, your ~/.npm likely holds root-owned files from an"
        log_info "earlier 'sudo npm' or 'sudo npx'. Reclaim ownership and retry:"
        log_info "  sudo chown -R \"\$(id -un)\" ~/.npm && npm cache verify"
        log_info "Then re-run this installer, or build manually:"
        log_info "  cd \"$INSTALL_DIR\" && npm ci && cd apps/desktop && npm run pack"
        return 1
    fi

    # 2. Build, with up to three escalating attempts so a transient/blocked
    #    Electron download self-heals instead of failing the whole install:
    #      a) plain `npm run pack` (downloads Electron from GitHub),
    #      b) on failure, purge a corrupt cached zip + stale unpacked dir and
    #         retry (matches install.ps1 / `hebri desktop`),
    #      c) on still-failing, fall back to a public Electron mirror — this is
    #         the GitHub-blocked/throttled case (the repeating "retrying" log).
    log_info "Building desktop app (this takes 1-3 minutes)..."
    local pack_ok=false
    if run_with_timeout "$DESKTOP_BUILD_TIMEOUT" _desktop_pack "$desktop_dir"; then
        pack_ok=true
    else
        local purged=""
        local restored=false
        if ! _electron_dist_ok "$INSTALL_DIR"; then
            purged="$(clear_electron_build_cache "$desktop_dir")"
            if _restore_electron_dist "$INSTALL_DIR"; then restored=true; fi
        fi
        if [ "$restored" = true ]; then
            log_warn "Desktop build failed; refreshed the Electron download and retrying once..."
            if run_with_timeout "$DESKTOP_BUILD_TIMEOUT" _desktop_pack "$desktop_dir"; then
                pack_ok=true
            fi
        fi
    fi

    # (c) GitHub blocked → mirror fallback (#47266).
    if [ "$pack_ok" = false ] && [ -z "${ELECTRON_MIRROR:-}" ] && ! _electron_dist_ok "$INSTALL_DIR"; then
        log_warn "Desktop build still failing — the Electron download from GitHub looks blocked."
        log_warn "Re-downloading Electron via a public mirror ($DESKTOP_ELECTRON_FALLBACK_MIRROR), then rebuilding..."
        log_warn "  (set ELECTRON_MIRROR yourself to use a different/trusted mirror)"
        _electron_dist_ok "$INSTALL_DIR" || _restore_electron_dist "$INSTALL_DIR" "$DESKTOP_ELECTRON_FALLBACK_MIRROR" || true
        if run_with_timeout "$DESKTOP_BUILD_TIMEOUT" _desktop_pack "$desktop_dir" "$DESKTOP_ELECTRON_FALLBACK_MIRROR"; then
            pack_ok=true
        fi
    fi

    if [ "$pack_ok" = false ]; then
        log_error "Desktop app build failed"
        # If the log shows repeated "retrying" lines fetching the Electron zip,
        # the binary download is blocked/throttled (firewall, proxy, region) and
        # the mirror fallback above also couldn't reach a host. Try a mirror you
        # trust and rebuild (@electron/get honors ELECTRON_MIRROR):
        if ! _electron_dist_ok "$INSTALL_DIR"; then
            log_info "If the log shows Electron download retries, rebuild via a reachable mirror:"
            log_info "  ELECTRON_MIRROR=<mirror-base-url> \\"
            log_info "    bash -c 'cd \"$desktop_dir\" && CSC_IDENTITY_AUTO_DISCOVERY=false npm run pack'"
        fi
        log_info "Otherwise build manually: cd $desktop_dir && npm run pack"
        return 1
    fi

    local app=""
    if [ "$OS" = "linux" ]; then
        if [ -x "$desktop_dir/release/linux-unpacked/Hebri" ]; then
            app="$desktop_dir/release/linux-unpacked/Hebri"
        elif [ -x "$desktop_dir/release/linux-unpacked/hermes" ]; then
            app="$desktop_dir/release/linux-unpacked/hermes"
        fi
    else
        local cand
        for cand in \
            "$desktop_dir/release/mac-arm64/Hebri.app" \
            "$desktop_dir/release/mac/Hebri.app"; do
            if [ -d "$cand" ]; then
                app="$cand"
                break
            fi
        done
    fi
    if [ -z "$app" ]; then
        log_error "Desktop build completed but no app was found under $desktop_dir/release/"
        return 1
    fi
    log_success "Desktop app built: $app"

    # Linux: Electron's chrome-sandbox helper needs root:root 4755 or the
    # sandboxed renderer will abort on startup.  Check the file is a regular
    # file (not a symlink) before chown/chmod so we don't follow an
    # attacker-controlled link to an arbitrary path.
    if [ "$OS" = "linux" ]; then
        local sandbox="$desktop_dir/release/linux-unpacked/chrome-sandbox"
        if [ -f "$sandbox" ] && [ ! -L "$sandbox" ]; then
            if [ "$(id -u)" -eq 0 ]; then
                chown root:root "$sandbox" && chmod 4755 "$sandbox" || {
                    log_error "Cannot configure Electron sandbox helper: $sandbox"
                    return 1
                }
            elif command -v sudo >/dev/null 2>&1; then
                sudo chown root:root "$sandbox" && sudo chmod 4755 "$sandbox" || {
                    log_error "Cannot configure Electron sandbox helper (sudo failed): $sandbox"
                    return 1
                }
            else
                log_error "Cannot configure Electron sandbox helper without sudo: $sandbox"
                return 1
            fi
        fi
    fi

    # macOS: route through the same config-aware signing fixup as
    # `hebri desktop`, so install/repair and self-update agree about the app's
    # identity. The fixup preserves the Electron entitlement plists and signs
    # with a stable Designated Requirement (configured keychain identity, else
    # identifier-pinned ad-hoc), so macOS TCC grants — Full Disk Access,
    # Desktop/Downloads/Documents, Accessibility, microphone — survive the
    # rebuild instead of resetting on every update. The shell's
    # publisher-signing decision governed the build and is passed explicitly so
    # importing Python cannot reverse it by loading HERMES_HOME/.env. If the
    # helper is unavailable or fails, branch into the historical quarantine
    # strip + deep ad-hoc repair so a broken venv never leaves the bundle
    # unsigned/unlaunchable.
    if [ "$OS" = "macos" ] && [ -z "${CSC_LINK:-}" ] && [ -z "${APPLE_SIGNING_IDENTITY:-}" ] && command -v codesign >/dev/null 2>&1; then
        local config_python="$INSTALL_DIR/venv/bin/python"
        local fixup_ok=""
        if [ -x "$config_python" ]; then
            if HERMES_HOME="$HERMES_HOME" "$config_python" - "$desktop_dir" <<'PYEOF'
import sys
from pathlib import Path
from hermes_cli.main import _desktop_macos_relaunchable_fixup
ok = _desktop_macos_relaunchable_fixup(
    Path(sys.argv[1]), publisher_signing_configured=False
)
sys.exit(0 if ok else 1)
PYEOF
            then
                fixup_ok=1
            else
                log_warn "Config-aware macOS signing fixup failed; applying the historical ad-hoc fallback."
            fi
        fi
        if [ -z "$fixup_ok" ]; then
            xattr -cr "$app" 2>/dev/null || true
            codesign --force --deep --sign - "$app" >/dev/null 2>&1 || true
        fi
    fi

    # `npm install` + `npm run pack` rewrite lockfiles; restore them so the
    # checkout stays clean for the next `hebri update`.
    restore_dirty_lockfiles "$INSTALL_DIR"
}

# Each --stage runs in its own process, so (unlike the monolithic main() where
# clone_repo cd's once and later steps inherit it) a stage that operates on the
# checkout must cd into it explicitly. Without this, install_deps/setup_path run
# from the desktop app's cwd and resolve `.` / the venv against the wrong tree.
require_install_dir() {
    if [ -z "$INSTALL_DIR" ] || [ ! -d "$INSTALL_DIR" ]; then
        log_error "Install directory not found: ${INSTALL_DIR:-<unset>}"
        log_info "The 'repository' stage must run before this one."
        return 1
    fi
    cd "$INSTALL_DIR"
}

# Desktop bootstrap stage protocol. Mirrors the Windows install.ps1 surface
# closely enough for the Electron bootstrap runner to show structured progress.
run_stage_body() {
    local stage="$1"

    case "$stage" in
        prerequisites)
            print_banner
            detect_os
            resolve_install_layout
            install_uv
            check_python
            check_git
            check_node
            check_cxx_compiler
            check_network_prerequisites
            install_system_packages
            ;;
        repository)
            detect_os
            resolve_install_layout
            check_git
            clone_repo
            ;;
        venv)
            detect_os
            resolve_install_layout
            require_install_dir
            install_uv
            check_python
            setup_venv
            ;;
        python-deps)
            detect_os
            resolve_install_layout
            require_install_dir
            install_uv
            check_python
            install_deps
            ;;
        node-deps)
            detect_os
            resolve_install_layout
            require_install_dir
            check_node
            install_node_deps || return
            install_uv
            log_info "Optional Browser Use and Computer Use are installed when enabled via hebri tools."
            ;;
        path)
            detect_os
            resolve_install_layout
            require_install_dir
            setup_path
            ;;
        config)
            detect_os
            resolve_install_layout
            require_install_dir
            copy_config_templates
            ;;
        setup)
            detect_os
            resolve_install_layout
            require_install_dir
            run_setup_wizard
            ;;
        gateway)
            detect_os
            resolve_install_layout
            require_install_dir
            maybe_start_gateway
            ;;
        desktop)
            detect_os
            resolve_install_layout
            require_install_dir
            # Each stage runs in its own process, so the Hermes-managed Node
            # provisioned during prerequisites/node-deps (at $HERMES_HOME/node/bin)
            # isn't on PATH here. check_node re-adds it (or installs if missing)
            # so install_desktop can find npm instead of silently skipping.
            check_node
            install_desktop_voice_deps
            install_desktop
            ;;
        complete)
            detect_os
            resolve_install_layout
            print_success
            write_bootstrap_marker
            # Code-scoped stamp: write next to the install tree, not into
            # $HERMES_HOME. $HERMES_HOME is a shared data dir (it can be
            # bind-mounted into a Docker gateway too), so a stamp there gets
            # clobbered by the container's 'docker' stamp and wrongly blocks
            # 'hebri update' on this host install. See detect_install_method().
            echo "git" > "$INSTALL_DIR/.install_method"
            ;;
        *)
            log_error "Unknown stage: $stage"
            return 2
            ;;
    esac
}

run_stage_protocol() {
    local stage="$1"
    if [ -z "$stage" ]; then
        log_error "--stage requires a stage name"
        if [ "$JSON_OUTPUT" = true ]; then
            emit_stage_json "" false false "missing stage name"
        fi
        return 2
    fi

    if [ "$NON_INTERACTIVE" = true ] && stage_needs_user_input "$stage"; then
        log_info "Skipping $stage (non-interactive bootstrap)"
        if [ "$JSON_OUTPUT" = true ]; then
            emit_stage_json "$stage" true true
        fi
        return 0
    fi

    # Run the stage body in a subshell so a stage helper that calls `exit 1`
    # on failure (clone_repo, install_deps, etc. were written for the monolithic
    # flow) only exits the subshell — the parent still reaches the JSON result
    # frame below. Without this, a failed --stage would terminate the process
    # before emitting the frame and the Rust/Electron parser would see "no
    # result frame" instead of a clean {ok:false} contract response.
    set +e
    ( run_stage_body "$stage" )
    local code=$?
    set -e

    if [ "$JSON_OUTPUT" = true ]; then
        if [ "$code" -eq 0 ]; then
            emit_stage_json "$stage" true false
        else
            emit_stage_json "$stage" false false "exit code $code"
        fi
    fi
    return "$code"
}

# ============================================================================
# Main
# ============================================================================

main() {
    print_banner

    detect_os
    resolve_install_layout
    install_uv
    check_python
    check_git
    check_node
    check_cxx_compiler
    check_network_prerequisites
    install_system_packages

    clone_repo
    setup_venv
    install_deps
    install_node_deps || return
    log_info "Optional Browser Use and Computer Use are installed when enabled via hebri tools."
    setup_path
    copy_config_templates
    run_setup_wizard
    maybe_start_gateway

    if [ "$INCLUDE_DESKTOP" = true ]; then
        install_desktop_voice_deps
        install_desktop
    fi

    print_success

    write_bootstrap_marker

    # Code-scoped stamp: write next to the install tree, not into $HERMES_HOME.
    # $HERMES_HOME is a shared data dir (it can be bind-mounted into a Docker
    # gateway too), so a stamp there gets clobbered by the container's 'docker'
    # stamp and wrongly blocks 'hebri update' on this host install.
    # See detect_install_method().
    echo "git" > "$INSTALL_DIR/.install_method"
}

if [ "$MANIFEST_MODE" = true ]; then
    emit_manifest
elif [ -n "$STAGE_NAME" ]; then
    run_stage_protocol "$STAGE_NAME"
elif [ -n "$ENSURE_DEPS" ]; then
    ensure_mode
else
    main
fi
