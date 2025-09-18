# Testing HogTyped

This document describes how to run tests for both TypeScript/JavaScript and Python code generators.

## Prerequisites

### TypeScript/JavaScript
```bash
cd packages/js
npm install
```

### Python
```bash
cd packages/python
pip install -e ".[dev]"
```

## Running Tests

### Run All Tests (from root)
```bash
npm test
```

### TypeScript/JavaScript Tests Only
```bash
cd packages/js
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

### Python Tests Only
```bash
cd packages/python
python -m pytest

# Verbose mode
python -m pytest -v

# With coverage
python -m pytest --cov=hogtyped
```

## Test Structure

### TypeScript/JavaScript Tests

Located in `packages/js/src/`:
- `codegen/generate-wrapper.test.ts` - Core code generation tests
- `cli.test.ts` - CLI tool tests

Tests cover:
- ✅ Basic code generation
- ✅ TypeScript compilation of generated code
- ✅ Type generation from JSON Schema
- ✅ Schema embedding and reference resolution
- ✅ Validation code generation
- ✅ CLI commands (init, generate)
- ✅ Error handling

### Python Tests

Located in `packages/python/tests/`:
- `test_codegen.py` - Core code generation tests
- `test_cli.py` - CLI tool tests

Tests cover:
- ✅ Basic code generation
- ✅ Python syntax validation
- ✅ TypedDict generation from JSON Schema
- ✅ Schema embedding and reference resolution
- ✅ Validation code generation
- ✅ CLI commands (init, generate)
- ✅ Error handling

## Test Schemas

Shared test schemas are located in `/test-schemas/`:
- `simple.schema.json` - Basic event with simple types
- `complex.schema.json` - Complex event with nested objects, arrays, and enums

## Continuous Integration

Tests should be run on:
- Every pull request
- Before releases
- Node.js versions: 16, 18, 20
- Python versions: 3.7, 3.8, 3.9, 3.10, 3.11

## Writing New Tests

### TypeScript/JavaScript
```typescript
describe('New Feature', () => {
  test('should do something', async () => {
    const result = await generateWrapper({
      schemas: './test-schemas/*.json',
      output: './test.ts'
    });

    expect(result).toBeDefined();
  });
});
```

### Python
```python
def test_new_feature():
    result = generate_wrapper(
        schemas="./test-schemas/*.json",
        output="./test.py"
    )

    assert result is not None
```

## Debugging Tests

### TypeScript/JavaScript
```bash
# Run specific test file
npm test -- generate-wrapper.test.ts

# Run with debugging
node --inspect-brk node_modules/.bin/jest
```

### Python
```bash
# Run specific test file
python -m pytest tests/test_codegen.py

# Run specific test
python -m pytest tests/test_codegen.py::TestPythonCodeGenerator::test_basic_generation

# Debug with pdb
python -m pytest -s --pdb
```