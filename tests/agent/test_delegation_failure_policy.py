"""A strict child stops before the next tool or model call; ordinary children recover."""
import json
from types import SimpleNamespace

import pytest


@pytest.mark.parametrize('failure_kind', ['validation', 'exit', 'timeout', 'parallel_read', 'success'])
@pytest.mark.parametrize('strict', [True, False])
def test_tool_round_stops_only_opted_in_child(tmp_path, monkeypatch, failure_kind, strict):
    from run_agent import AIAgent
    from agent.turn_tool_round import run_tool_round
    from tools.terminal_tool import _handle_terminal
    import model_tools

    agent = AIAgent(
        provider='custom', model='lab-test', api_key='test-only', base_url='http://127.0.0.1:1/v1',
        enabled_toolsets=['terminal'], quiet_mode=True, skip_memory=True,
        skip_context_files=True, skip_background_review=True, cwd=str(tmp_path),
    )
    agent._delegate_stop_on_tool_error = strict
    agent._delegate_tool_failure = None
    attempts = []
    marker = tmp_path / 'second-call.txt'

    def dispatch(name, args, *a, **kw):
        attempts.append(args)
        if len(attempts) == 1:
            if failure_kind == 'success':
                return json.dumps({'exit_code': 0, 'output': 'first call succeeded'})
            if failure_kind == 'validation':
                return _handle_terminal({'command': 'unused', 'background': False, 'heartbeat': 60})
            if failure_kind == 'timeout':
                return "Error executing tool 'terminal': timed out"
            return json.dumps({'exit_code': 17, 'error': 'probe failed'})
        marker.write_text('second tool executed')
        return json.dumps({'exit_code': 0, 'output': 'recovered'})

    monkeypatch.setattr(model_tools, 'handle_function_call', dispatch)
    tool_name = 'read_file' if failure_kind == 'parallel_read' else 'terminal'
    agent.valid_tool_names.add(tool_name)
    if strict:
        monkeypatch.setattr(agent, '_execute_tool_calls_concurrent', lambda *a, **kw: pytest.fail('Strict task must serialize calls'))
    calls = [SimpleNamespace(id=f'call-{n}', type='function',
                             function=SimpleNamespace(name=tool_name, arguments=json.dumps({'command': f'probe-{n}', 'path': str(tmp_path / f'file-{n}')})))
             for n in (1, 2)]
    message = SimpleNamespace(role='assistant', content=None, tool_calls=calls)
    messages = [{'role': 'user', 'content': 'Run the probe.'}]
    verdict = run_tool_round(
        agent, assistant_message=message, finish_reason='tool_calls', messages=messages,
        conversation_history=[], api_call_count=1, effective_task_id='policy-test', user_message='Run the probe.',
        system_message='', active_system_prompt='', compression_attempts=0, max_compression_attempts=1,
        final_response='', failed=False, _turn_exit_reason='', truncated_tool_call_retries=0,
        current_turn_user_idx=0,
    )
    tool_results = [m for m in messages if m['role'] == 'tool']
    assert [m['tool_call_id'] for m in tool_results] == ['call-1', 'call-2']
    stopped = strict and failure_kind != 'success'
    assert len(attempts) == (1 if stopped else 2)
    assert marker.exists() is (not stopped)
    assert verdict.action == ('break' if stopped else 'continue')
    assert verdict.failed is stopped
    if stopped:
        assert 'not started' in tool_results[1]['content']
        expected = {'validation': 'notify/heartbeat', 'timeout': 'timed out'}.get(failure_kind, 'probe failed')
        assert expected in verdict.final_response
        assert messages[-1]['role'] == 'assistant'


def test_task_policy_is_typed_and_cannot_trigger_schema_retry(monkeypatch):
    from tools.delegate_tool_tasks import _normalize_task_list
    from tools.delegate_tool_child_run import _validate_child_output_schema, _build_result_entry
    from tools import delegate_tool
    from tools.delegate_tool_results import _extract_output_tail, _looks_like_error_output
    from agent.delegation_failure_policy import tool_failure_response

    tasks = [{'goal': 'Run one probe and stop on failure', 'stop_on_tool_error': True}]
    normalized, error = _normalize_task_list(None, None, tasks, None, 'leaf', 3)
    assert error is None and normalized[0]['stop_on_tool_error'] is True
    assert _normalize_task_list(None, None, [{**tasks[0], 'stop_on_tool_error': 'false'}], None, 'leaf', 3)[1]
    child = SimpleNamespace(run_conversation=lambda **kw: pytest.fail('Failure must not trigger a schema retry'))
    monkeypatch.setattr(delegate_tool, '_build_child_preserving_parent_tools', lambda **kw: child)
    children, error = delegate_tool._build_children(
        tasks, [None], {'provider': 'custom', 'base_url': '', 'api_key': '', 'api_mode': 'chat_completions', 'model': 'test'},
        top_role='leaf', max_iterations=3, parent_agent=SimpleNamespace(), routing_cfg={},
        live_deleg_id=None, live_writers=[],
    )
    assert error is None and children[0][2]._delegate_stop_on_tool_error is True
    failure = json.dumps({'output': 'probe failed', 'exit_code': 17, 'error': None})
    child._delegate_tool_failure = ('terminal', failure)
    child._delegate_output_schema = {'type': 'object', 'required': ['answer']}
    result = {'failed': True, 'completed': False, 'final_response': tool_failure_response(child), 'messages': [
        {'role': 'assistant', 'tool_calls': [{'id': 'probe', 'function': {'name': 'terminal', 'arguments': '{}'}}]},
        {'role': 'tool', 'tool_call_id': 'probe', 'content': failure},
    ]}
    outcome = _validate_child_output_schema(child, result, 0, 'child', None)
    entry = _build_result_entry(child, result, 0, 0.1, outcome)
    assert entry['status'] == 'failed' and entry['exit_reason'] == 'error'
    assert entry['error'] == result['final_response']
    assert entry['tool_trace'][0]['status'] == 'error'
    assert _extract_output_tail(result)[0]['is_error'] is True
    assert not _looks_like_error_output({'exit_code': 0, 'error': None, 'output': 'no error'})
