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