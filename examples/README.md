# HogTyped Examples

These examples demonstrate how to use HogTyped with the **code generation approach** where schemas are baked into your code at build time.

## Examples

### 📁 [generated/](./generated)
**Basic code generation example**
- Shows the complete workflow
- Demonstrates all benefits
- TypeScript with full autocomplete

### 📁 [typescript/](./typescript)
**TypeScript usage patterns**
- Type-safe event tracking
- Compile-time validation
- IDE autocomplete features

### 📁 [browser/](./browser)
**Browser/vanilla JavaScript**
- Pure HTML/JS example
- Generated wrapper in browser
- No build tools required

### 📁 [nextjs/](./nextjs)
**Next.js App Router**
- Server and client components
- API routes
- Full TypeScript integration

### 📁 [node/](./node)
**Node.js server**
- Express.js integration
- API endpoint tracking
- Server-side validation

### 📁 [react-app/](./react-app)
**React SPA**
- Component integration
- Hook patterns
- Build tool setup

### 📁 [python/](./python)
**Python SDK**
- Server-side Python
- Schema validation
- Cross-language schema sharing

## Quick Start

All JavaScript/TypeScript examples use the same workflow:

```bash
# 1. Install HogTyped
npm install hogtyped

# 2. Create your schemas
mkdir schemas
echo '{
  "events": {
    "button_clicked": {
      "type": "object",
      "properties": {
        "buttonId": { "type": "string" }
      },
      "required": ["buttonId"]
    }
  }
}' > schemas/events.schema.json

# 3. Generate your wrapper
npx hogtyped generate

# 4. Use in your code
import { posthog } from './posthog.generated';

posthog.capture('button_clicked', {
  buttonId: 'submit' // Full type safety!
});
```

## Key Benefits

### ✅ Zero Runtime Overhead
- Schemas are embedded at build time
- No network requests for schemas
- No filesystem access needed
- Instant validation

### ✅ Better Developer Experience
- Full TypeScript autocomplete
- Compile-time error catching
- IDE integration
- No async initialization

### ✅ Universal Compatibility
- Works in Node.js
- Works in browsers
- Works in React Native
- Works in edge functions
- Works in serverless

### ✅ Optimal Performance
- Smaller bundle size (no loader code)
- Pre-compiled validators
- No runtime schema parsing
- Tree-shaking friendly

## Schema Organization

All examples share schemas from a common `schemas/` directory:
- `base.schema.json` - Common PostHog properties
- `user-events.schema.json` - User-specific events
- Custom schemas for each example

## Development Workflow

1. **Define schemas** in JSON Schema format
2. **Generate wrapper** with `npx hogtyped generate`
3. **Import and use** with full type safety
4. **Commit schemas** (not generated code) to git

## Production Tips

### Add to Build Process
```json
{
  "scripts": {
    "prebuild": "hogtyped generate",
    "build": "your-build-command"
  }
}
```

### Git Ignore Generated Files
```gitignore
# Generated PostHog wrapper
src/posthog.generated.ts
lib/analytics.generated.js
```

### CI/CD Integration
```yaml
# GitHub Actions example
- name: Generate PostHog Wrapper
  run: npx hogtyped generate

- name: Build Application
  run: npm run build
```

## Questions?

See the [main README](../README.md) for complete documentation.