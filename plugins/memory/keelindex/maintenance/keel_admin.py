"""Read-only configuration helpers for operator tools (requires PyYAML)."""
from pathlib import Path


def config(profile):
    import yaml
    class UniqueLoader(yaml.SafeLoader):
        pass

    def mapping(loader, node):
        result = {}
        for key_node, value_node in node.value:
            key = loader.construct_object(key_node, deep=True)
            if key in result:
                raise ValueError('duplicate configuration key')
            result[key] = loader.construct_object(value_node, deep=True)
        return result

    UniqueLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, mapping)
    try:
        value = yaml.load((Path(profile) / 'config.yaml').read_text(encoding='utf-8'), Loader=UniqueLoader)
    except yaml.YAMLError as exc:
        raise ValueError('invalid profile YAML') from exc
    if value is None:
        return {}
    if not isinstance(value, dict):
        raise ValueError('profile configuration must be a mapping')
    return value


def memory_servers(profile):
    servers = config(profile).get('mcp_servers', {})
    if not isinstance(servers, dict):
        raise ValueError('mcp_servers must be a mapping')
    return [name for name, value in servers.items()
            if isinstance(name, str) and isinstance(value, dict) and value
            and value.get('enabled', True) is True and value.get('disabled', False) is False
            and (name == 'synapsek' or 'memory' in name.lower())]


def profiles(root, selected=None):
    root = Path(root).resolve(strict=True)
    result = []
    for path in sorted(root.iterdir()):
        # Hebri's default home is hidden (.hebri/.hermes). An explicit selection
        # may name it; implicit multi-profile discovery still skips hidden dirs.
        if (path.name.startswith('.') and not selected) or not path.is_dir() or not (path / 'config.yaml').is_file():
            continue
        if selected and path.name not in selected:
            continue
        path.resolve().relative_to(root)
        (path / 'config.yaml').resolve().relative_to(path.resolve())
        result.append(path)
    missing = set(selected or []) - {p.name for p in result}
    if missing:
        raise ValueError('unknown profiles: ' + ', '.join(sorted(missing)))
    if not result:
        raise ValueError('no configured profiles selected')
    return result
