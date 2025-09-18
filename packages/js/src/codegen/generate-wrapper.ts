#!/usr/bin/env node

/**
 * Generates a custom PostHog wrapper with schemas baked in at build time.
 * This creates a single file with:
 * 1. All TypeScript types
 * 2. Embedded schemas (no runtime loading)
 * 3. Validation logic
 * 4. Full autocomplete support
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface SchemaInfo {
  eventName: string;
  interfaceName: string;
  schema: any;
  properties: Record<string, any>;
  required: string[];
}

export async function generateWrapper(options: {
  schemas: string | string[];
  output: string;
  className?: string;
  validationMode?: 'strict' | 'warning' | 'disabled';
}) {
  const className = options.className || 'MyPostHog';
  const schemas = await loadAndProcessSchemas(options.schemas);

  const code = `
// Auto-generated PostHog wrapper with embedded schemas
// Generated at: ${new Date().toISOString()}
// DO NOT EDIT - This file is auto-generated

// Dynamic import for SSR compatibility
let posthog: any;
if (typeof window !== 'undefined') {
  // Client-side only
  posthog = require('posthog-js').default;
} else {
  // Server-side: create a mock
  posthog = {
    init: () => {},
    capture: () => {},
    identify: () => {},
    alias: () => {},
    getFeatureFlag: () => undefined,
    isFeatureEnabled: () => false,
    setPersonProperties: () => {},
    group: () => {},
    reset: () => {}
  };
}

${generateTypes(schemas)}

${generateSchemaConstants(schemas)}

${generateWrapperClass(className, schemas, options.validationMode)}

// Export singleton instance with consistent name to avoid collisions
export const hogtyped = new ${className}();

// Default export is the singleton instance
export default hogtyped;
`;

  // Ensure output directory exists
  const outputDir = path.dirname(options.output);
  fs.mkdirSync(outputDir, { recursive: true });

  // Write the generated file
  fs.writeFileSync(options.output, code);

  console.log(`✅ Generated ${className} wrapper at ${options.output}`);
  console.log(`   - ${schemas.length} events with full type safety`);
  console.log(`   - Zero runtime schema loading`);
  console.log(`   - Full IDE autocomplete support`);
}

function generateTypes(schemas: SchemaInfo[]): string {
  let types = '// ============ Event Types ============\n\n';

  // Generate interface for each event
  for (const schema of schemas) {
    types += `export interface ${schema.interfaceName} {\n`;

    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      const isRequired = schema.required.includes(propName);
      const tsType = jsonSchemaToTsType(propSchema);
      const description = propSchema.description ? `  /** ${propSchema.description} */\n` : '';

      types += description;
      types += `  ${propName}${isRequired ? '' : '?'}: ${tsType};\n`;
    }

    types += '}\n\n';
  }

  // Generate event map
  types += 'export interface EventMap {\n';
  for (const schema of schemas) {
    types += `  '${schema.eventName}': ${schema.interfaceName};\n`;
  }
  types += '}\n\n';

  // Generate event name type
  types += `export type EventName = keyof EventMap;\n\n`;

  return types;
}

function generateSchemaConstants(schemas: SchemaInfo[]): string {
  let code = '// ============ Embedded Schemas ============\n\n';

  code += 'const SCHEMAS = {\n';

  for (const schema of schemas) {
    // Embed the full JSON schema for validation
    const schemaJson = JSON.stringify(schema.schema, null, 2);
    // Keep simple arrays on single lines for readability
    const formattedJson = schemaJson.replace(/\[\s+([^\[\]]+?)\s+\]/gs, (match, content) => {
      // Only collapse simple arrays (no nested structures)
      if (!content.includes('{') && !content.includes('[')) {
        return '[' + content.replace(/\s+/g, ' ').trim() + ']';
      }
      return match;
    });
    code += `  "${schema.eventName}": ${formattedJson.split('\n').join('\n  ')},\n`;
  }

  code += '} as const;\n\n';

  return code;
}

function generateWrapperClass(className: string, schemas: SchemaInfo[], validationMode?: string): string {
  return `
// ============ Type-Safe Wrapper ============

export class ${className} {
  private posthogInstance: typeof posthog;
  private validationMode: 'strict' | 'warning' | 'disabled';
  private validators: Map<string, (data: any) => { valid: boolean; errors?: any[] }> = new Map();
  private initialized = false;

  constructor(existingInstance?: any) {
    this.validationMode = '${validationMode || 'warning'}';

    // Use provided instance or fallback to the module-level posthog
    this.posthogInstance = existingInstance || posthog;

    // If an instance was provided, mark as initialized
    if (existingInstance) {
      this.initialized = true;
    }

    // Compile validators at initialization (happens once)
    this.initializeValidators();
  }

  /**
   * Initialize PostHog with your API key
   * @param apiKey - Your PostHog API key
   * @param options - PostHog configuration options
   */
  init(apiKey: string, options?: any): void {
    this.validationMode = options?.validationMode || this.validationMode;

    // Only init if we're using the default instance
    if (!this.initialized) {
      this.posthogInstance.init(apiKey, options);
      this.initialized = true;
    }
  }

  /**
   * Set or update the PostHog instance
   * @param instance - Your existing PostHog instance
   */
  setInstance(instance: any): void {
    this.posthogInstance = instance;
    this.initialized = true;
  }

  private initializeValidators() {
    ${generateValidatorInitialization(schemas)}
  }

  /**
   * Get the underlying posthog-js instance for advanced usage
   *
   * @example
   * // Access session replay
   * hogtyped.posthog.startSessionRecording();
   *
   * // Access feature flags directly
   * const flags = hogtyped.posthog.getAllFlags();
   *
   * // Any other posthog-js functionality
   * hogtyped.posthog.debug();
   */
  get posthog() {
    return this.posthogInstance;
  }

  /**
   * Capture an event with full type safety and compile-time checking
   */
  capture<K extends EventName | string = string>(
    eventName: K,
    properties: K extends EventName ? EventMap[K] : any
  ): void {
    // Validate if schema exists
    const validator = this.validators.get(eventName);

    if (validator && this.validationMode !== 'disabled') {
      const result = validator(properties);

      if (!result.valid) {
        const errorMessage = \`Event validation failed for "\${eventName}": \${JSON.stringify(result.errors)}\`;

        switch (this.validationMode) {
          case 'strict':
            // In development, throw immediately
            if (process.env.NODE_ENV === 'development') {
              throw new Error(errorMessage);
            }
            // In production, log and send error event
            console.error(errorMessage);
            this.posthogInstance.capture('$schema_validation_error', {
              event: eventName,
              errors: result.errors,
              properties
            });
            return; // Don't send the invalid event

          case 'warning':
            console.warn(errorMessage);
            this.posthogInstance.capture('$schema_validation_warning', {
              event: eventName,
              errors: result.errors,
              properties
            });
            break;
        }
      }
    }

    // Send the event
    this.posthogInstance.capture(eventName, properties);
  }

  // ============ PostHog API Compatibility ============

  identify(distinctId: string, properties?: any): void {
    this.posthogInstance.identify(distinctId, properties);
  }

  alias(alias: string, original?: string): void {
    this.posthogInstance.alias(alias, original);
  }

  getFeatureFlag(key: string, options?: any): any {
    return this.posthogInstance.getFeatureFlag(key, options);
  }

  isFeatureEnabled(key: string, options?: any): boolean {
    return this.posthogInstance.isFeatureEnabled(key, options) || false;
  }

  setPersonProperties(properties: any): void {
    this.posthogInstance.setPersonProperties(properties);
  }

  group(type: string, key: string, properties?: any): void {
    this.posthogInstance.group(type, key, properties);
  }

  reset(resetDeviceId?: boolean): void {
    this.posthogInstance.reset(resetDeviceId);
  }

  // Add all other PostHog methods as needed...
}`;
}

function generateValidatorInitialization(schemas: SchemaInfo[]): string {
  // For simplicity, we'll use a basic validator
  // In production, you'd want to use AJV compiled validators

  let code = '';

  for (const schema of schemas) {
    code += `    this.validators.set("${schema.eventName}", (data: any) => {
      const errors: any[] = [];
      const schema = SCHEMAS["${schema.eventName}"];

      // Check required fields
      ${schema.required.map(field => `
      if (data?.${field} === undefined) {
        errors.push({ field: '${field}', message: 'Required field missing' });
      }`).join('')}

      // Basic type checking (extend as needed)
      ${Object.entries(schema.properties).map(([field, prop]: [string, any]) => {
        if (prop.type === 'string' && prop.enum) {
          return `
      if (data?.${field} !== undefined && ![${prop.enum.map((v: string) => `'${v}'`).join(', ')}].includes(data.${field})) {
        errors.push({ field: '${field}', message: 'Invalid enum value' });
      }`;
        }
        return '';
      }).join('')}

      return { valid: errors.length === 0, errors };
    });\n`;
  }

  return code;
}

async function loadAndProcessSchemas(patterns: string | string[]): Promise<SchemaInfo[]> {
  const schemaPatterns = Array.isArray(patterns) ? patterns : [patterns];
  const schemas: SchemaInfo[] = [];

  for (const pattern of schemaPatterns) {
    const files = await glob(pattern);

    for (const file of files) {
      const content = JSON.parse(fs.readFileSync(file, 'utf-8'));

      if (content.events) {
        for (const [eventName, eventSchema] of Object.entries(content.events)) {
          const resolved = resolveSchema(eventSchema as any, content, file);

          schemas.push({
            eventName,
            interfaceName: eventNameToInterface(eventName),
            schema: resolved,
            properties: resolved.properties || {},
            required: resolved.required || []
          });
        }
      }
    }
  }

  return schemas;
}

function eventNameToInterface(eventName: string): string {
  return eventName
    .split(/[_-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('') + 'Properties';
}

function resolveSchema(schema: any, rootSchema: any, filePath: string): any {
  if (!schema) return schema;

  if (schema.$ref) {
    if (schema.$ref.startsWith('#/')) {
      const refPath = schema.$ref.substring(2).split('/');
      let resolved = rootSchema;
      for (const part of refPath) {
        resolved = resolved[part];
      }
      return resolveSchema(resolved, rootSchema, filePath);
    } else if (schema.$ref.startsWith('./')) {
      const refFile = path.resolve(path.dirname(filePath), schema.$ref.split('#')[0]);
      const refContent = JSON.parse(fs.readFileSync(refFile, 'utf-8'));
      const fragment = schema.$ref.split('#')[1];

      if (fragment) {
        const refPath = fragment.substring(1).split('/');
        let resolved = refContent;
        for (const part of refPath) {
          resolved = resolved[part];
        }
        return resolveSchema(resolved, refContent, refFile);
      }

      return refContent;
    }
  }

  if (schema.allOf) {
    const merged: any = { type: 'object', properties: {}, required: [] };

    for (const subSchema of schema.allOf) {
      const resolved = resolveSchema(subSchema, rootSchema, filePath);

      if (resolved.properties) {
        Object.assign(merged.properties, resolved.properties);
      }

      if (resolved.required) {
        merged.required.push(...resolved.required);
      }

      if (resolved.additionalProperties !== undefined) {
        merged.additionalProperties = resolved.additionalProperties;
      }
    }

    merged.required = [...new Set(merged.required)];
    return merged;
  }

  return schema;
}

function jsonSchemaToTsType(schema: any): string {
  if (!schema) return 'any';

  switch (schema.type) {
    case 'string':
      if (schema.enum) {
        return schema.enum.map((v: string) => `'${v}'`).join(' | ');
      }
      return 'string';

    case 'number':
    case 'integer':
      return 'number';

    case 'boolean':
      return 'boolean';

    case 'object':
      if (schema.additionalProperties) {
        return 'Record<string, any>';
      }
      if (schema.properties) {
        const props = Object.entries(schema.properties)
          .map(([key, value]) => `${key}?: ${jsonSchemaToTsType(value)}`)
          .join('; ');
        return `{ ${props} }`;
      }
      return 'Record<string, any>';

    case 'array':
      if (schema.items) {
        return `${jsonSchemaToTsType(schema.items)}[]`;
      }
      return 'any[]';

    default:
      return 'any';
  }
}