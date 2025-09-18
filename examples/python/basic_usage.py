"""
Example using GENERATED PostHog wrapper for Python.

First, generate your wrapper:
    python -m hogtyped generate

This creates posthog_generated.py with schemas baked in!
"""

# Import the generated wrapper - no runtime loading needed!
from posthog_generated import posthog, ValidationMode

# Already configured with embedded schemas
# No file loading, instant validation, type hints!

# Example 1: Valid event
posthog.capture(
    distinct_id="user-123",
    event="user_signed_up",
    properties={
        "userId": "user-123",
        "email": "user@example.com",
        "plan": "growth",
        "signupMethod": "google"
    }
)

# Example 2: Invalid event (will raise in STRICT mode)
try:
    posthog.capture(
        distinct_id="user-456",
        event="user_signed_up",
        properties={
            "userId": "user-456",
            "email": "not-an-email",  # Invalid email format
            "plan": "invalid-plan"     # Not in enum
        }
    )
except ValueError as e:
    print(f"Validation failed: {e}")

# Example 3: Feature usage tracking
posthog.capture(
    distinct_id="user-123",
    event="feature_used",
    properties={
        "featureName": "dashboard_export",
        "featureArea": "dashboard",
        "metadata": {
            "exportFormat": "csv",
            "rowCount": 1500
        }
    }
)

# Example 4: Purchase tracking with nested objects
posthog.capture(
    distinct_id="user-123",
    event="purchase_completed",
    properties={
        "orderId": "order-789",
        "revenue": 299.99,
        "currency": "USD",
        "products": [
            {
                "productId": "prod-1",
                "name": "Growth Plan",
                "price": 299.99,
                "quantity": 1
            }
        ]
    }
)

# Example 5: Using untyped events (fallback for gradual migration)
posthog.capture(
    distinct_id="user-123",
    event="custom_event_without_schema",
    properties={
        "anyProperty": "works",
        "nested": {"also": "works"}
    }
)

# Example 6: Other PostHog features still work
posthog.identify(
    distinct_id="user-123",
    properties={
        "email": "user@example.com",
        "name": "John Doe"
    }
)

posthog.alias(
    previous_id="anonymous-123",
    distinct_id="user-123"
)

is_enabled = posthog.feature_enabled(
    key="new-dashboard",
    distinct_id="user-123"
)
print(f"Feature enabled: {is_enabled}")

# Example 7: Validate events without sending
validation_result = posthog.validate_event(
    "user_signed_up",
    {
        "userId": "test",
        "email": "invalid"
    }
)
print(f"Is valid: {validation_result.valid}")
if not validation_result.valid:
    print(f"Errors: {validation_result.errors}")