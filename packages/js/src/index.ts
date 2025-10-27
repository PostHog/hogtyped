/**
 * HogTyped - Type-safe PostHog wrapper using code generation
 *
 * This package generates a custom PostHog wrapper with schemas baked in at build time.
 * No runtime loading, no async initialization, just pure type safety!
 *
 * Usage:
 * 1. Define your event schemas in JSON Schema format
 * 2. Run: npx hogtyped generate
 * 3. Import and use your generated wrapper
 *
 * @example
 * ```bash
 * npx hogtyped generate
 * ```
 *
 * @example
 * ```typescript
 * import { posthog } from './posthog.generated';
 *
 * posthog.capture('user_signed_up', {
 *   userId: '123',
 *   email: 'user@example.com',
 *   plan: 'pro'
 * });
 * ```
 */

export { generateWrapper } from "./codegen/generate-wrapper";
export { ValidationMode } from "./types";

// Re-export types for convenience
export type { HogTypedOptions, ValidationResult } from "./types";
