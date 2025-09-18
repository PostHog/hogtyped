#!/usr/bin/env python3
"""
Code generator for HogTyped Python wrapper.
Generates a Python module with embedded schemas and type hints.
"""

import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional
from datetime import datetime
import glob as glob_module


def generate_wrapper(
    schemas: str,
    output: str = "./posthog_generated.py",
    class_name: str = "PostHog",
    validation_mode: str = "warning"
) -> None:
    """
    Generate a Python wrapper with embedded schemas and type hints.

    Args:
        schemas: Glob pattern for schema files
        output: Output file path
        class_name: Name of the generated class
        validation_mode: Default validation mode (strict/warning/disabled)
    """

    # Load and process schemas
    schema_data = load_schemas(schemas)

    # Generate Python code
    code = generate_python_code(schema_data, class_name, validation_mode)

    # Ensure output directory exists
    output_path = Path(output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Write the generated file
    output_path.write_text(code)

    print(f"✅ Generated {class_name} wrapper at {output}")
    print(f"   - {len(schema_data)} events with full type hints")
    print(f"   - Zero runtime schema loading")
    print(f"   - Type checking with mypy/pyright")


def load_schemas(pattern: str) -> List[Dict[str, Any]]:
    """Load and process JSON schema files."""
    schema_files = sorted(glob_module.glob(pattern, recursive=True))
    schemas = []

    for file_path in schema_files:
        with open(file_path, 'r') as f:
            content = json.load(f)

        if 'events' in content:
            for event_name, event_schema in content['events'].items():
                resolved = resolve_refs(event_schema, content, file_path)
                schemas.append({
                    'event_name': event_name,
                    'type_name': event_name_to_type(event_name),
                    'schema': resolved,
                    'properties': resolved.get('properties', {}),
                    'required': resolved.get('required', [])
                })

    # Sort schemas by event name in reverse for consistent output (matches test expectation)
    return sorted(schemas, key=lambda x: x['event_name'], reverse=True)


def resolve_refs(schema: Any, root_schema: Dict, file_path: str) -> Any:
    """Resolve JSON Schema $ref references."""
    if not schema:
        return schema

    if isinstance(schema, dict):
        if '$ref' in schema:
            ref = schema['$ref']

            if ref.startswith('#/'):
                # Internal reference
                ref_path = ref[2:].split('/')
                resolved = root_schema
                for part in ref_path:
                    resolved = resolved.get(part)
                    if resolved is None:
                        break
                return resolve_refs(resolved, root_schema, file_path)

            elif ref.startswith('./'):
                # External file reference
                ref_parts = ref.split('#')
                ref_file = Path(file_path).parent / ref_parts[0]

                with open(ref_file, 'r') as f:
                    ref_content = json.load(f)

                if len(ref_parts) > 1 and ref_parts[1]:
                    ref_fragment = ref_parts[1][1:].split('/')
                    resolved = ref_content
                    for part in ref_fragment:
                        resolved = resolved.get(part)
                    return resolve_refs(resolved, ref_content, str(ref_file))

                return ref_content

        elif 'allOf' in schema:
            # Merge allOf schemas
            merged = {'type': 'object', 'properties': {}, 'required': []}

            for sub_schema in schema['allOf']:
                resolved = resolve_refs(sub_schema, root_schema, file_path)

                if isinstance(resolved, dict):
                    merged['properties'].update(resolved.get('properties', {}))
                    merged['required'].extend(resolved.get('required', []))

                    if 'additionalProperties' in resolved:
                        merged['additionalProperties'] = resolved['additionalProperties']

            merged['required'] = list(set(merged['required']))
            return merged

        else:
            # Recursively resolve nested schemas
            return {k: resolve_refs(v, root_schema, file_path) for k, v in schema.items()}

    elif isinstance(schema, list):
        return [resolve_refs(item, root_schema, file_path) for item in schema]

    return schema


def event_name_to_type(event_name: str) -> str:
    """Convert event name to Python type name."""
    parts = event_name.replace('-', '_').split('_')
    return ''.join(word.capitalize() for word in parts) + 'Properties'


def json_schema_to_python_type(schema: Any) -> str:
    """Convert JSON schema type to Python type hint."""
    if not schema:
        return 'Any'

    schema_type = schema.get('type')

    if schema_type == 'string':
        if schema.get('enum'):
            return 'Literal[' + ', '.join(f'"{v}"' for v in schema['enum']) + ']'
        return 'str'

    elif schema_type == 'number':
        return 'float'

    elif schema_type == 'integer':
        return 'int'

    elif schema_type == 'boolean':
        return 'bool'

    elif schema_type == 'array':
        items_type = json_schema_to_python_type(schema.get('items', {}))
        return f'List[{items_type}]'

    elif schema_type == 'object':
        if schema.get('additionalProperties'):
            return 'Dict[str, Any]'

        if schema.get('properties'):
            # For complex objects, use Dict for now
            # Could generate TypedDict for better typing
            return 'Dict[str, Any]'

        return 'Dict[str, Any]'

    return 'Any'


def json_to_python_literal(obj):
    """Convert JSON object to Python literal string."""
    import json
    import re
    # Convert to JSON string then replace JSON literals with Python literals
    json_str = json.dumps(obj, indent=8)
    json_str = json_str.replace('true', 'True')
    json_str = json_str.replace('false', 'False')
    json_str = json_str.replace('null', 'None')

    # Keep simple arrays on single lines for readability
    # This regex collapses arrays that don't contain nested structures
    json_str = re.sub(r'\[\s+([^\[\{\]]+?)\s+\]',
                      lambda m: '[' + re.sub(r'\s+', ' ', m.group(1)).strip() + ']',
                      json_str, flags=re.DOTALL)

    return json_str


def generate_python_code(schemas: List[Dict], class_name: str, validation_mode: str) -> str:
    """Generate the complete Python module code."""

    # Generate imports
    imports = """# Auto-generated PostHog wrapper with embedded schemas
# Generated at: {timestamp}
# DO NOT EDIT - This file is auto-generated

from typing import Any, Dict, List, Optional, Union, Literal, TypedDict, overload
from enum import Enum
import posthog
import json
import warnings


class ValidationMode(Enum):
    STRICT = "strict"
    WARNING = "warning"
    DISABLED = "disabled"


""".format(timestamp=datetime.now().isoformat())

    # Generate TypedDict classes for each event
    typed_dicts = "# ============ Event Types ============\n\n"

    for schema in schemas:
        typed_dicts += f"class {schema['type_name']}(TypedDict"

        # Add total=False if not all properties are required
        has_optional = len(schema['properties']) > len(schema['required'])
        if has_optional:
            typed_dicts += ", total=False"

        typed_dicts += "):\n"

        if not schema['properties']:
            typed_dicts += "    pass\n\n"
            continue

        for prop_name, prop_schema in schema['properties'].items():
            is_required = prop_name in schema['required']
            prop_type = json_schema_to_python_type(prop_schema)

            description = prop_schema.get('description', '')
            if description:
                typed_dicts += f'    """{description}"""\n'

            if not is_required:
                prop_type = f"Optional[{prop_type}]"

            typed_dicts += f"    {prop_name}: {prop_type}\n"

        typed_dicts += "\n"

    # Generate event name type
    event_names = [f'"{s["event_name"]}"' for s in schemas]
    typed_dicts += f"EventName = Literal[{', '.join(event_names)}]\n\n"

    # Generate embedded schemas
    schemas_const = "# ============ Embedded Schemas ============\n\nSCHEMAS = {\n"

    for schema in schemas:
        schemas_const += f'    "{schema["event_name"]}": {json_to_python_literal(schema["schema"])[:-1]}    }},\n'

    schemas_const += "}\n\n"

    # Generate the wrapper class
    wrapper_class = f'''# ============ Type-Safe Wrapper ============

class {class_name}:
    """
    Auto-generated PostHog wrapper with embedded schemas and type hints.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        host: str = "https://app.posthog.com",
        validation_mode: ValidationMode = ValidationMode.{validation_mode.upper()},
        **kwargs
    ):
        self.validation_mode = validation_mode

        if api_key:
            posthog.project_api_key = api_key
            posthog.host = host

        # Validators are embedded - no runtime loading needed!
        self.schemas = SCHEMAS

    def _validate(self, event_name: str, properties: Dict[str, Any]) -> Optional[List[str]]:
        """Validate event properties against schema."""
        if self.validation_mode == ValidationMode.DISABLED:
            return None

        schema = self.schemas.get(event_name)
        if not schema:
            return None

        errors = []

        # Check required fields
        for field in schema.get('required', []):
            if field not in properties:
                errors.append(f"Missing required field: {{field}}")

        # Basic type validation (extend as needed)
        for field, value in properties.items():
            if field in schema.get('properties', {{}}):
                prop_schema = schema['properties'][field]

                # Check enum values
                if 'enum' in prop_schema and value not in prop_schema['enum']:
                    errors.append(f"Invalid enum value for {{field}}: {{value}}")

        return errors if errors else None
'''

    # Generate overloaded capture methods for type safety
    capture_methods = ""

    for schema in schemas:
        capture_methods += f'''
    @overload
    def capture(
        self,
        distinct_id: str,
        event: Literal["{schema['event_name']}"],
        properties: {schema['type_name']},
        **kwargs
    ) -> None: ...
'''

    capture_methods += f'''
    def capture(
        self,
        distinct_id: str,
        event: str,
        properties: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> None:
        """
        Capture an event with type-safe properties.
        """
        properties = properties or {{}}

        # Validate if schema exists
        errors = self._validate(event, properties)

        if errors:
            error_msg = f"Validation failed for event '{{event}}': {{errors}}"

            if self.validation_mode == ValidationMode.STRICT:
                raise ValueError(error_msg)
            elif self.validation_mode == ValidationMode.WARNING:
                warnings.warn(error_msg)

                # Send validation warning event
                posthog.capture(
                    distinct_id=distinct_id,
                    event="$schema_validation_warning",
                    properties={{
                        "event": event,
                        "errors": errors,
                        "properties": properties
                    }}
                )

        # Send the event
        posthog.capture(
            distinct_id=distinct_id,
            event=event,
            properties=properties,
            **kwargs
        )

    def identify(self, distinct_id: str, properties: Optional[Dict[str, Any]] = None, **kwargs) -> None:
        """Identify a user."""
        posthog.identify(distinct_id=distinct_id, properties=properties, **kwargs)

    def alias(self, previous_id: str, distinct_id: str, **kwargs) -> None:
        """Create an alias for a user."""
        posthog.alias(previous_id=previous_id, distinct_id=distinct_id, **kwargs)

    def feature_enabled(self, key: str, distinct_id: str, **kwargs) -> bool:
        """Check if a feature flag is enabled."""
        return posthog.feature_enabled(key=key, distinct_id=distinct_id, **kwargs)

    def get_feature_flag(self, key: str, distinct_id: str, **kwargs) -> Any:
        """Get feature flag value."""
        return posthog.get_feature_flag(key=key, distinct_id=distinct_id, **kwargs)

    def shutdown(self) -> None:
        """Shutdown the PostHog client."""
        posthog.shutdown()


# Create singleton instance with consistent name to avoid collisions
hogtyped = {class_name}()
'''

    return imports + typed_dicts + schemas_const + wrapper_class + capture_methods


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Generate PostHog wrapper with embedded schemas")
    parser.add_argument("-s", "--schemas", default="./schemas/*.schema.json", help="Schema file pattern")
    parser.add_argument("-o", "--output", default="./posthog_generated.py", help="Output file path")
    parser.add_argument("-c", "--class-name", default="PostHog", help="Generated class name")
    parser.add_argument("-m", "--mode", default="warning", choices=["strict", "warning", "disabled"],
                       help="Default validation mode")

    args = parser.parse_args()

    generate_wrapper(
        schemas=args.schemas,
        output=args.output,
        class_name=args.class_name,
        validation_mode=args.mode
    )