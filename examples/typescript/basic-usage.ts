/**
 * Example using GENERATED wrapper (recommended for production)
 *
 * First run: npx hogtyped generate
 * This creates src/posthog.generated.ts with schemas baked in
 */

// Import the generated wrapper - no runtime loading needed!
import { posthog } from './posthog.generated';

// Already initialized with your API key and schemas embedded
// No async loading, no network requests, instant validation!

// Example 1: Valid event
posthog.capture("user_signed_up", {
  userId: "user-123",
  email: "user@example.com",
  plan: "growth",
  signupMethod: "google",
});

// Example 2: Invalid event (will throw in STRICT mode)
try {
  posthog.capture("user_signed_up", {
    userId: "user-456",
    email: "not-an-email", // Invalid email format
    plan: "invalid-plan", // Not in enum
  });
} catch (error) {
  console.error("Validation failed:", error);
}

// Example 3: Feature usage tracking
posthog.capture("feature_used", {
  featureName: "dashboard_export",
  featureArea: "dashboard",
  metadata: {
    exportFormat: "csv",
    rowCount: 1500,
  },
});

// Example 4: Purchase tracking with nested objects
posthog.capture("purchase_completed", {
  orderId: "order-789",
  revenue: 299.99,
  currency: "USD",
  products: [
    {
      productId: "prod-1",
      name: "Growth Plan",
      price: 299.99,
      quantity: 1,
    },
  ],
});

// Example 5: Using untyped events (fallback for gradual migration)
posthog.capture("custom_event_without_schema", {
  anyProperty: "works",
  nested: { also: "works" },
});

// Example 6: Other PostHog features still work
posthog.identify("user-123", {
  email: "user@example.com",
  name: "John Doe",
});

posthog.setPersonProperties({
  plan: "growth",
  company: "Acme Corp",
});

const isEnabled = posthog.isFeatureEnabled("new-dashboard");
console.log("Feature enabled:", isEnabled);
