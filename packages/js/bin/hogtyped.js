#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
const fs = require('fs');
const { generateWrapper } = require('../dist/codegen/generate-wrapper');

program
  .name('hogtyped')
  .description('Generate a type-safe PostHog wrapper with embedded schemas')
  .version('0.1.0');

program
  .command('generate')
  .description('Generate a custom PostHog wrapper from your schemas')
  .option('-s, --schemas <pattern>', 'Schema file pattern', './schemas/*.schema.json')
  .option('-o, --output <path>', 'Output file path', './src/posthog.generated.ts')
  .option('-c, --class <name>', 'Generated class name', 'PostHog')
  .option('-m, --mode <mode>', 'Default validation mode', 'warning')
  .action(async (options) => {
    console.log('🐗 HogTyped Generator\n');

    try {
      await generateWrapper({
        schemas: options.schemas,
        output: options.output,
        className: options.class,
        validationMode: options.mode
      });

      console.log('\n📝 Next steps:');
      console.log(`1. Import your generated wrapper:`);
      console.log(`   import hogtyped from '${options.output.replace('.ts', '')}';`);
      console.log('\n2. Initialize with your API key:');
      console.log(`   hogtyped.init('your-api-key');`);
      console.log('\n3. Use it with full type safety:');
      console.log(`   hogtyped.capture('event_name', { /* autocomplete! */ });`);
    } catch (error) {
      console.error('❌ Error generating wrapper:', error.message);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize HogTyped in your project')
  .action(() => {
    console.log('🐗 Initializing HogTyped...\n');

    // Create schemas directory
    if (!fs.existsSync('./schemas')) {
      fs.mkdirSync('./schemas');
      console.log('✅ Created schemas/ directory');
    }

    // Create example schema
    const exampleSchema = {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "definitions": {
        "PageView": {
          "type": "object",
          "properties": {
            "url": { "type": "string", "format": "uri" },
            "title": { "type": "string" },
            "referrer": { "type": "string", "format": "uri" }
          },
          "required": ["url"]
        }
      },
      "events": {
        "page_viewed": { "$ref": "#/definitions/PageView" }
      }
    };

    const schemaPath = './schemas/events.schema.json';
    if (!fs.existsSync(schemaPath)) {
      fs.writeFileSync(schemaPath, JSON.stringify(exampleSchema, null, 2));
      console.log('✅ Created example schema at schemas/events.schema.json');
    }

    // Add scripts to package.json
    const packagePath = './package.json';
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

      if (!pkg.scripts) pkg.scripts = {};

      if (!pkg.scripts['generate:posthog']) {
        pkg.scripts['generate:posthog'] = 'hogtyped generate';
        pkg.scripts['prebuild'] = 'npm run generate:posthog';

        fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
        console.log('✅ Added generation scripts to package.json');
      }
    }

    console.log('\n📝 Next steps:');
    console.log('1. Edit your schemas in schemas/events.schema.json');
    console.log('2. Run: npm run generate:posthog');
    console.log('3. Import and use your generated wrapper');
  });

program.parse();