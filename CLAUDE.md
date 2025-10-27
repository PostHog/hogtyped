# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### JavaScript/TypeScript Package
```bash
# Build TypeScript
cd packages/js && npm run build

# Run tests
cd packages/js && npm test

# Run tests with coverage
cd packages/js && npm run test:coverage

# Run tests in watch mode
cd packages/js && npm run test:watch

# Lint TypeScript code
cd packages/js && npm run lint

# Type checking
cd packages/js && npm run typecheck

# Development mode (watch)
cd packages/js && npm run dev
```

### Python Package
```bash
# Setup virtual environment
cd packages/python && uv venv
source .venv/bin/activate

# Install dependencies
uv pip install -e ".[dev]"

# Run tests
python -m pytest

# Run tests with coverage
python -m pytest --cov

# Format Python code
black .

# Lint Python code
ruff .

# Type checking
mypy hogtyped
```

### Monorepo Commands
```bash
# Run all tests (JS and Python)
npm test

# Build JS package
npm run build

# Lint JS package
npm run lint
```

## Architecture

HogTyped is a code generation tool that creates type-safe PostHog analytics wrappers with embedded JSON schemas. It's organized as a monorepo with TypeScript and Python implementations.

### Key Concepts

1. **Code Generation Over Runtime**: Instead of loading and validating schemas at runtime, HogTyped generates wrapper code with schemas embedded directly. This provides zero runtime overhead and full type safety.

2. **Schema-First Design**: Events are defined using JSON Schema (draft-07). The schemas serve as the single source of truth for both TypeScript interfaces and Python type hints.

3. **Multi-Language Support**: The tool generates idiomatic code for both TypeScript and Python from the same schema definitions.

### Project Structure

- `/packages/js/` - TypeScript implementation
  - `src/codegen/` - Code generation logic for TypeScript wrappers
  - `src/index.ts` - Main entry point
  - `src/types.ts` - Type definitions
  - `bin/hogtyped.js` - CLI executable

- `/packages/python/` - Python implementation
  - `hogtyped/codegen.py` - Code generation logic for Python wrappers
  - `hogtyped/__main__.py` - CLI entry point

- `/examples/` - Usage examples for various frameworks and environments

### Code Generation Flow

1. **Schema Discovery**: Finds JSON schema files based on glob patterns
2. **Schema Parsing**: Validates and processes JSON schemas
3. **Code Generation**: Creates language-specific wrapper with:
   - Embedded schema definitions
   - Type-safe interfaces/classes
   - Validation logic
   - PostHog client wrapper
4. **File Writing**: Outputs single self-contained generated file

### Testing Strategy

- Unit tests for code generation logic
- Integration tests for CLI commands
- Test fixtures with various schema complexities
- Coverage targets for both packages

## Debugging & Troubleshooting

### Python Package Installation Issues

The Python package may have installation issues in some environments due to deprecated `setup.py` patterns. When debugging or running tests:

**Problem**: `pip install -e .` fails with `AttributeError: install_layout`
**Solution**: Tests are designed to work without package installation by using PYTHONPATH

**Running Tests Without Installation**:
```bash
cd packages/python
# Install pytest dependencies only
python -m pip install pytest pytest-cov

# Run tests directly - they set PYTHONPATH automatically
python -m pytest tests/
```

**How Tests Work**:
- Tests in `tests/test_cli.py` set up PYTHONPATH in `setup_class()` to point to the package directory
- This allows `python -m hogtyped` to work in subprocess calls without installing the package
- The PYTHONPATH environment is passed to all subprocess.run() calls via the `env` parameter

### Python CLI Testing Pattern

When testing CLI commands that spawn subprocesses:

```python
# In test setup
@classmethod
def setup_class(cls):
    cls.package_dir = Path(__file__).parent.parent
    cls.env = os.environ.copy()
    pythonpath = str(cls.package_dir)
    if 'PYTHONPATH' in cls.env:
        cls.env['PYTHONPATH'] = f"{pythonpath}:{cls.env['PYTHONPATH']}"
    else:
        cls.env['PYTHONPATH'] = pythonpath

# In test methods
result = subprocess.run(
    [sys.executable, "-m", "hogtyped", "command"],
    env=self.env,  # Important: pass environment with PYTHONPATH
    capture_output=True,
    text=True
)
```

### Common Test Failures

1. **"No module named hogtyped"**
   - Cause: subprocess.run() doesn't have PYTHONPATH set
   - Fix: Add `env=self.env` to subprocess.run() call

2. **Init command not creating directories**
   - Cause: Command failing before directory creation (often due to import errors)
   - Debug: Check stderr output from subprocess result
   - Fix: Ensure PYTHONPATH is set in environment

3. **Generated code import errors**
   - Expected: Tests should handle PostHog import errors gracefully
   - The generated code tries to import 'posthog' which may not be installed
   - Tests should only fail on unexpected import errors

### Debugging Workflow

When tests fail:

1. **Run tests with verbose output**:
   ```bash
   python -m pytest tests/test_cli.py -v --tb=short
   ```

2. **Check stderr from subprocess calls**:
   ```python
   result = subprocess.run(...)
   print("STDOUT:", result.stdout)
   print("STDERR:", result.stderr)
   print("Return code:", result.returncode)
   ```

3. **Test CLI manually with PYTHONPATH**:
   ```bash
   cd packages/python
   PYTHONPATH=. python -m hogtyped --help
   PYTHONPATH=. python -m hogtyped init
   ```

4. **Verify package structure**:
   ```bash
   python -c "import sys; sys.path.insert(0, '.'); import hogtyped; print('OK')"
   ```

### Success Criteria for Python Tests

- All 21 tests should pass (6 CLI tests + 15 codegen tests)
- Tests should run without requiring package installation
- Tests should complete in under 5 seconds
- No warnings about missing modules (except expected posthog import in generated code)

### Formatting and Type Checking

**Python Formatting:**
```bash
cd packages/python
# Check formatting
black --check hogtyped/
isort --check-only hogtyped/

# Fix formatting
black hogtyped/
isort hogtyped/
```

**Python Type Checking:**
```bash
cd packages/python
# Run mypy
mypy hogtyped/ --ignore-missing-imports
```

**TypeScript Formatting:**
```bash
cd packages/js
# Check formatting
npx prettier --check "src/**/*.{ts,js,json}"

# Fix formatting
npx prettier --write "src/**/*.{ts,js,json}"
```

**Common Formatting/Type Issues:**

1. **Mypy python_version compatibility**
   - Mypy 1.0+ requires python_version to be 3.9 or higher in config
   - Even though package supports Python 3.7+, mypy config needs 3.9+
   - Set in pyproject.toml: `python_version = "3.9"`

2. **Type annotation errors in Python**
   - Use explicit type annotations when dict.get() is chained
   - Example: `resolved: Any = root_schema` instead of implicit typing
   - Check isinstance() before accessing dict methods
   - Avoid variable name collisions across scopes

3. **Formatting before commits**
   - Always run black and isort on Python code
   - Always run prettier on TypeScript code
   - CI will fail if formatting is not applied