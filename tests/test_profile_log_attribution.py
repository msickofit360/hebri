"""Unbound multiplex work must never become the launch Bit's log entry."""
import logging
from pathlib import Path

def test_routed_logs_follow_bound_profile_and_quarantine_unknown(tmp_path, monkeypatch):
    import hermes_logging as logs
    from hermes_constants import set_hermes_home_override, reset_hermes_home_override
    from agent import secret_scope
    a, b = tmp_path / "a", tmp_path / "b"
    for home in (a, b):
        home.mkdir()
        (home / "config.yaml").write_text("{}")
    monkeypatch.setenv("HERMES_HOME", str(a))
    monkeypatch.setattr(secret_scope, "_MULTIPLEX_ACTIVE", True)
    base = logs._new_file_handler(a / "logs" / "agent.log", level=logging.INFO,
        max_bytes=10240, backup_count=1, formatter=logging.Formatter("%(message)s"))
    router = logs._ProfileRoutingFileHandler(base, [a, b])
    base.close()
    logger = logging.getLogger("profile-attribution-test")
    try:
        for home, message in ((a, "owned-a-first"), (b, "owned-b"), (a, "owned-a-again")):
            token = set_hermes_home_override(str(home))
            try:
                record = logger.makeRecord(logger.name, logging.INFO, __file__, 0, message, (), None)
            finally:
                reset_hermes_home_override(token)
            router.emit(record)  # Queue listener runs after the producer scope is gone.
        token = set_hermes_home_override(None)
        try:
            unbound = logger.makeRecord(logger.name, logging.INFO, __file__, 0, "private-unbound", (), None)
        finally:
            reset_hermes_home_override(token)
        router.emit(unbound)
        foreign = logging.LogRecord("foreign", logging.INFO, __file__, 0, "private-foreign", (), None)
        foreign.hermes_home = str(tmp_path / "unknown")
        router.emit(foreign)
        assert router.unrouted_count == 2
    finally:
        router.close()
    assert (a / "logs" / "agent.log").read_text().splitlines() == ["owned-a-first", "owned-a-again"]
    assert (b / "logs" / "agent.log").read_text().splitlines() == ["owned-b"]
    diagnostic = (a / "logs" / "unrouted-agent.log").read_text()
    assert "bind a profile scope" in diagnostic and "private-" not in diagnostic
    assert not (tmp_path / "unknown").exists()
