# React App with Generated PostHog Wrapper

This example shows how to use HogTyped in a React application with schemas baked in at build time.

## Setup

```bash
# 1. Install dependencies
npm install hogtyped posthog-js

# 2. Create your schemas in schemas/

# 3. Add to package.json scripts:
"scripts": {
  "generate:posthog": "hogtyped generate -o src/lib/posthog.ts",
  "prebuild": "npm run generate:posthog"
}

# 4. Generate your wrapper
npm run generate:posthog
```

## Usage in React Components

```tsx
// src/lib/posthog.ts is generated - no runtime loading!
import { posthog } from './lib/posthog';

function App() {
  useEffect(() => {
    // Track page view with full type safety
    posthog.capture('page_viewed', {
      url: window.location.href,
      title: document.title
    });
  }, []);

  const handleClick = () => {
    // IDE autocompletes event names and properties!
    posthog.capture('button_clicked', {
      buttonId: 'cta-main',
      page: '/home'
    });
  };

  return <button onClick={handleClick}>Click Me</button>;
}
```

## Benefits for React Apps

1. **No Async Loading**: Schemas are in your bundle, ready immediately
2. **React Native Compatible**: Works without filesystem access
3. **TypeScript First**: Full type safety in all components
4. **Small Bundle**: Only includes schemas you define
5. **Fast**: No runtime schema parsing or validation compilation