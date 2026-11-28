"""Exercise the file-tools boundary against a disposable imitation of the installation."""

import json
import os
from unittest.mock import Mock

import pytest

from agent import file_safety
from tools import file_tools
from tools.environments.local import LocalEnvironment
from tools.file_operations import ShellFileOperations
from tools.registry import registry


@pytest.fixture
def layout(tmp_path, monkeypatch):
    runtime = tmp_path / "distribution" / "runtime"
    runtime.mkdir(parents=True)
    (runtime / "routes.py").write_text("untouched")
    project = tmp_path / "project"
    project.mkdir()
    monkeypatch.setattr(file_safety, "_RUNTIME_ROOT", runtime)
    env = Mock(spec=LocalEnvironment)
    env.cwd = str(project)
    env.execute.side_effect = AssertionError("a denied operation reached the shell")
    return runtime, project, ShellFileOperations(env)


def test_registry_refuses_core_even_when_cross_profile_is_requested(layout, monkeypatch):
    runtime, _, ops = layout
    monkeypatch.setattr(file_tools, "_get_file_ops", lambda _task: ops)
    monkeypatch.setattr("tools.file_tools_write_guards._terminal_env_type_for_task", lambda _task: "local")
    monkeypatch.setattr(file_tools, "_check_approval_required_write", lambda *_: pytest.fail("approval requested"))
    for name, args in [
        ("write_file", {"path": str(runtime / "routes.py"), "content": "changed"}),
        ("patch", {"path": str(runtime / "routes.py"), "old_string": "untouched", "new_string": "changed"}),
    ]:
        result = registry.dispatch(name, dict(args, cross_profile=True), task_id="core-policy-test")
        assert "protected" in json.loads(result)["error"]
    assert (runtime / "routes.py").read_text() == "untouched"


def test_all_local_mutators_and_ancestor_move_are_denied(layout):
    runtime, project, ops = layout
    existing = str(runtime / "routes.py")
    new = os.path.relpath(runtime / "new" / "module.py", project)
    for result in (
        ops.write_file(new, "new"),
        ops.patch_replace(existing, "untouched", "changed"),
        ops.delete_file(existing),
        ops.move_file(existing, str(project / "moved")),
        ops.move_file(str(project / "moved"), existing),
        ops.move_file(str(runtime.parent), str(project / "other")),
    ):
        assert "protected" in result.error
    ops.env.execute.assert_not_called()


def test_mixed_patch_is_denied_before_earlier_project_operation(layout):
    runtime, project, ops = layout
    patch = f"*** Begin Patch\n*** Add File: okay.txt\n+ordinary\n*** Delete File: {runtime / 'routes.py'}\n*** End Patch"
    assert "protected" in ops.patch_v4a(patch).error
    assert not (project / "okay.txt").exists()
    ops.env.execute.assert_not_called()


def test_hardlink_is_denied_and_sibling_with_same_prefix_remains_editable(layout):
    runtime, project, ops = layout
    alias = project / "linked-file"
    os.link(runtime / "routes.py", alias)
    assert "linked file" in ops.write_file(str(alias), "changed").error
    assert (runtime / "routes.py").read_text() == "untouched"
    sibling = runtime.with_name("runtime-notes")
    sibling.mkdir()
    assert file_safety.local_core_write_error(str(sibling / "new.txt")) is None
    assert file_safety.local_core_write_error(str(project), moving_tree=True) is None


def test_new_target_under_directory_alias_is_denied(layout):
    runtime, project, ops = layout
    alias = project / "alias"
    if os.name == "nt":
        # NTFS junctions require no developer-mode/symlink privilege.
        import _winapi
        _winapi.CreateJunction(str(runtime), str(alias))
    else:
        alias.symlink_to(runtime, target_is_directory=True)
    assert "protected" in ops.write_file(str(alias / "new.py"), "changed").error
    assert not (runtime / "new.py").exists()


def test_remote_namespace_does_not_stat_an_equally_named_host_path(layout, monkeypatch):
    runtime, _, _ = layout
    monkeypatch.setattr("tools.file_operations.local_core_write_error", lambda *_a, **_kw: pytest.fail("host stat"))
    remote = ShellFileOperations(Mock(cwd="/workspace"))
    target = str(runtime / "routes.py")
    assert remote._mutation_path(target) == target
    assert remote._core_mutation_error(target) is None


def test_ordinary_project_write_and_replace_use_the_local_backend(tmp_path, monkeypatch):
    project = tmp_path / "editable-project"
    project.mkdir()
    home = tmp_path / "isolated-profile"
    home.mkdir()
    monkeypatch.setenv("HERMES_HOME", str(home))
    env = LocalEnvironment(cwd=str(project))
    try:
        ops = ShellFileOperations(env)
        write = ops.write_file("notes.txt", "first")
        assert write.error is None, write.error
        edit = ops.patch_replace("notes.txt", "first", "second")
        assert edit.error is None, edit.error
        assert (project / "notes.txt").read_text() == "second"
    finally:
        env.cleanup()
