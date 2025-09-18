# HogTyped 🐗✨

[![CI](https://github.com/PostHog/hogtyped/actions/workflows/ci.yml/badge.svg)](https://github.com/PostHog/hogtyped/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.8%2B-blue)](https://www.python.org/)
[![npm](https://img.shields.io/npm/v/hogtyped)](https://www.npmjs.com/package/hogtyped)
[![PyPI](https://img.shields.io/pypi/v/hogtyped)](https://pypi.org/project/hogtyped/)

Code generation tool that creates type-safe PostHog wrappers with embedded JSON schemas.
Generate custom analytics libraries for TypeScript and Python with zero runtime overhead.

## 🚧 Experimental 🚧
This is literally hot off the press and may have a few rough edges. Please report any issues you encounter!

## Features

- 🏗️ **Code Generation** - Generates custom wrappers with schemas baked in at build time
- 🔒 **Type Safety** - Full TypeScript/Python type hints from JSON Schema
- 💡 **IDE Autocomplete** - Event names and properties autocomplete as you type
- ⚡ **Zero Runtime Overhead** - No schema loading, parsing, or network requests
- 🚀 **Instant Validation** - Validators are pre-compiled into generated code
- 🌍 **Cross-Language** - Share schemas between TypeScript and Python
- 📦 **Minimal Bundle Size** - Only your schemas, no loader code
- 🎯 **Flexible Validation** - Strict, warning, or disabled modes
- 🔄 **Drop-in Replacement** - Same API as vanilla PostHog libraries

## Installation

### TypeScript/JavaScript
```bash
npm install hogtyped
# or
yarn add hogtyped
```

### Python
```bash
pip install hogtyped
```

## Universal Environment Support

Works everywhere through code generation:

### ✅ Node.js
- Generated wrapper works in any Node environment
- No filesystem access needed at runtime
- Perfect for serverless/edge functions

### ✅ Browser
- Schemas embedded in your bundle
- No network requests needed
- Works offline

### ✅ React Native
- No special configuration needed
- Schemas are just JavaScript

### ✅ Edge/Serverless
- Zero cold start overhead
- No external dependencies

## Quick Start 🚀

**Schemas are baked into your code at build time - no runtime loading!**

```bash
# 1. Install HogTyped
npm install hogtyped

# 2. Initialize (creates example schemas)
npx hogtyped init

# 3. Generate your custom wrapper
npx hogtyped generate

# 4. Use your generated wrapper (src/posthog.generated.ts)
```

```typescript
// Everything is baked in - no runtime loading!
import { posthog } from './posthog.generated';

posthog.capture('user_signed_up', {
  userId: '123',     // ✅ Full autocomplete
  email: 'a@b.com',  // ✅ Type checked
  plan: 'growth'     // ✅ Validates enums
});
```

### 1. Define Your Event Schemas

Create a `schemas/events.schema.json` file:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "definitions": {
    "UserSignedUp": {
      "type": "object",
      "properties": {
        "userId": { "type": "string" },
        "email": { "type": "string", "format": "email" },
        "plan": {
          "type": "string",
          "enum": ["free", "starter", "growth", "enterprise"]
        }
      },
      "required": ["userId", "email", "plan"]
    }
  },
  "events": {
    "user_signed_up": { "$ref": "#/definitions/UserSignedUp" }
  }
}
```

### 2. Generate TypeScript Types (for autocomplete)

```bash
npm run generate:types
```

### 3. Use in TypeScript with Full Autocomplete

```typescript
import { TypedHogTyped, ValidationMode } from 'hogtyped';

const posthog = new TypedHogTyped('YOUR_API_KEY', {
  validationMode: ValidationMode.STRICT,
  autoDiscoverSchemas: true
});

// TypeScript provides autocomplete for event names and properties!
posthog.capture('user_signed_up', {
  userId: 'user-123',      // ✅ Required - TypeScript will error if missing
  email: 'user@example.com', // ✅ Must be valid email format
  plan: 'growth'            // ✅ Autocompletes: 'free' | 'starter' | 'growth' | 'enterprise'
});

// ❌ TypeScript Error at compile time + runtime validation
posthog.capture('user_signed_up', {
  userId: 'user-123',
  email: 'not-an-email', // TypeScript error: Invalid format!
  plan: 'invalid-plan'    // TypeScript error: Not in enum!
});
```

**What You Get:**
- 🎯 **Event name autocomplete** - IDE suggests available events as you type
- 📝 **Property autocomplete** - IDE suggests required and optional properties
- ⚠️ **Compile-time errors** - TypeScript catches missing/wrong properties before runtime
- 📖 **Inline documentation** - Hover for property descriptions and types

### 4. Use in Python (Also with Code Generation!)

```bash
# Generate your Python wrapper
python -m hogtyped generate
```

```python
# Import the GENERATED wrapper - schemas embedded!
from posthog_generated import posthog

# Full type hints with TypedDict classes
posthog.capture(
    distinct_id="user-123",
    event="user_signed_up",  # Type hints available!
    properties={
        "userId": "user-123",
        "email": "user@example.com",
        "plan": "growth"  # Validated against enum
    }
)

# ❌ Invalid - will raise ValueError in strict mode
posthog.capture(
    distinct_id="user-123",
    event="user_signed_up",
    properties={
        "email": "not-an-email"  # Missing userId, invalid email!
    }
)
```

**Python Type Checking:**
```bash
# Type check with mypy
mypy your_app.py  # Validates event names and properties!
```

## CLI Commands

### TypeScript/JavaScript
```bash
# Initialize HogTyped in your project
npx hogtyped init

# Generate wrapper with default options
npx hogtyped generate

# Custom options
npx hogtyped generate \
  --schemas "./schemas/**/*.json" \
  --output "./src/analytics.ts" \
  --class "Analytics" \
  --mode "strict"
```

### Python
```bash
# Initialize HogTyped in your project
python -m hogtyped init

# Generate wrapper with default options
python -m hogtyped generate

# Custom options
python -m hogtyped generate \
  --schemas "./schemas/**/*.json" \
  --output "./lib/analytics.py" \
  --class-name "Analytics" \
  --mode "strict"
```

### Generated File Structure

Running `npx hogtyped generate` creates a single file with everything:

```typescript
// src/posthog.generated.ts

// ✅ TypeScript interfaces for all events
export interface UserSignedUpProperties { ... }
export interface ButtonClickedProperties { ... }

// ✅ Embedded schemas (no runtime loading!)
const SCHEMAS = {
  'user_signed_up': { /* schema */ },
  'button_clicked': { /* schema */ }
};

// ✅ Type-safe wrapper class
export class PostHog {
  capture<K extends EventName>(event: K, properties: EventMap[K]): void
  // ... all PostHog methods
}

// ✅ Ready-to-use instance
export const posthog = new PostHog();
```

## Usage Examples

### Node.js Server
```javascript
const { HogTyped } = require('hogtyped');

const posthog = new HogTyped('YOUR_API_KEY', {
  autoDiscoverSchemas: true // Finds schemas automatically
});

// Express.js example
app.post('/api/signup', (req, res) => {
  try {
    posthog.capture('user_signed_up', {
      userId: req.body.userId,
      email: req.body.email,
      plan: req.body.plan
    });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Invalid event data' });
  }
});
```

### Browser (React)
```tsx
import { HogTyped, ValidationMode } from 'hogtyped';

const posthog = new HogTyped('YOUR_API_KEY', {
  validationMode: ValidationMode.WARNING // Don't break the app
});

function SignupButton() {
  const handleSignup = () => {
    posthog.capture('user_signed_up', {
      userId: user.id,
      email: user.email,
      plan: 'free'
    });
  };

  return <button onClick={handleSignup}>Sign Up</button>;
}
```

### Browser (Vanilla JS)
```html
<script type="module">
  import { HogTyped } from 'https://unpkg.com/hogtyped/dist/browser/index.js';

  const posthog = new HogTyped('YOUR_API_KEY', {
    schemas: '/schemas/events.json' // Load from URL
  });

  // Wait for schemas to load
  await posthog.ready();

  document.getElementById('signup').addEventListener('click', () => {
    posthog.capture('user_signed_up', { /* ... */ });
  });
</script>
```

## Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `validationMode` | How to handle validation errors: `STRICT`, `WARNING`, or `DISABLED` | `WARNING` |
| `autoDiscoverSchemas` | Automatically find schema files (Node.js only) | `true` |
| `schemasDirectory` | Where to look for schema files | Current directory |
| `schemas` | Explicit schema file paths or URLs | `[]` |
| `sendValidationErrors` | Send validation errors as PostHog events | `true` |
| `environment` | Current environment (affects behavior) | `development` |
| `onValidationError` | Custom error handler callback | Console error |

## Validation Modes

### Strict Mode
- **Development**: Throws exceptions on validation errors
- **Production**: Logs errors and sends `$schema_validation_error` event
- Use for critical events where data quality is essential

### Warning Mode (Default)
- Logs validation errors to console
- Sends `$schema_validation_warning` event to PostHog
- Still sends the original event
- Use for gradual schema adoption

### Disabled Mode
- No validation performed
- Use for performance-critical paths or testing

## Schema Organization

### Extending Base Schemas

Use JSON Schema's `allOf` to extend the base PostHog event properties:

```json
{
  "definitions": {
    "CustomEvent": {
      "allOf": [
        { "$ref": "./base.schema.json#/definitions/BaseEvent" },
        {
          "type": "object",
          "properties": {
            "customField": { "type": "string" }
          }
        }
      ]
    }
  }
}
```

### Multiple Schema Files

Organize schemas by feature or domain:

```
schemas/
├── base.schema.json      # Base event properties
├── auth.schema.json      # Authentication events
├── billing.schema.json   # Billing events
└── feature.schema.json   # Feature usage events
```

## Migration from Vanilla PostHog

HogTyped is designed as a drop-in replacement:

```typescript
// Before
import posthog from 'posthog-js';
posthog.capture('event', { foo: 'bar' });

// After
import { HogTyped } from 'hogtyped';
const posthog = new HogTyped('YOUR_API_KEY');
posthog.capture('event', { foo: 'bar' }); // Same API!
```

## TypeScript Type Generation

Generate TypeScript types from your schemas:

```bash
npm run generate:types
```

This creates fully typed interfaces for all your events.

## Development Workflow

1. **Define schemas** in JSON Schema format
2. **Auto-generate types** (TypeScript)
3. **Get IDE autocomplete** for event names and properties
4. **Validate at runtime** to catch issues early
5. **Monitor validation errors** in PostHog

## Best Practices

1. **Start with WARNING mode** and migrate to STRICT gradually
2. **Use schemas for critical business events** first
3. **Share schemas between frontend and backend** for consistency
4. **Version your schemas** and handle breaking changes carefully
5. **Monitor `$schema_validation_error` events** in production

## Examples

See the `/examples` directory for:
- Basic usage in TypeScript and Python
- Node.js server integration
- Browser usage (React, Vue, Vanilla JS)
- Complex nested schemas
- Progressive migration strategies
- Custom validation handlers
- Multi-schema organization

## Development & Testing

### Testing Locally Without Publishing

#### JavaScript/TypeScript

**Method 1: npm link (Recommended for CLI testing)**
```bash
# In the package directory
cd packages/js
npm link

# Now you can use the CLI globally
hogtyped init
hogtyped generate

# To unlink when done
npm unlink -g hogtyped
```

**Method 2: Direct execution**
```bash
# Build the package first
cd packages/js
npm run build

# Run the CLI directly
node ./bin/hogtyped.js init
node ./bin/hogtyped.js generate
```

**Method 3: Install from local path**
```bash
# In your test project
npm install ../path/to/hogtyped/packages/js

# Use in your code
import { generateWrapper } from 'hogtyped';
```

**Method 4: npm pack (Test the actual package)**
```bash
# In packages/js
npm pack  # Creates hogtyped-0.1.0.tgz

# In your test project
npm install ../path/to/hogtyped-0.1.0.tgz
```

#### Python

**Method 1: pip install in editable mode**
```bash
# In your test project with virtual environment activated
pip install -e /path/to/hogtyped/packages/python

# Now you can use it
python -m hogtyped init
python -m hogtyped generate

# Or in Python code
from hogtyped import generate_wrapper
```

**Method 2: Direct execution**
```bash
# Run directly from source
cd packages/python
python -m hogtyped init
python -m hogtyped generate
```

**Method 3: Build and install wheel**
```bash
# In packages/python
python -m build  # Creates dist/hogtyped-0.1.0-py3-none-any.whl

# In your test project
pip install /path/to/hogtyped/packages/python/dist/hogtyped-0.1.0-py3-none-any.whl
```

### Running Tests

```bash
# Run all tests (from monorepo root)
npm test

# JavaScript tests only
cd packages/js && npm test

# Python tests only
cd packages/python
uv venv && source .venv/bin/activate
uv pip install -e ".[dev]"
python -m pytest

# Watch mode for JavaScript
cd packages/js && npm run test:watch
```

### Example Test Project

Create a test project to try out HogTyped:

```bash
# Create test directory
mkdir test-hogtyped && cd test-hogtyped

# Create a simple schema
mkdir schemas
cat > schemas/events.schema.json << 'EOF'
{
  "events": {
    "button_clicked": {
      "type": "object",
      "properties": {
        "button_id": { "type": "string" },
        "page": { "type": "string" }
      },
      "required": ["button_id"]
    }
  }
}
EOF

# For TypeScript
npx /path/to/hogtyped/packages/js/bin/hogtyped.js generate

# For Python
python /path/to/hogtyped/packages/python/hogtyped generate

# Check the generated files
cat src/posthog.generated.ts  # TypeScript
cat posthog_generated.py      # Python
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md).

## License

MIT License - see [LICENSE](LICENSE) for details.
