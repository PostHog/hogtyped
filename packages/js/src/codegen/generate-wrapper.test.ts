import * as fs from 'fs';
import * as path from 'path';
import { generateWrapper } from './generate-wrapper';
import { execSync } from 'child_process';

describe('TypeScript Code Generator', () => {
  const testSchemasPath = path.join(__dirname, '../../../../test-schemas/*.schema.json');
  const outputDir = path.join(__dirname, '../../test-output');
  const outputFile = path.join(outputDir, 'test.generated.ts');

  beforeAll(() => {
    // Create test output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up test output
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
    }
  });

  describe('Basic Generation', () => {
    test('should generate TypeScript wrapper with embedded schemas', async () => {
      await generateWrapper({
        schemas: testSchemasPath,
        output: outputFile,
        className: 'TestPostHog',
        validationMode: 'strict'
      });

      expect(fs.existsSync(outputFile)).toBe(true);

      const generatedCode = fs.readFileSync(outputFile, 'utf-8');

      // Check for generated components
      expect(generatedCode).toContain('class TestPostHog');
      expect(generatedCode).toContain('export interface SimpleEventProperties');
      expect(generatedCode).toContain('export interface ComplexEventProperties');
      expect(generatedCode).toContain('export interface EventMap');
      expect(generatedCode).toContain('const SCHEMAS = {');
      expect(generatedCode).toContain('"simple_event":');
      expect(generatedCode).toContain('"complex_event":');
    });

    test('should generate valid TypeScript that compiles', async () => {
      await generateWrapper({
        schemas: testSchemasPath,
        output: outputFile,
        className: 'TestPostHog'
      });

      // Try to compile the generated TypeScript
      const tsConfig = {
        compilerOptions: {
          target: 'ES2020',
          module: 'commonjs',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          noEmit: true,
          moduleResolution: 'node'
        },
        include: ['*.ts']
      };

      const tsConfigPath = path.join(outputDir, 'tsconfig.test.json');
      fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2));

      // This will throw if TypeScript compilation fails
      try {
        execSync(`npx tsc -p ${tsConfigPath}`, {
          cwd: outputDir,
          stdio: 'pipe'
        });
      } catch (error: any) {
        // If it fails, show the actual TypeScript error for debugging
        console.error('TypeScript compilation error:', error.stderr?.toString() || error.stdout?.toString());
        throw error;
      }
    });
  });

  describe('Type Generation', () => {
    test('should generate correct TypeScript types from JSON schema', async () => {
      await generateWrapper({
        schemas: testSchemasPath,
        output: outputFile
      });

      const generatedCode = fs.readFileSync(outputFile, 'utf-8');

      // Check SimpleEvent interface
      expect(generatedCode).toMatch(/export interface SimpleEventProperties \{[\s\S]*?name: string;/);
      expect(generatedCode).toMatch(/export interface SimpleEventProperties \{[\s\S]*?count: number;/);
      expect(generatedCode).toMatch(/export interface SimpleEventProperties \{[\s\S]*?isActive\?: boolean;/);

      // Check ComplexEvent interface
      expect(generatedCode).toMatch(/export interface ComplexEventProperties \{[\s\S]*?id: string;/);
      expect(generatedCode).toMatch(/export interface ComplexEventProperties \{[\s\S]*?status: 'pending' \| 'active' \| 'completed' \| 'cancelled';/);
      expect(generatedCode).toMatch(/export interface ComplexEventProperties \{[\s\S]*?metadata\?: Record<string, any>;/);
      expect(generatedCode).toMatch(/export interface ComplexEventProperties \{[\s\S]*?tags\?: string\[\];/);
    });

    test('should generate EventMap with all events', async () => {
      await generateWrapper({
        schemas: testSchemasPath,
        output: outputFile
      });

      const generatedCode = fs.readFileSync(outputFile, 'utf-8');

      expect(generatedCode).toContain("'simple_event': SimpleEventProperties;");
      expect(generatedCode).toContain("'complex_event': ComplexEventProperties;");
      expect(generatedCode).toContain("export type EventName = keyof EventMap;");
    });
  });

  describe('Schema Embedding', () => {
    test('should embed full JSON schemas in generated code', async () => {
      await generateWrapper({
        schemas: testSchemasPath,
        output: outputFile
      });

      const generatedCode = fs.readFileSync(outputFile, 'utf-8');

      // Check that schemas are embedded as constants
      expect(generatedCode).toContain('const SCHEMAS = {');

      // Check that schema structure is preserved
      expect(generatedCode).toContain('"type": "object"');
      expect(generatedCode).toContain('"properties":');
      expect(generatedCode).toContain('"required": ["name", "count"]');
      expect(generatedCode).toContain('"required": ["id", "status"]');
    });

    test('should resolve $ref references in embedded schemas', async () => {
      await generateWrapper({
        schemas: testSchemasPath,
        output: outputFile
      });

      const generatedCode = fs.readFileSync(outputFile, 'utf-8');

      // Should not contain unresolved $ref
      expect(generatedCode).not.toContain('$ref');

      // Should have resolved the properties
      expect(generatedCode).toContain('"name": {');
      expect(generatedCode).toContain('"count": {');
    });
  });

  describe('Validation Code', () => {
    test('should generate validation functions', async () => {
      await generateWrapper({
        schemas: testSchemasPath,
        output: outputFile,
        validationMode: 'strict'
      });

      const generatedCode = fs.readFileSync(outputFile, 'utf-8');

      // Check for validation initialization
      expect(generatedCode).toContain('initializeValidators()');
      expect(generatedCode).toContain('this.validators.set(');

      // Check for validation in capture method
      expect(generatedCode).toContain('const validator = this.validators.get(eventName)');
      expect(generatedCode).toContain('const result = validator(properties)');
      expect(generatedCode).toContain('if (!result.valid)');
    });

    test('should generate different validation modes', async () => {
      // Test strict mode
      await generateWrapper({
        schemas: testSchemasPath,
        output: outputFile,
        validationMode: 'strict'
      });

      let generatedCode = fs.readFileSync(outputFile, 'utf-8');
      expect(generatedCode).toContain("'strict'");
      expect(generatedCode).toContain('throw new Error');

      // Test warning mode
      await generateWrapper({
        schemas: testSchemasPath,
        output: outputFile,
        validationMode: 'warning'
      });

      generatedCode = fs.readFileSync(outputFile, 'utf-8');
      expect(generatedCode).toContain("'warning'");
      expect(generatedCode).toContain('console.warn');

      // Test disabled mode
      await generateWrapper({
        schemas: testSchemasPath,
        output: outputFile,
        validationMode: 'disabled'
      });

      generatedCode = fs.readFileSync(outputFile, 'utf-8');
      expect(generatedCode).toContain("'disabled'");
    });
  });

  describe('Class Generation', () => {
    test('should generate class with custom name', async () => {
      await generateWrapper({
        schemas: testSchemasPath,
        output: outputFile,
        className: 'CustomAnalytics'
      });

      const generatedCode = fs.readFileSync(outputFile, 'utf-8');

      expect(generatedCode).toContain('export class CustomAnalytics');
      expect(generatedCode).toContain('export const customanalytics = new CustomAnalytics()');
      expect(generatedCode).toContain('export default customanalytics');
    });

    test('should generate capture method with overloads', async () => {
      await generateWrapper({
        schemas: testSchemasPath,
        output: outputFile
      });

      const generatedCode = fs.readFileSync(outputFile, 'utf-8');

      // Check for typed capture overloads
      expect(generatedCode).toContain('capture<K extends EventName>');
      expect(generatedCode).toContain('eventName: K');
      expect(generatedCode).toContain('properties: EventMap[K]');

      // Check for fallback capture
      expect(generatedCode).toContain('capture(eventName: string, properties?: any): void');
    });

    test('should include PostHog API compatibility methods', async () => {
      await generateWrapper({
        schemas: testSchemasPath,
        output: outputFile
      });

      const generatedCode = fs.readFileSync(outputFile, 'utf-8');

      // Check for PostHog methods
      expect(generatedCode).toContain('identify(');
      expect(generatedCode).toContain('alias(');
      expect(generatedCode).toContain('getFeatureFlag(');
      expect(generatedCode).toContain('isFeatureEnabled(');
      expect(generatedCode).toContain('setPersonProperties(');
      expect(generatedCode).toContain('group(');
      expect(generatedCode).toContain('reset(');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing schema files gracefully', async () => {
      await expect(generateWrapper({
        schemas: './non-existent/*.json',
        output: outputFile
      })).resolves.not.toThrow();

      const generatedCode = fs.readFileSync(outputFile, 'utf-8');
      expect(generatedCode).toContain('class');
    });

    test('should handle invalid schema structure', async () => {
      // Create a malformed schema
      const badSchemaPath = path.join(outputDir, 'bad.schema.json');
      fs.writeFileSync(badSchemaPath, JSON.stringify({
        invalid: "structure"
      }));

      await expect(generateWrapper({
        schemas: badSchemaPath,
        output: outputFile
      })).resolves.not.toThrow();
    });
  });
});