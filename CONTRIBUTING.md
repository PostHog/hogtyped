# Contributing to HogTyped

Thank you for your interest in contributing to HogTyped! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:
- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Accept feedback gracefully

## Getting Started

1. **Fork the repository**
   ```bash
   git clone https://github.com/YOUR-USERNAME/hogtyped.git
   cd hogtyped
   ```

2. **Install dependencies**
   ```bash
   # TypeScript/JavaScript
   cd packages/js
   npm install

   # Python
   cd packages/python
   pip install -e ".[dev]"
   ```

3. **Run tests**
   ```bash
   # From root
   npm test
   ```

## Development Workflow

### 1. Create a feature branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-number
```

### 2. Make your changes

- Write clear, self-documenting code
- Add tests for new functionality
- Update documentation as needed
- Follow the existing code style

### 3. Test your changes

```bash
# TypeScript tests
cd packages/js
npm test
npm run lint
npm run typecheck

# Python tests
cd packages/python
python -m pytest
python -m mypy hogtyped/ --ignore-missing-imports
```

### 4. Test code generation

```bash
# Generate and verify TypeScript
npx hogtyped generate -o test.ts
npx tsc test.ts --noEmit

# Generate and verify Python
python -m hogtyped generate -o test.py
python -m py_compile test.py
```

### 5. Commit your changes

Follow conventional commits format:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Test changes
- `refactor:` Code refactoring
- `chore:` Maintenance tasks

```bash
git commit -m "feat: add support for custom validators"
```

### 6. Push and create a Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a PR on GitHub with:
- Clear description of changes
- Link to related issues
- Screenshots if applicable

## Project Structure

```
hogtyped/
├── packages/
│   ├── js/                 # TypeScript/JavaScript package
│   │   ├── src/
│   │   │   └── codegen/    # Code generation logic
│   │   ├── bin/            # CLI executable
│   │   └── tests/
│   └── python/             # Python package
│       ├── hogtyped/
│       │   └── codegen.py  # Code generation logic
│       └── tests/
├── test-schemas/          # Shared test schemas
└── examples/              # Usage examples
```

## Testing Guidelines

### Writing Tests

- Test both success and failure cases
- Use descriptive test names
- Keep tests focused and isolated
- Mock external dependencies

### TypeScript Tests
```typescript
describe('Feature Name', () => {
  test('should do something specific', () => {
    // Arrange
    const input = {...};

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toBe(expected);
  });
});
```

### Python Tests
```python
def test_feature_name():
    # Arrange
    input_data = {...}

    # Act
    result = my_function(input_data)

    # Assert
    assert result == expected
```

## Code Style

### TypeScript/JavaScript
- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for formatting
- Prefer async/await over promises

### Python
- Follow PEP 8
- Use type hints for all functions
- Use Black for formatting
- Use isort for imports

## Documentation

- Update README.md for user-facing changes
- Add JSDoc/docstrings for public APIs
- Include examples for new features
- Update CHANGELOG.md

## Release Process

Releases are automated via GitHub Actions when a tag is pushed:

1. Update version in `package.json` / `setup.py`
2. Update CHANGELOG.md
3. Create and push tag:
   ```bash
   git tag v1.2.3
   git push origin v1.2.3
   ```

## Getting Help

- Check existing issues and PRs
- Ask questions in discussions
- Join our community Discord (if available)
- Email maintainers (if provided)

## Recognition

Contributors will be recognized in:
- GitHub contributors page
- Release notes
- README.md (for significant contributions)

Thank you for contributing to HogTyped! 🐗✨