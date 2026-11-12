"""Exercise bundled KEEL through Hebri's real loader, hooks and profile boundary."""
import json
from pathlib import Path

import pytest

from hermes_constants import set_hermes_home_override, reset_hermes_home_override
from plugins.memory import load_memory_provider
from agent.memory_manager import MemoryManager
from tools.memory_tool import MemoryStore


@pytest.fixture
def homes(tmp_path, monkeypatch):
    homes = [tmp_path / 'alpha', tmp_path / 'beta']
    for home in homes:
        home.mkdir()
        (home / 'config.yaml').write_text('memory: {provider: keelindex}\n', encoding='utf-8')
    monkeypatch.setenv('HERMES_HOME', str(homes[0]))
    monkeypatch.setenv('HEBRI_HOME', str(homes[0]))
    monkeypatch.setattr(Path, 'home', lambda: tmp_path)
    return homes


def test_bundled_loader_restart_and_profile_isolation(homes):
    prompts = []
    for home, value in [(homes[0], 'emerald'), (homes[1], 'violet'), (homes[0], None)]:
        token = set_hermes_home_override(home)
        manager = MemoryManager()
        try:
            provider = load_memory_provider('keelindex', register_skills=False)
            assert provider is not None
            manager.add_provider(provider)
            manager.initialize_all('same-session', agent_context='primary')
            before = manager.build_system_prompt()
            if value:
                result = json.loads(manager.handle_tool_call('keel_index_memory', {
                    'action': 'save', 'id': 'launch', 'key': 'launch colour',
                    'body': f'Launch colour is {value}', 'source': 'user'}))
                assert result['stored'] == 'launch'
            records = json.loads(manager.handle_tool_call('keel_index_memory', {
                'action': 'recall', 'query': 'launch colour'}))['records']
            assert [r['body'] for r in records] == [
                'Launch colour is ' + ('emerald' if home == homes[0] else 'violet')]
            assert manager.build_system_prompt() == before
            prompts.append(before)
            provider.initialize('child', agent_context='subagent')
            with pytest.raises(ValueError, match='primary'):
                provider.learn('forbidden', 'key', 'body', source='child')
        finally:
            manager.shutdown_all()
            reset_hermes_home_override(token)
    assert len(set(prompts)) == 1


def test_committed_memory_corrections_and_removals_retire_recall(homes):
    token = set_hermes_home_override(homes[0])
    manager = MemoryManager()
    try:
        provider = load_memory_provider('keelindex', register_skills=False)
        manager.add_provider(provider)
        manager.initialize_all('lifecycle', agent_context='primary')
        memory = MemoryStore()
        memory.load_from_disk()
        old, new = 'Launch colour is emerald', 'Launch colour is violet'
        manager.notify_memory_tool_write(memory.add('memory', old),
                                         {'action': 'add', 'content': old})
        assert [r['body'] for r in provider.store.entries()] == [old]
        manager.notify_memory_tool_write({'success': True, 'staged': True},
                                         {'action': 'remove', 'old_text': old})
        assert [r['body'] for r in provider.store.entries()] == [old]
        manager.notify_memory_tool_write(memory.replace('memory', old, new),
                                         {'action': 'replace', 'old_text': 'emerald', 'content': new})
        assert [r['body'] for r in provider.store.entries()] == [new]
        manager.notify_memory_tool_write(memory.remove('memory', new),
                                         {'action': 'remove', 'old_text': 'violet'})
        assert provider.store.entries() == []
        assert provider.store.knn('launch colour', threshold=0.01) == []
    finally:
        manager.shutdown_all()
        reset_hermes_home_override(token)
