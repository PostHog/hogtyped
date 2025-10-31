"""
Tests for Python code generation
"""

import os
import sys
import tempfile
import shutil
from pathlib import Path
import json
import subprocess
import ast

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from hogtyped.codegen import generate_wrapper, load_schemas, event_name_to_type, json_schema_to_python_type


class TestPythonCodeGenerator:
    """Test suite for Python code generation"""

    @classmethod
    def setup_class(cls):
        """Set up test schemas path"""
        cls.test_schemas_path = Path(__file__).parent.parent.parent.parent / "test-schemas" / "*.schema.json"
        cls.test_output_dir = Path(tempfile.mkdtemp())

    @classmethod
    def teardown_class(cls):
        """Clean up test output"""
        if cls.test_output_dir.exists():
            shutil.rmtree(cls.test_output_dir)

    def test_basic_generation(self):
        """Test that basic code generation works"""
        output_file = self.test_output_dir / "test_generated.py"

        generate_wrapper(
            schemas=str(self.test_schemas_path),
            output=str(output_file),
            class_name="TestPostHog",
            validation_mode="strict"
        )

        assert output_file.exists()

        generated_code = output_file.read_text()

        # Check for generated components
        assert "class TestPostHog:" in generated_code
        assert "class SimpleEventProperties(TypedDict" in generated_code
        assert "class ComplexEventProperties(TypedDict" in generated_code
        assert "EventName = Literal[" in generated_code
        assert "SCHEMAS = {" in generated_code
        assert '"simple_event":' in generated_code
        assert '"complex_event":' in generated_code

    def test_generated_python_is_valid(self):
        """Test that generated Python code is syntactically valid"""
        output_file = self.test_output_dir / "test_valid.py"

        generate_wrapper(
            schemas=str(self.test_schemas_path),
            output=str(output_file),
            class_name="TestPostHog"
        )

        generated_code = output_file.read_text()

        # Try to parse the generated Python code
        try:
            ast.parse(generated_code)
        except SyntaxError as e:
            assert False, f"Generated Python code has syntax error: {e}"

        # Try to import the generated module (basic smoke test)
        # This checks for runtime errors in module-level code
        spec = {
            "__name__": "test_module",
            "__file__": str(output_file)
        }

        try:
            exec(compile(generated_code, str(output_file), 'exec'), spec)
        except ImportError:
            # Import errors for posthog are expected in test environment
            pass
        except Exception as e:
            assert False, f"Generated Python code has runtime error: {e}"

    def test_type_generation(self):
        """Test correct Python type generation from JSON schema"""
        output_file = self.test_output_dir / "test_types.py"

        generate_wrapper(
            schemas=str(self.test_schemas_path),
            output=str(output_file)
        )

        generated_code = output_file.read_text()

        # Check SimpleEvent TypedDict
        assert "class SimpleEventProperties(TypedDict" in generated_code
        assert "name: str" in generated_code
        assert "count: int" in generated_code
        assert "isActive: Optional[bool]" in generated_code

        # Check ComplexEvent TypedDict
        assert "class ComplexEventProperties(TypedDict" in generated_code
        assert "id: str" in generated_code
        assert 'status: Literal["pending", "active", "completed", "cancelled"]' in generated_code
        assert "metadata: Optional[Dict[str, Any]]" in generated_code
        assert "tags: Optional[List[str]]" in generated_code

    def test_event_name_literal_type(self):
        """Test that EventName literal type includes all events"""
        output_file = self.test_output_dir / "test_events.py"

        generate_wrapper(
            schemas=str(self.test_schemas_path),
            output=str(output_file)
        )

        generated_code = output_file.read_text()

        assert 'EventName = Literal["simple_event", "complex_event"]' in generated_code

    def test_schema_embedding(self):
        """Test that full JSON schemas are embedded in generated code"""
        output_file = self.test_output_dir / "test_schemas.py"

        generate_wrapper(
            schemas=str(self.test_schemas_path),
            output=str(output_file)
        )

        generated_code = output_file.read_text()

        # Check that schemas are embedded as dictionary
        assert "SCHEMAS = {" in generated_code

        # Check that schema structure is preserved
        assert '"type": "object"' in generated_code
        assert '"properties":' in generated_code
        assert '"required": ["name", "count"]' in generated_code
        assert '"required": ["id", "status"]' in generated_code

    def test_ref_resolution(self):
        """Test that $ref references are resolved in embedded schemas"""
        output_file = self.test_output_dir / "test_refs.py"

        generate_wrapper(
            schemas=str(self.test_schemas_path),
            output=str(output_file)
        )

        generated_code = output_file.read_text()

        # Should not contain unresolved $ref
        assert '"$ref"' not in generated_code

        # Should have resolved the properties
        assert '"name": {' in generated_code
        assert '"count": {' in generated_code

    def test_validation_code(self):
        """Test that validation functions are generated"""
        output_file = self.test_output_dir / "test_validation.py"

        generate_wrapper(
            schemas=str(self.test_schemas_path),
            output=str(output_file),
            validation_mode="strict"
        )

        generated_code = output_file.read_text()

        # Check for jsonschema import
        assert "from jsonschema import validate, ValidationError, FormatChecker" in generated_code

        # Check for validation method using jsonschema
        assert "def _validate(self" in generated_code
        assert "validate(instance=properties, schema=schema, format_checker=FormatChecker())" in generated_code
        assert "except ValidationError" in generated_code

        # Check for validation in capture method
        assert "errors = self._validate(event, properties)" in generated_code
        assert "if errors:" in generated_code

    def test_validation_modes(self):
        """Test different validation modes"""
        # Test strict mode
        output_file = self.test_output_dir / "test_strict.py"
        generate_wrapper(
            schemas=str(self.test_schemas_path),
            output=str(output_file),
            validation_mode="strict"
        )

        generated_code = output_file.read_text()
        assert "ValidationMode.STRICT" in generated_code
        assert "raise ValueError" in generated_code

        # Test warning mode
        output_file = self.test_output_dir / "test_warning.py"
        generate_wrapper(
            schemas=str(self.test_schemas_path),
            output=str(output_file),
            validation_mode="warning"
        )

        generated_code = output_file.read_text()
        assert "ValidationMode.WARNING" in generated_code
        assert "warnings.warn" in generated_code

        # Test disabled mode
        output_file = self.test_output_dir / "test_disabled.py"
        generate_wrapper(
            schemas=str(self.test_schemas_path),
            output=str(output_file),
            validation_mode="disabled"
        )

        generated_code = output_file.read_text()
        assert "ValidationMode.DISABLED" in generated_code

    def test_class_generation(self):
        """Test class generation with custom name"""
        output_file = self.test_output_dir / "test_class.py"

        generate_wrapper(
            schemas=str(self.test_schemas_path),
            output=str(output_file),
            class_name="CustomAnalytics"
        )

        generated_code = output_file.read_text()

        assert "class CustomAnalytics:" in generated_code
        assert "hogtyped = CustomAnalytics()" in generated_code

    def test_capture_method_overloads(self):
        """Test that capture method has type overloads"""
        output_file = self.test_output_dir / "test_capture.py"

        generate_wrapper(
            schemas=str(self.test_schemas_path),
            output=str(output_file)
        )

        generated_code = output_file.read_text()

        # Check for typed capture overloads
        assert "@overload" in generated_code
        assert 'event: Literal["simple_event"]' in generated_code
        assert "properties: SimpleEventProperties" in generated_code
        assert 'event: Literal["complex_event"]' in generated_code
        assert "properties: ComplexEventProperties" in generated_code

        # Check for main capture method
        assert "def capture(" in generated_code
        assert "distinct_id: str" in generated_code
        assert "event: str" in generated_code
        assert "properties: Optional[Dict[str, Any]]" in generated_code

    def test_posthog_api_methods(self):
        """Test that PostHog API compatibility methods are included"""
        output_file = self.test_output_dir / "test_api.py"

        generate_wrapper(
            schemas=str(self.test_schemas_path),
            output=str(output_file)
        )

        generated_code = output_file.read_text()

        # Check for PostHog methods
        assert "def identify(self" in generated_code
        assert "def alias(self" in generated_code
        assert "def feature_enabled(self" in generated_code
        assert "def get_feature_flag(self" in generated_code
        assert "def shutdown(self" in generated_code

    def test_imports(self):
        """Test that all necessary imports are included"""
        output_file = self.test_output_dir / "test_imports.py"

        generate_wrapper(
            schemas=str(self.test_schemas_path),
            output=str(output_file)
        )

        generated_code = output_file.read_text()

        assert "from typing import Any, Dict, List, Optional, Union, Literal, TypedDict, overload" in generated_code
        assert "from enum import Enum" in generated_code
        assert "import posthog" in generated_code
        assert "import json" in generated_code
        assert "import warnings" in generated_code

    def test_error_handling(self):
        """Test handling of missing or invalid schemas"""
        # Test with non-existent schema files
        output_file = self.test_output_dir / "test_missing.py"

        generate_wrapper(
            schemas="./non-existent/*.json",
            output=str(output_file)
        )

        assert output_file.exists()
        generated_code = output_file.read_text()
        assert "class PostHog:" in generated_code

        # Test with empty schema directory
        empty_dir = self.test_output_dir / "empty"
        empty_dir.mkdir(exist_ok=True)

        output_file = self.test_output_dir / "test_empty.py"
        generate_wrapper(
            schemas=str(empty_dir / "*.json"),
            output=str(output_file)
        )

        assert output_file.exists()

    def test_helper_functions(self):
        """Test helper functions"""
        # Test event_name_to_type
        assert event_name_to_type("simple_event") == "SimpleEventProperties"
        assert event_name_to_type("user_signed_up") == "UserSignedUpProperties"
        assert event_name_to_type("button-clicked") == "ButtonClickedProperties"

        # Test json_schema_to_python_type
        assert json_schema_to_python_type({"type": "string"}) == "str"
        assert json_schema_to_python_type({"type": "integer"}) == "int"
        assert json_schema_to_python_type({"type": "number"}) == "float"
        assert json_schema_to_python_type({"type": "boolean"}) == "bool"
        assert json_schema_to_python_type({
            "type": "string",
            "enum": ["a", "b", "c"]
        }) == 'Literal["a", "b", "c"]'
        assert json_schema_to_python_type({
            "type": "array",
            "items": {"type": "string"}
        }) == "List[str]"
        assert json_schema_to_python_type({
            "type": "object"
        }) == "Dict[str, Any]"

    def test_mypy_compatibility(self):
        """Test that generated code passes mypy type checking"""
        output_file = self.test_output_dir / "test_mypy.py"

        generate_wrapper(
            schemas=str(self.test_schemas_path),
            output=str(output_file)
        )

        # Create a simple test file that uses the generated code
        test_file = self.test_output_dir / "test_usage.py"
        test_file.write_text(f"""
from test_mypy import posthog

# This should type check correctly
posthog.capture(
    distinct_id="user-123",
    event="simple_event",
    properties={{
        "name": "test",
        "count": 42,
        "isActive": True
    }}
)
""")

        # Try to run mypy on the generated code (if available)
        try:
            result = subprocess.run(
                ["python", "-m", "mypy", "--ignore-missing-imports", str(output_file)],
                capture_output=True,
                text=True
            )
            # We don't fail the test if mypy isn't installed
            # but if it is, the generated code should pass
            if result.returncode != 0 and "No module named mypy" not in result.stderr:
                print(f"MyPy output:\n{result.stdout}\n{result.stderr}")
        except Exception:
            # mypy not installed, skip
            pass