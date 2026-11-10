"""Delegation contracts survive provider schema conversion and child construction."""
import json
from types import SimpleNamespace

import pytest
from jsonschema import ValidationError, validate


def test_provider_contract_accepts_json_schema_text_and_requires_policy():
    from tools import delegate_tool
    from tools.registry import registry
    from tools.schema_sanitizer import sanitize_tool_schemas
    from agent.codex_responses_adapter import _responses_tools

    definitions = registry.get_definitions({'delegate_task'}, quiet=True)
    definitions[0]['function'].update(delegate_tool._build_dynamic_schema_overrides())
    wire = _responses_tools(sanitize_tool_schemas(definitions))[0]
    contract = {'type': 'object', 'required': ['outcome'],
                'properties': {'outcome': {'type': 'string'}}}
    task = {'goal': 'Run the requested probe once.', 'stop_on_tool_error': True,
            'output_schema': json.dumps(contract)}
    validate({'tasks': [task]}, wire['parameters'])
    with pytest.raises(ValidationError):
        validate({'tasks': [{k: v for k, v in task.items() if k != 'stop_on_tool_error'}]}, wire['parameters'])
    # Ordinary recovery is still an explicit valid choice; schema remains optional.
    validate({'tasks': [{'goal': task['goal'], 'stop_on_tool_error': False}]}, wire['parameters'])
    validate({'action': 'list'}, wire['parameters'])


@pytest.mark.parametrize('encoded', [False, True])
def test_dispatch_keeps_contract_and_legacy_recovery(monkeypatch, encoded):
    from tools import delegate_tool
    from tools.arg_coercion import coerce_tool_args
    from tools.delegate_tool_tasks import _normalize_task_list, _coerce_task_schemas
    from tools.delegation_output_schema import validate_output

    contract = {'type': 'object', 'required': ['outcome'], 'properties': {
        'outcome': {'type': 'string'}, 'detail': {'type': 'object', 'additionalProperties': True}},
        'additionalProperties': False}
    args = coerce_tool_args('delegate_task', {'tasks': [{
        'goal': 'Run the requested probe once.', 'stop_on_tool_error': True,
        'output_schema': json.dumps(contract) if encoded else contract,
    }]})
    tasks, error = _normalize_task_list(None, None, args['tasks'], None, 'leaf', 3)
    assert error is None
    schemas, error = _coerce_task_schemas(tasks, None)
    assert error is None and schemas == [contract]
    assert validate_output('{"outcome":"failed"}', schemas[0])[0] is True
    assert validate_output('{"detail":{}}', schemas[0])[0] is False
    captured = []
    def build(**kwargs):
        captured.append(kwargs)
        return SimpleNamespace()
    monkeypatch.setattr(delegate_tool, '_build_child_preserving_parent_tools', build)
    creds = {'provider': 'custom', 'base_url': '', 'api_key': '', 'api_mode': 'chat_completions', 'model': 'test'}
    children, error = delegate_tool._build_children(
        tasks, schemas, creds, top_role='leaf', max_iterations=3, parent_agent=SimpleNamespace(),
        routing_cfg={}, live_deleg_id=None, live_writers=[],
    )
    assert error is None
    child = children[0][2]
    assert child._delegate_stop_on_tool_error is True
    assert child._delegate_output_schema == contract
    assert json.dumps(contract, indent=2) in captured[0]['context']
    # Existing callers/transcripts may omit the newly advertised required decision.
    legacy, error = _normalize_task_list('Legacy task', None, None, None, 'leaf', 3)
    assert error is None
    children, error = delegate_tool._build_children(
        legacy, [None], creds, top_role='leaf', max_iterations=3, parent_agent=SimpleNamespace(),
        routing_cfg={}, live_deleg_id=None, live_writers=[],
    )
    assert error is None and children[0][2]._delegate_stop_on_tool_error is False


def test_missing_validator_never_certifies_a_contract(monkeypatch):
    import sys
    from tools.delegation_output_schema import coerce_output_schema, validate_output

    monkeypatch.setitem(sys.modules, 'jsonschema.validators', None)
    schema, error = coerce_output_schema({'type': 'object', 'required': ['outcome']})
    assert schema is None and 'jsonschema' in error
    valid, errors = validate_output('{}', {'type': 'object', 'required': ['outcome']})
    assert valid is False and any('jsonschema' in error for error in errors)
    assert coerce_output_schema(None) == (None, None)
