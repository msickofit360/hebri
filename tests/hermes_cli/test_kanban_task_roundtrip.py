"""Persisted tasks must remain readable through both board read paths."""
import json

import pytest

from hermes_cli import kanban_db as db
from hermes_cli.kanban_db_connect import connect


@pytest.mark.parametrize("labels,due", [(None, None), (["release", "客户"], "2026-12-01T09:00:00Z")])
def test_create_get_list_and_reopen_preserve_task(tmp_path, monkeypatch, labels, due):
    monkeypatch.setenv("HERMES_HOME", str(tmp_path))
    path = tmp_path / "kanban.db"
    conn = connect(path)
    try:
        task_id = db.create_task(conn, title="Prepare release", workspace_kind="scratch",
                                 idempotency_key="release", skills=["review"])
        conn.execute("UPDATE tasks SET labels = ?, due_at = ? WHERE id = ?",
                     (json.dumps(labels) if labels is not None else None, due, task_id))
        conn.commit()
        task = db.get_task(conn, task_id)
        assert task.labels == labels
        assert task.due_at == due
        assert task.skills == ["review"]
        assert db.list_tasks(conn) == [task]
        assert db.create_task(conn, title="Prepare release", workspace_kind="scratch",
                              idempotency_key="release") == task_id
    finally:
        conn.close()
    with connect(path) as reopened:
        assert db.get_task(reopened, task_id) == task
        assert db.list_tasks(reopened) == [task]


def test_old_rows_and_invalid_optional_json_remain_readable(tmp_path, monkeypatch):
    monkeypatch.setenv("HERMES_HOME", str(tmp_path))
    with connect(tmp_path / "kanban.db") as conn:
        task_id = db.create_task(conn, title="Legacy task", workspace_kind="scratch")
        # A pre-migration query has none of the later optional columns.
        row = conn.execute("""SELECT id, title, body, assignee, status, priority, created_by,
            created_at, started_at, completed_at, workspace_kind, workspace_path,
            claim_lock, claim_expires FROM tasks WHERE id = ?""", (task_id,)).fetchone()
        old = db.Task.from_row(row)
        assert old.labels is None and old.due_at is None
        conn.execute("UPDATE tasks SET labels = ?, skills = ? WHERE id = ?", ("broken-json", "{", task_id))
        task = db.get_task(conn, task_id)
        assert task.labels is None and task.skills is None
        assert db.list_tasks(conn) == [task]
