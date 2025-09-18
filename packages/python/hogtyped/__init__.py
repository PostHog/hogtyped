"""
HogTyped - Type-safe PostHog wrapper using code generation

This package generates a custom PostHog wrapper with schemas baked in at build time.
No runtime loading, no async initialization, just pure type safety!

Usage:
1. Define your event schemas in JSON Schema format
2. Run: python -m hogtyped generate
3. Import and use your generated wrapper

Example:
    python -m hogtyped generate

    from posthog_generated import posthog

    posthog.capture(
        distinct_id="user-123",
        event="user_signed_up",
        properties={
            "userId": "123",
            "email": "user@example.com",
            "plan": "pro"
        }
    )
"""

from .codegen import generate_wrapper

__version__ = "0.1.0"
__all__ = ["generate_wrapper"]