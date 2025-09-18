# Python Examples with Generated Wrapper

These examples show how to use HogTyped's **code generation approach** for Python, where schemas are baked into your code at build time.

## Quick Start

```bash
# 1. Install HogTyped
pip install hogtyped

# 2. Create your schemas
mkdir schemas
# Add event definitions to schemas/events.schema.json

# 3. Generate your wrapper
python -m hogtyped generate

# 4. Use with type hints!
from posthog_generated import posthog

posthog.capture(
    distinct_id="user-123",
    event="button_clicked",  # Type hints available!
    properties={...}
)
```

## Benefits of Generated Approach

### ✅ No Runtime Loading
- Schemas are embedded in the generated Python file
- No file system access needed
- No network requests
- Works in serverless environments

### ✅ Type Hints Support
```python
# With mypy or pyright, you get:
# - Event name validation
# - Property type checking
# - Required field enforcement

from analytics import posthog, UserSignedUpProperties

def track_signup(props: UserSignedUpProperties):
    posthog.capture(
        distinct_id="user-123",
        event="user_signed_up",
        properties=props  # Type checked!
    )
```

### ✅ Instant Validation
- Validators are embedded and ready
- No schema parsing at runtime
- Immediate feedback on invalid events

## Generated File Structure

Running `python -m hogtyped generate` creates:

```python
# posthog_generated.py

# TypedDict classes for each event
class UserSignedUpProperties(TypedDict):
    userId: str
    email: str
    plan: Literal["free", "pro", "enterprise"]
    ...

# Embedded schemas (no loading!)
SCHEMAS = {
    "user_signed_up": {...},
    "button_clicked": {...}
}

# Type-safe wrapper class
class PostHog:
    @overload
    def capture(self, event: Literal["user_signed_up"], properties: UserSignedUpProperties): ...

    def capture(self, event: str, properties: dict): ...

# Ready-to-use instance
posthog = PostHog()
```

## CLI Commands

```bash
# Initialize with example schema
python -m hogtyped init

# Generate with defaults
python -m hogtyped generate

# Custom options
python -m hogtyped generate \
    --schemas "./schemas/**/*.json" \
    --output "./lib/analytics.py" \
    --class-name "Analytics" \
    --mode "strict"
```

## Integration Examples

### Django

```python
# myapp/analytics.py (generated)
python -m hogtyped generate -o myapp/analytics.py

# views.py
from myapp.analytics import posthog

def signup_view(request):
    posthog.capture(
        distinct_id=request.user.id,
        event="user_signed_up",
        properties={
            "userId": request.user.id,
            "email": request.user.email,
            "plan": request.user.plan
        }
    )
```

### FastAPI

```python
# Generate wrapper
python -m hogtyped generate -o app/analytics.py

# main.py
from app.analytics import posthog
from fastapi import FastAPI

app = FastAPI()

@app.post("/track")
async def track_event(event: str, properties: dict):
    posthog.capture(
        distinct_id="api-user",
        event=event,
        properties=properties
    )
    return {"status": "tracked"}
```

### Flask

```python
from flask import Flask, request
from analytics import posthog  # Generated file

app = Flask(__name__)

@app.before_request
def track_request():
    posthog.capture(
        distinct_id=request.remote_addr,
        event="page_viewed",
        properties={
            "url": request.url,
            "method": request.method
        }
    )
```

## Type Checking with mypy

```bash
# Install mypy
pip install mypy

# Type check your code
mypy your_app.py

# mypy will validate:
# - Event names are valid
# - Properties match schemas
# - Required fields are present
```

## Development Workflow

1. **Define schemas** in JSON Schema format
2. **Generate wrapper** as part of build process
3. **Import and use** with confidence
4. **Type check** with mypy/pyright (optional)

## Production Tips

### Add to Build Process
```makefile
# Makefile
generate:
    python -m hogtyped generate

build: generate
    # Your build steps
```

### Git Strategy
```gitignore
# .gitignore
# Commit schemas, not generated code
posthog_generated.py
analytics.py
*_generated.py
```

### Docker
```dockerfile
# Generate during build
RUN python -m hogtyped generate
```

## Files in This Example

- `basic_usage.py` - Simple usage examples
- `generated_example.py` - Complete example with type hints
- `schemas/` - Example event schemas

Run any example:
```bash
python basic_usage.py
python generated_example.py
```