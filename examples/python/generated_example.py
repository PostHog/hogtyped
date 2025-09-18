#!/usr/bin/env python3
"""
Example showcasing the GENERATED PostHog wrapper for Python.

Step 1: Generate your wrapper with embedded schemas
    python -m hogtyped generate -o analytics.py

Step 2: Use with full type hints and validation!
"""

# Import the generated wrapper - everything is embedded!
from analytics import posthog, ValidationMode

# Type hints are available if using mypy or pyright
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from analytics import UserSignedUpProperties, ButtonClickedProperties


def track_user_signup(user_id: str, email: str, plan: str) -> None:
    """
    Track user signup with full type safety.

    If using mypy/pyright, the type checker will validate:
    - Event name must be valid
    - Properties must match schema
    - Required fields must be present
    """
    # The generated wrapper has all schemas embedded
    # No network/file loading needed!
    posthog.capture(
        distinct_id=user_id,
        event="user_signed_up",  # Type hint: Literal["user_signed_up", ...]
        properties={
            "userId": user_id,
            "email": email,
            "plan": plan,  # Must be: "free" | "starter" | "pro" | "enterprise"
            "signupMethod": "email"
        }
    )


def track_button_click(button_id: str, page: str) -> None:
    """Track button clicks with validation."""
    posthog.capture(
        distinct_id="anonymous",
        event="button_clicked",
        properties={
            "buttonId": button_id,
            "page": page,
            "timestamp": 1234567890
        }
    )


def main():
    # Initialize with your API key
    posthog.__init__(api_key="YOUR_API_KEY")

    print("🐗 Python Generated Wrapper Example\n")
    print("Benefits:")
    print("  ✅ Schemas embedded at generation time")
    print("  ✅ No runtime file/network loading")
    print("  ✅ Type hints for IDE autocomplete")
    print("  ✅ Works with mypy/pyright type checking")
    print("  ✅ Instant validation\n")

    # Example 1: Valid event
    track_user_signup(
        user_id="user-123",
        email="user@example.com",
        plan="pro"
    )
    print("✅ Valid signup event sent")

    # Example 2: Invalid event (validation mode determines behavior)
    try:
        posthog.capture(
            distinct_id="user-456",
            event="user_signed_up",
            properties={
                "userId": "user-456",
                # Missing required 'email' field!
                # Invalid plan value!
                "plan": "invalid-plan"
            }
        )
    except ValueError as e:
        print(f"❌ Validation failed (STRICT mode): {e}")

    # Example 3: Feature usage
    posthog.capture(
        distinct_id="user-123",
        event="feature_used",
        properties={
            "featureName": "export_data",
            "featureArea": "dashboard",
            "metadata": {
                "format": "csv",
                "rows": 1000
            }
        }
    )
    print("📊 Feature usage tracked")

    # Example 4: Complex nested event
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
                    "name": "Pro Plan",
                    "price": 299.99,
                    "quantity": 1
                }
            ]
        }
    )
    print("💰 Purchase tracked")

    # Other PostHog features work normally
    posthog.identify(
        distinct_id="user-123",
        properties={
            "email": "user@example.com",
            "name": "Jane Doe"
        }
    )

    posthog.alias(
        previous_id="temp-user-123",
        distinct_id="user-123"
    )

    is_enabled = posthog.feature_enabled(
        key="new-dashboard",
        distinct_id="user-123"
    )
    print(f"\n🚀 Feature flag 'new-dashboard' enabled: {is_enabled}")


if __name__ == "__main__":
    main()