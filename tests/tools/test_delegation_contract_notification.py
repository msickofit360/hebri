"""The parent receives output-contract evidence on every completion path."""
import pytest


@pytest.mark.parametrize('kind', ['batch', 'single', 'early_failure'])
@pytest.mark.parametrize('valid', [True, False])
def test_completion_preserves_schema_verdict(kind, valid):
    from tools.process_registry_notifications import format_process_notification

    result = {'task_index': 0, 'status': 'failed', 'summary': 'probe output',
              'error': 'terminal exited 17', 'schema_valid': valid,
              'schema_errors': [] if valid else ["$: 'outcome' is a required property"]}
    event = {'type': 'async_delegation', 'delegation_id': 'contract-check',
             'goal': 'Run the probe', 'goals': ['Run the probe']}
    if kind == 'single':
        event.update(result)
    else:
        event['results'] = [result]
        if kind == 'early_failure':
            event['task_failure_notice'] = True
    rendered = format_process_notification(event)
    assert f'schema_valid={str(valid).lower()}' in rendered
    if not valid:
        assert result['schema_errors'][0] in rendered
    assert 'terminal exited 17' in rendered
    del result['schema_valid']
    if kind == 'single':
        del event['schema_valid']
    assert 'schema_valid=' not in format_process_notification(event)
