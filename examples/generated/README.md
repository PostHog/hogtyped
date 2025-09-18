# Generated Wrapper Examples

This example shows how to use the HogTyped code generation approach where schemas are **baked into your code at build time**.

## Setup

1. Install HogTyped:
```bash
npm install hogtyped
```

2. Create your schemas in `schemas/events.schema.json`

3. Generate your custom wrapper:
```bash
npx hogtyped generate
```

This creates `src/posthog.generated.ts` with:
- ✅ All schemas embedded (no runtime loading!)
- ✅ Full TypeScript types
- ✅ Compile-time type checking
- ✅ Zero network requests for schemas
- ✅ Works in any environment (Node, browser, React Native)

## Usage

```typescript
// Import your generated wrapper
import { posthog } from './posthog.generated';

// Use with full type safety!
posthog.capture('user_signed_up', {
  userId: '123',       // ✅ Autocomplete!
  email: 'a@b.com',    // ✅ Type checked!
  plan: 'growth'       // ✅ Enum validated!
});
```

## Benefits

1. **Zero Runtime Overhead**: Schemas are part of your bundle
2. **Instant Validation**: No async loading, no network calls
3. **Smaller Bundle**: Only includes schemas you actually use
4. **Full Type Safety**: TypeScript knows every event and property
5. **Works Everywhere**: Node, browser, serverless, edge functions