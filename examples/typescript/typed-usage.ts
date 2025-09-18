/**
 * This example demonstrates the full type-safe experience with the GENERATED wrapper
 *
 * Step 1: Generate your wrapper
 * ```bash
 * npx hogtyped generate
 * ```
 *
 * Step 2: Import and use with full type safety!
 */

// This import gives you EVERYTHING:
// - Full TypeScript types
// - Embedded schemas (no loading!)
// - Autocomplete for events and properties
// - Compile-time validation
import { posthog } from './posthog.generated';

// ✅ GOOD: TypeScript knows about this event and its properties
posthog.capture('user_signed_up', {
  userId: 'user-123',
  email: 'user@example.com',
  plan: 'growth',        // ← Autocompletes: 'free' | 'starter' | 'growth' | 'enterprise'
  signupMethod: 'google' // ← Autocompletes: 'email' | 'google' | 'github' | 'saml'
});

// ❌ TypeScript Error: Missing required property 'email'
posthog.capture('user_signed_up', {
  userId: 'user-456',
  plan: 'growth'
  // TypeScript error: Property 'email' is missing
});

// ❌ TypeScript Error: Invalid enum value
posthog.capture('user_signed_up', {
  userId: 'user-789',
  email: 'test@example.com',
  plan: 'invalid' // TypeScript error: Type '"invalid"' is not assignable to type '"free" | "starter" | "growth" | "enterprise"'
});

// ✅ GOOD: Complex nested properties with full typing
posthog.capture('purchase_completed', {
  orderId: 'order-123',
  revenue: 299.99,
  currency: 'USD',
  products: [
    {
      productId: 'prod-1',
      name: 'Growth Plan',
      price: 299.99,
      quantity: 1
    }
  ]
});

// ❌ TypeScript Error: Wrong property types
posthog.capture('purchase_completed', {
  orderId: 'order-456',
  revenue: '299.99',    // TypeScript error: Type 'string' is not assignable to type 'number'
  currency: 'US',       // TypeScript error: String must be exactly 3 characters
  products: []
});

// ✅ GOOD: Feature usage with optional metadata
posthog.capture('feature_used', {
  featureName: 'export_dashboard',
  featureArea: 'dashboard',
  metadata: {            // ← Optional property
    format: 'pdf',
    pages: 5
  }
});

// ✅ GOOD: Can still use untyped events for gradual migration
posthog.capture('custom_untyped_event', {
  anything: 'goes',
  nested: {
    also: 'works'
  }
});

/**
 * IDE Features You Get:
 *
 * 1. Event Name Autocomplete:
 *    When you type: posthog.capture('
 *    IDE suggests: 'user_signed_up', 'feature_used', 'purchase_completed', etc.
 *
 * 2. Property Autocomplete:
 *    When you type: posthog.capture('user_signed_up', {
 *    IDE suggests: userId, email, plan, signupMethod
 *
 * 3. Inline Documentation:
 *    Hover over properties to see their types and descriptions
 *
 * 4. Compile-Time Validation:
 *    TypeScript catches errors before runtime
 *
 * 5. Refactoring Support:
 *    Rename properties in schema → TypeScript updates all usages
 */

// You can also validate without sending
const result = posthog.validateEvent('user_signed_up', {
  userId: '123',
  email: 'invalid-email',
  plan: 'growth'
});

if (!result.valid) {
  console.log('Validation errors:', result.errors);
}