# Next.js with HogTyped Generated Wrapper

This example shows how to use HogTyped with Next.js using the code generation approach.

## Setup

```bash
# 1. Install dependencies
npm install hogtyped posthog-js

# 2. Create your schemas
mkdir schemas
# Add your event schemas to schemas/events.schema.json

# 3. Add generation to package.json
{
  "scripts": {
    "generate:posthog": "hogtyped generate -o lib/posthog.ts",
    "dev": "npm run generate:posthog && next dev",
    "build": "npm run generate:posthog && next build"
  }
}

# 4. Generate your wrapper
npm run generate:posthog
```

## File Structure

```
app/
├── schemas/
│   └── events.schema.json      # Your event schemas
├── lib/
│   └── posthog.ts             # Generated wrapper (git-ignored)
├── app/
│   ├── layout.tsx             # Initialize PostHog
│   └── page.tsx               # Use PostHog
└── .gitignore                 # Ignore generated files
```

## Usage

See the example files for complete implementation with:
- App Router support
- Server and Client Components
- TypeScript autocomplete
- API route tracking
- Middleware integration