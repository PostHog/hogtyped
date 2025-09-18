import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('CLI Tool', () => {
  const cliPath = path.join(__dirname, '../../bin/hogtyped.js');
  let tempDir: string;

  beforeEach(() => {
    // Create a temporary directory for test outputs
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hogtyped-test-'));
  });

  afterEach(() => {
    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('should show help when called without arguments', () => {
    const output = execSync(`node ${cliPath} --help`, { encoding: 'utf-8' });

    expect(output).toContain('hogtyped');
    expect(output).toContain('generate');
    expect(output).toContain('init');
  });

  test('should run init command successfully', () => {
    // Run init in temp directory
    execSync(`node ${cliPath} init`, {
      cwd: tempDir,
      encoding: 'utf-8'
    });

    // Check that schemas directory was created
    expect(fs.existsSync(path.join(tempDir, 'schemas'))).toBe(true);

    // Check that example schema was created
    expect(fs.existsSync(path.join(tempDir, 'schemas/events.schema.json'))).toBe(true);

    // Verify schema content
    const schema = JSON.parse(
      fs.readFileSync(path.join(tempDir, 'schemas/events.schema.json'), 'utf-8')
    );
    expect(schema.events).toBeDefined();
    expect(schema.events.page_viewed).toBeDefined();
  });

  test('should run generate command with default options', () => {
    // First init to create schemas
    execSync(`node ${cliPath} init`, {
      cwd: tempDir,
      encoding: 'utf-8'
    });

    // Then generate
    const output = execSync(`node ${cliPath} generate`, {
      cwd: tempDir,
      encoding: 'utf-8'
    });

    expect(output).toContain('Generated');

    // Check that generated file exists
    expect(fs.existsSync(path.join(tempDir, 'src/posthog.generated.ts'))).toBe(true);

    // Verify generated content
    const generated = fs.readFileSync(
      path.join(tempDir, 'src/posthog.generated.ts'),
      'utf-8'
    );

    expect(generated).toContain('class PostHog');
    expect(generated).toContain('page_viewed');
    expect(generated).toContain('SCHEMAS');
  });

  test('should run generate command with custom options', () => {
    // Create a custom schema
    const schemaDir = path.join(tempDir, 'custom-schemas');
    fs.mkdirSync(schemaDir, { recursive: true });

    const customSchema = {
      events: {
        custom_event: {
          type: 'object',
          properties: {
            customProp: { type: 'string' }
          }
        }
      }
    };

    fs.writeFileSync(
      path.join(schemaDir, 'custom.schema.json'),
      JSON.stringify(customSchema)
    );

    // Generate with custom options
    const outputPath = path.join(tempDir, 'analytics.ts');

    execSync(
      `node ${cliPath} generate ` +
      `--schemas "${schemaDir}/*.json" ` +
      `--output "${outputPath}" ` +
      `--class MyAnalytics ` +
      `--mode strict`,
      {
        cwd: tempDir,
        encoding: 'utf-8'
      }
    );

    // Verify custom output
    expect(fs.existsSync(outputPath)).toBe(true);

    const generated = fs.readFileSync(outputPath, 'utf-8');
    expect(generated).toContain('class MyAnalytics');
    expect(generated).toContain('custom_event');
    expect(generated).toContain('strict');
  });

  test('should handle errors gracefully', () => {
    // Test with non-existent schema path
    const result = execSync(
      `node ${cliPath} generate --schemas "./nonexistent/*.json"`,
      {
        cwd: tempDir,
        encoding: 'utf-8'
      }
    );

    // Should not crash, should generate empty wrapper
    expect(fs.existsSync(path.join(tempDir, 'src/posthog.generated.ts'))).toBe(true);
  });
});