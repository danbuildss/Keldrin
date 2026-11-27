"""Validate only the documentation starter and clearly synthetic fixture."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
required = ['START_HERE.md', 'CLAUDE.md', 'Notes.MD', 'DECISIONS.md', 'STATUS.md', 'TASKS.md', 'BACKEND_PROOF.md', 'AUTOMATION.md', 'CLAUDE_FIRST_PROMPT.md', 'SECURITY.md']
for filename in required:
    assert (ROOT / filename).is_file(), filename
schema = json.loads((ROOT / 'schemas/event-record.schema.json').read_text())
fixture = json.loads((ROOT / 'fixtures/synthetic-event.json').read_text())
assert set(schema['required']) <= fixture.keys()
assert fixture['synthetic'] is True
assert fixture['verification']['state'] == 'draft'
assert fixture['asset']['contract_address'] == '0x' + '0' * 40
sources = {s['id'] for s in fixture['sources']}
assert fixture['asset']['mapping_source'] in sources
for fact in fixture['facts']:
    assert set(fact['evidence_ids']) <= sources
assert all(s['rights_state'] == 'unknown' for s in fixture['sources'])
for skill in (ROOT / 'skills').glob('*/SKILL.md'):
    assert skill.read_text().startswith('---\nname:'), skill
try:
    from jsonschema import Draft202012Validator, FormatChecker
except ImportError:
    print('jsonschema unavailable: full schema validation SKIPPED')
else:
    Draft202012Validator.check_schema(schema)
    Draft202012Validator(schema, format_checker=FormatChecker()).validate(fixture)
    print('JSON Schema validation passed (synthetic fixture only)')
print('Starter checks passed; no live agent or financial data tested.')
