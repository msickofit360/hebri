"""Real two-home identity checks for Lab; no provider calls or production state."""
import json
import os
import subprocess
import sys

import pytest


@pytest.mark.parametrize('launch', ['alpha', 'beta'])
def test_profile_identity_survives_a_b_a_with_separate_memory_and_sessions(tmp_path, launch):
    homes = {name: tmp_path / name for name in ('alpha', 'beta')}
    for name, home in homes.items():
        home.mkdir()
        (home / 'SOUL.md').write_text(f'I am the {name} test agent.', encoding='utf-8')
        (home / '.env').write_text(f'LAB_IDENTITY_CANARY={name}\n', encoding='utf-8')
        (home / 'config.yaml').write_text(
            json.dumps({'model': {'default': f'test-{name}'},
                        'terminal': {'backend': 'local', 'cwd': str(home)}}), encoding='utf-8')
    code = r'''
import json, os
from pathlib import Path
from agent.secret_scope import get_secret, set_multiplex_active
from agent.prompt_builder import load_soul_md
from hermes_constants import get_hermes_home
from tools.memory_tool import load_on_disk_store
from tui_gateway import server

homes = {name: Path(value) for name, value in json.loads(os.environ['LAB_TEST_HOMES']).items()}
launch = os.environ['LAB_TEST_LAUNCH']
other = next(name for name in homes if name != launch)
set_multiplex_active(True)
baseline = dict(os.environ)
for name in (launch, other, launch):
    home = homes[name]
    session = {'profile_home': None if name == launch else str(home)}
    with server._session_profile_runtime_scope(session):
        assert get_hermes_home().resolve() == home.resolve()
        assert get_secret('LAB_IDENTITY_CANARY') == name
        soul = load_soul_md()
        assert f'the {name} test agent' in soul
        assert f'the {other if name == launch else launch} test agent' not in soul
        store = load_on_disk_store()
        assert all(name in entry for entry in store.memory_entries + store.user_entries)
        if not store.memory_entries:
            assert store.add('memory', f'{name} keeps its own notes')['success']
            assert store.add('user', f'{name} user preference')['success']
        db = server._open_profile_session_db(str(home))
        try:
            if db.get_session('same-durable-id') is None:
                db.create_session('same-durable-id', 'desktop')
                assert db.set_session_title('same-durable-id', 'Bot Chat')
                db.append_message('same-durable-id', 'user', f'private conversation for {name}')
            messages = db.get_messages('same-durable-id')
            assert [m['content'] for m in messages] == [f'private conversation for {name}']
            assert db.get_session('same-durable-id')['title'] == 'Bot Chat'
        finally:
            db.close()
    assert dict(os.environ) == baseline
for name, home in homes.items():
    assert name in (home / 'memories/MEMORY.md').read_text()
    assert name in (home / 'memories/USER.md').read_text()
assert (homes[launch] / 'state.db').resolve() != (homes[other] / 'state.db').resolve()
print('separate persona, secrets, memory, user notes and session history verified')
'''
    env = {**os.environ, 'HERMES_HOME': str(homes[launch]), 'HEBRI_HOME': str(homes[launch]),
           'LAB_TEST_LAUNCH': launch, 'LAB_TEST_HOMES': json.dumps({k: str(v) for k, v in homes.items()}),
           'HERMES_SHARED_AUTH_DIR': str(tmp_path / 'shared')}
    result = subprocess.run([sys.executable, '-c', code], env=env, capture_output=True, text=True, timeout=60)
    assert result.returncode == 0, result.stdout + result.stderr
    # The gateway reserves stdout for RPC frames and redirects diagnostics.
    assert 'verified' in result.stdout + result.stderr
