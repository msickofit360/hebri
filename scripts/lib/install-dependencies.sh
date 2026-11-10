#!/usr/bin/env bash
# Python dependency provisioning, loaded after source installation.
run_locked_uv_sync() {
    # Bootstrap uv calls stay isolated from ambient config via UV_NO_CONFIG
    # (#21269). A locked project sync is different: uv.lock records resolver
    # settings from this checkout's [tool.uv], so hiding pyproject.toml makes
    # uv 0.12+ reject the valid lock. Re-enable project discovery only for
    # this subprocess while redirecting user/system config lookups to an empty
    # directory. Keep HOME unchanged so caches, credentials, and git continue
    # to work normally.
    local project_env="$1"
    shift
    local isolated_uv_config
    local sync_rc
    isolated_uv_config="$(mktemp -d)" || return 1

    (
        unset UV_NO_CONFIG UV_CONFIG_FILE
        export XDG_CONFIG_HOME="$isolated_uv_config"
        export XDG_CONFIG_DIRS="$isolated_uv_config"
        UV_PROJECT_ENVIRONMENT="$project_env" run_with_timeout 600 "$UV_CMD" sync --extra all --no-dev --locked "$@"
    )
    sync_rc=$?
    rmdir "$isolated_uv_config" 2>/dev/null || true
    return "$sync_rc"
}

hebri_install_deps() {
    log_info "Installing dependencies..."

    # Re-pin UV_PYTHON to the venv interpreter. setup_venv already does this,
    # but the bootstrap runs install stages (`venv`, `python-deps`) as separate
    # processes, so an export from setup_venv does NOT survive into a separate
    # python-deps invocation. Re-deriving it here covers that path. Without it,
    # an inherited UV_PYTHON=3.14 makes the locked sync below recreate the
    # venv at 3.14 and fail the maturin source build (no cp314 wheels yet).
    if [ "$DISTRO" != "termux" ] && [ -x "$INSTALL_DIR/venv/bin/python" ]; then
        export UV_PYTHON="$INSTALL_DIR/venv/bin/python"
    fi

    if [ "$DISTRO" = "termux" ]; then
        if [ "$USE_VENV" = true ]; then
            export VIRTUAL_ENV="$INSTALL_DIR/venv"
            PIP_PYTHON="$INSTALL_DIR/venv/bin/python"
        else
            PIP_PYTHON="$PYTHON_PATH"
        fi

        if [ -z "${ANDROID_API_LEVEL:-}" ]; then
            ANDROID_API_LEVEL="$(getprop ro.build.version.sdk 2>/dev/null || true)"
            if [ -z "$ANDROID_API_LEVEL" ]; then
                ANDROID_API_LEVEL=24
            fi
            export ANDROID_API_LEVEL
            log_info "Using ANDROID_API_LEVEL=$ANDROID_API_LEVEL for Android wheel builds"
        fi

        "$PIP_PYTHON" -m pip install --upgrade pip setuptools wheel >/dev/null

        # On Android, psutil's setup.py rejects sys.platform == 'android' before
        # it ever invokes the C build, so the next pip install would fail at
        # "platform android is not supported".  Prebuild psutil from the official
        # sdist with a one-line marker patch (Linux source path is fine on
        # Android).  Stopgap until psutil#2762 ships upstream.
        if "$PIP_PYTHON" -c 'import sys; raise SystemExit(0 if sys.platform == "android" else 1)' 2>/dev/null; then
            log_info "Android Python detected: prebuilding psutil compatibility shim..."
            if ! "$PIP_PYTHON" "$INSTALL_DIR/scripts/install_psutil_android.py" --pip "$PIP_PYTHON -m pip"; then
                log_warn "psutil Android prebuild failed — package install will likely fail next."
                log_info "Workaround: manually rerun 'python scripts/install_psutil_android.py' once your toolchain is set up."
            fi
        fi

        # Try the broad Termux profile first (best-effort "install all" for Android),
        # then fall back to the conservative Termux baseline, then base package.
        if ! "$PIP_PYTHON" -m pip install -e '.[termux-all]' -c constraints-termux.txt; then
            log_warn "Termux broad profile (.[termux-all]) failed, trying baseline Termux profile..."
            if ! "$PIP_PYTHON" -m pip install -e '.[termux]' -c constraints-termux.txt; then
                log_warn "Termux baseline profile (.[termux]) failed, trying base install..."
                if ! "$PIP_PYTHON" -m pip install -e '.' -c constraints-termux.txt; then
                    log_error "Package installation failed on Termux."
                    log_info "Ensure these packages are installed: pkg install clang rust make pkg-config libffi openssl ca-certificates curl"
                    log_info "Then re-run: cd $INSTALL_DIR && python -m pip install -e '.[termux-all]' -c constraints-termux.txt"
                    exit 1
                fi
            fi
        fi

        log_success "Main package installed"
        log_info "Termux note: matrix e2ee and local faster-whisper extras are excluded from .[termux-all] due to upstream Android wheel/toolchain blockers."
        log_info "Termux note: browser/WhatsApp tooling is not installed by default; see the Termux guide for optional follow-up steps."

        log_success "All dependencies installed"
        return 0
    fi

    if [ "$USE_VENV" = true ]; then
        # Tell uv to install into our venv (no need to activate)
        export VIRTUAL_ENV="$INSTALL_DIR/venv"
    fi

    # Require the reviewed lock, including artifact hashes and project policy.
    # A failed or stale lock is an installation error, never a reason to resolve
    # a different dependency set on the user's machine.
    if [ -f "uv.lock" ]; then
        log_info "Installing verified dependencies (uv.lock) ..."
        log_info "(this resolves + downloads the curated [all] set — first run on a"
        log_info " fresh venv can take 1-5 minutes; uv prints progress below)"
        # Stream uv's progress directly to the user instead of swallowing
        # it with `2>"$(mktemp)"`.  Two reasons:
        #   1. `--extra all --locked` against a fresh venv has to pull
        #      every transitive — silencing stderr makes the install
        #      look frozen for minutes on slow networks. Users see
        #      "Trying tier: hash-verified ..." and assume it's hung.
        #   2. The previous `2>"$(mktemp)"` substituted the path at
        #      command-build time but never saved it, so on failure the
        #      uv error message was unreachable — the user just got the
        #      generic "lockfile may be stale" warning.
        #
        # Critical flag choice: `--extra all`, NOT `--all-extras`.
        #   --all-extras = every [project.optional-dependencies] key.
        #                  This bypasses the curated `[all]` extra
        #                  entirely and pulls e.g. [matrix] (which
        #                  needs python-olm + make on Windows) and
        #                  [rl] (git+https deps that fail offline).
        #   --extra all  = install just the `[all]` extra's contents.
        #                  This respects the curation in pyproject.toml.
        # uv's own progress UI handles TTY detection and downgrades
        # gracefully when stdout/stderr aren't terminals.
        #
        # Run the Tier-0 locked sync via run_locked_uv_sync: the global
        # UV_NO_CONFIG export at script start (the #21269 sudo -u hygiene
        # guard) also hides the project's own [tool.uv] policy —
        # exclude-newer, its package exemptions, and override-dependencies —
        # from uv. The resolver then runs under a different policy than the
        # one uv.lock was resolved under, and --locked turns that mismatch
        # fatal, so every fresh install fell through to the non-hash-verified
        # PyPI tiers. The helper re-enables project config discovery for this
        # one subprocess while keeping ambient user/system uv config hidden
        # (redirected to an empty XDG dir), preserving the #21269 guarantee.
        # Runtime code does the same before its locked syncs
        # (hermes_cli/managed_uv.py).
        if run_locked_uv_sync "$INSTALL_DIR/venv"; then
            log_success "Main package installed (hash-verified via uv.lock)"
            log_success "All dependencies installed"
            return 0
        fi
        log_error "Verified Python installation failed. Check the uv output and retry; the dependency lock was preserved."
        return 1
    fi
    log_error "The release is missing uv.lock. Re-download Hebri before retrying."
    return 1
}
