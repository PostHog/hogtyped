"""
Tests for Python CLI
"""

import os
import sys
import tempfile
import shutil
import subprocess
import json
from pathlib import Path


class TestPythonCLI:
    """Test suite for Python CLI"""

    @classmethod
    def setup_class(cls):
        """Set up test environment"""
        cls.test_output_dir = Path(tempfile.mkdtemp())

    @classmethod
    def teardown_class(cls):
        """Clean up test output"""
        if cls.test_output_dir.exists():
            shutil.rmtree(cls.test_output_dir)

    def test_cli_help(self):
        """Test that CLI shows help"""
        result = subprocess.run(
            [sys.executable, "-m", "hogtyped", "--help"],
            capture_output=True,
            text=True
        )

        assert result.returncode == 0
        assert "hogtyped" in result.stdout
        assert "generate" in result.stdout
        assert "init" in result.stdout

    def test_init_command(self):
        """Test init command creates example schema"""
        result = subprocess.run(
            [sys.executable, "-m", "hogtyped", "init"],
            cwd=str(self.test_output_dir),
            capture_output=True,
            text=True
        )

        # Check that schemas directory was created
        schemas_dir = self.test_output_dir / "schemas"
        assert schemas_dir.exists()

        # Check that example schema was created
        schema_file = schemas_dir / "events.schema.json"
        assert schema_file.exists()

        # Verify schema content
        with open(schema_file) as f:
            schema = json.load(f)

        assert "events" in schema
        assert "page_viewed" in schema["events"]

    def test_generate_command_default(self):
        """Test generate command with default options"""
        # First init to create schemas
        subprocess.run(
            [sys.executable, "-m", "hogtyped", "init"],
            cwd=str(self.test_output_dir),
            capture_output=True
        )

        # Then generate
        result = subprocess.run(
            [sys.executable, "-m", "hogtyped", "generate"],
            cwd=str(self.test_output_dir),
            capture_output=True,
            text=True
        )

        assert "Generated" in result.stdout

        # Check that generated file exists
        generated_file = self.test_output_dir / "posthog_generated.py"
        assert generated_file.exists()

        # Verify generated content
        generated_code = generated_file.read_text()
        assert "class PostHog:" in generated_code
        assert "page_viewed" in generated_code
        assert "SCHEMAS = {" in generated_code

    def test_generate_command_custom_options(self):
        """Test generate command with custom options"""
        # Create a custom schema
        schema_dir = self.test_output_dir / "custom-schemas"
        schema_dir.mkdir(exist_ok=True)

        custom_schema = {
            "events": {
                "custom_event": {
                    "type": "object",
                    "properties": {
                        "customProp": {"type": "string"}
                    }
                }
            }
        }

        schema_file = schema_dir / "custom.schema.json"
        with open(schema_file, "w") as f:
            json.dump(custom_schema, f)

        # Generate with custom options
        output_file = self.test_output_dir / "analytics.py"

        result = subprocess.run(
            [
                sys.executable, "-m", "hogtyped", "generate",
                "--schemas", str(schema_dir / "*.json"),
                "--output", str(output_file),
                "--class-name", "MyAnalytics",
                "--mode", "strict"
            ],
            cwd=str(self.test_output_dir),
            capture_output=True,
            text=True
        )

        # Verify custom output
        assert output_file.exists()

        generated_code = output_file.read_text()
        assert "class MyAnalytics:" in generated_code
        assert "custom_event" in generated_code
        assert "ValidationMode.STRICT" in generated_code

    def test_generate_with_missing_schemas(self):
        """Test generate command handles missing schemas gracefully"""
        result = subprocess.run(
            [
                sys.executable, "-m", "hogtyped", "generate",
                "--schemas", "./nonexistent/*.json"
            ],
            cwd=str(self.test_output_dir),
            capture_output=True,
            text=True
        )

        # Should not crash, should generate file
        generated_file = self.test_output_dir / "posthog_generated.py"
        assert generated_file.exists()

    def test_generated_code_imports(self):
        """Test that generated code can be imported"""
        # Generate code
        subprocess.run(
            [sys.executable, "-m", "hogtyped", "init"],
            cwd=str(self.test_output_dir),
            capture_output=True
        )

        subprocess.run(
            [sys.executable, "-m", "hogtyped", "generate"],
            cwd=str(self.test_output_dir),
            capture_output=True
        )

        # Try to import the generated module
        import sys
        sys.path.insert(0, str(self.test_output_dir))

        try:
            # This will fail on posthog import but should parse correctly
            import posthog_generated
        except ImportError as e:
            # Only posthog import errors are expected
            if "posthog" not in str(e):
                raise