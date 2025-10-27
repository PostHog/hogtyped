# TODO

This document tracks technical tasks, improvements, and known issues for HogTyped.

## Critical Issues

### Python Package
- [ ] **Fix CLI test failures** (4/8 tests failing in `tests/test_cli.py`)
  - Init command not creating schemas directory properly
  - Generate command tests failing due to module import issues
  - Need proper PYTHONPATH configuration in test environment
  - Location: `packages/python/tests/test_cli.py`

### Validation System
- [ ] **Implement comprehensive validation**
  - Current validation only checks required fields and enum values
  - Missing format validation (email, uuid, date-time, uri, ipv4, ipv6)
  - Missing numeric constraints (minimum, maximum, multipleOf, exclusiveMinimum/Maximum)
  - Missing string constraints (pattern, minLength, maxLength)
  - Missing array constraints (minItems, maxItems, uniqueItems)
  - Missing object constraints (minProperties, maxProperties)
  - Consider using AJV for TypeScript, jsonschema for Python
  - Location: `packages/js/src/codegen/generate-wrapper.ts:generateValidationFunction`
  - Location: `packages/python/hogtyped/codegen.py:_generate_validation_function`

### Feature Parity
- [ ] **Add `.posthog` property to Python implementation**
  - TypeScript has escape hatch via `.posthog` property
  - Python should expose underlying PostHog instance similarly
  - Location: `packages/python/hogtyped/codegen.py`

- [ ] **Implement `validate()` method**
  - Allow validation without sending events
  - Useful for testing and debugging
  - Should return validation errors or None
  - Add to both JS and Python implementations

- [ ] **Send validation error events**
  - Currently only logs warnings in WARNING mode
  - Should send `$schema_validation_error` events to PostHog
  - Include event name, validation errors, and mode
  - Location: `packages/js/src/codegen/generate-wrapper.ts:generateCaptureMethod`
  - Location: `packages/python/hogtyped/codegen.py:_generate_capture_method`

## High Priority

### Type Generation Improvements
- [ ] **Enhanced nested object support**
  - Current implementation returns `Record<string, any>` for complex nested types
  - Generate proper TypedDict for Python nested objects
  - Generate proper TypeScript interfaces for nested objects
  - Support deeper nesting (currently limited to simple cases)
  - Location: `packages/js/src/codegen/generate-wrapper.ts:generateTypeScriptType`
  - Location: `packages/python/hogtyped/codegen.py:_generate_python_type`

- [ ] **Support discriminated unions**
  - JSON Schema `oneOf`/`anyOf` with discriminator property
  - Generate TypeScript discriminated union types
  - Generate Python Union types with proper type guards

- [ ] **Support conditional schemas**
  - JSON Schema `if`/`then`/`else` keywords
  - Generate appropriate type narrowing

### Developer Experience
- [ ] **Add watch mode**
  - Monitor schema files for changes
  - Automatically regenerate wrapper on changes
  - Add `--watch` flag to CLI
  - Use chokidar for JS, watchdog for Python

- [ ] **Schema diff/change detection**
  - Compare old and new schema versions
  - Detect breaking changes
  - Warn about removed/changed properties
  - Add `hogtyped diff` command

- [ ] **Dry-run mode**
  - Preview generated code without writing files
  - Validate schemas without generation
  - Add `--dry-run` flag

- [ ] **Better error messages**
  - Include line numbers for schema errors
  - Suggest fixes for common mistakes
  - Pretty-print validation errors

### Multi-Language Support
- [ ] **Architecture for multi-language code generation**
  - Design intermediate representation (IR) for schemas
  - Abstract syntax tree (AST) for language-agnostic code model
  - Language-specific code emitters/generators
  - Shared validation logic across all languages
  - Plugin system for community-contributed languages

- [ ] **Go (Golang) implementation**
  - Generate Go structs with JSON tags
  - Type-safe event capture functions
  - PostHog Go SDK integration
  - Go modules package management
  - Example for Go web services (net/http, gin, echo)
  - Location: Create `packages/go/` directory

- [ ] **Java/JVM implementation**
  - Generate Java classes with builder patterns
  - Kotlin data class support
  - Type-safe event capture methods
  - Maven and Gradle integration
  - Spring Boot integration example
  - Location: Create `packages/java/` directory

- [ ] **Ruby implementation**
  - Generate Ruby classes with attr_accessor
  - Type validation using dry-schema or similar
  - PostHog Ruby SDK integration
  - Gem package distribution
  - Rails integration example
  - Location: Create `packages/ruby/` directory

- [ ] **PHP implementation**
  - Generate PHP 8+ classes with typed properties
  - Type hints and return type declarations
  - PostHog PHP SDK integration
  - Composer package distribution
  - Laravel and Symfony integration examples
  - Location: Create `packages/php/` directory

- [ ] **C# / .NET implementation**
  - Generate C# classes with properties
  - Full .NET type system support
  - NuGet package distribution
  - ASP.NET Core integration example
  - Unity game engine example
  - Location: Create `packages/dotnet/` directory

- [ ] **Rust implementation**
  - Generate Rust structs with derive macros (Serialize, Deserialize)
  - Strong type safety with ownership model
  - Cargo package distribution
  - Integration with Actix/Rocket frameworks
  - Location: Create `packages/rust/` directory

- [ ] **Cross-language testing framework**
  - Automated tests for each language implementation
  - Validation consistency tests across languages
  - Performance benchmarking per language
  - Schema compatibility matrix

- [ ] **Package distribution for all languages**
  - npm (TypeScript/JavaScript) ✅
  - PyPI (Python) ✅
  - pkg.go.dev (Go)
  - Maven Central (Java)
  - RubyGems (Ruby)
  - Packagist (PHP)
  - NuGet (.NET)
  - crates.io (Rust)

### Documentation
- [ ] **API Reference Documentation**
  - Document all CLI commands and options
  - Document generated wrapper API surface
  - Document validation modes in detail
  - Include language-specific API differences (TypeScript/Python/Go/Java/etc.)

- [ ] **Troubleshooting Guide**
  - Common issues and solutions
  - Schema design mistakes
  - Language-specific issues
  - PostHog integration problems

- [ ] **Schema Design Best Practices**
  - Property naming conventions
  - When to use $ref vs inline
  - How to organize schemas
  - Versioning strategies

- [ ] **Performance Guide**
  - Bundle size optimization
  - Validation performance
  - Schema organization for tree-shaking

### Testing
- [ ] **Add runtime behavior tests**
  - Test actual event validation with PostHog mock
  - Test different validation modes behavior
  - Test error handling in different environments

- [ ] **Add edge case tests**
  - Circular references in schemas
  - Very large schemas (100+ properties)
  - Deep nesting (5+ levels)
  - Unicode/special characters in names
  - Schema with no properties

- [ ] **Add integration tests**
  - Test with actual PostHog instance (mocked)
  - Test multi-schema file projects
  - Test generated code compilation/execution
  - Test SSR scenarios (Node + browser)

- [ ] **Add compatibility tests**
  - Test different PostHog versions
  - Test different runtime environments
  - Browser compatibility tests (Playwright/Puppeteer)

- [ ] **Performance benchmarks**
  - Code generation speed
  - Validation overhead
  - Bundle size metrics

## Medium Priority

### Features
- [ ] **Batch capture methods**
  - `captureMany(events: Array<{event: EventName, properties: Properties}>)`
  - Useful for bulk operations
  - Validate all events before sending

- [ ] **Schema documentation generation**
  - Generate markdown docs from schemas
  - Include property descriptions, types, examples
  - Add `hogtyped docs` command

- [ ] **Schema versioning support**
  - Track schema versions in code
  - Generate migration helpers
  - Detect version mismatches

- [ ] **Custom validator plugins**
  - Allow custom validation functions
  - Support custom formats
  - Plugin architecture for extensions

- [ ] **Configuration file support**
  - `.hogtypedrc.json` or `hogtyped.config.js`
  - Avoid repeating CLI flags
  - Support per-environment configs

### Code Quality
- [ ] **Tree-shaking optimization**
  - Add `/*#__PURE__*/` annotations
  - Split schema constants into separate exports
  - Generate ESM and CJS bundles

- [ ] **Code minification option**
  - Minify generated code
  - Remove comments in production
  - Add `--minify` flag

- [ ] **Optimize bundle size**
  - Remove duplicate schemas in multi-event scenarios
  - Share common validation logic
  - Consider schema compression

### TypeScript Specific
- [ ] **Strict null checking helpers**
  - Generate proper nullable types
  - Use `| null | undefined` appropriately
  - Support `strictNullChecks: true`

- [ ] **Better JSDoc comments**
  - Generate JSDoc from schema descriptions
  - Include examples in JSDoc
  - Add `@example` tags

- [ ] **Source maps for generated code**
  - Map back to original schemas
  - Better debugging experience

### Python Specific
- [ ] **TypedDict `total` parameter optimization**
  - Auto-detect when all properties required
  - Set `total=True` for better type checking
  - Reduces false positives

- [ ] **Async PostHog support**
  - Support async capture methods
  - Generate `async def capture()` variant
  - Add `--async` flag for Python

- [ ] **Type stub generation**
  - Generate `.pyi` stub files
  - Better IDE support
  - Separation of runtime and type info

## Low Priority

### Examples & Guides
- [ ] **Add Next.js example**
  - App Router and Pages Router patterns
  - SSR considerations
  - Middleware usage

- [ ] **Add Nuxt.js example**
  - Composables pattern
  - Server vs client rendering

- [ ] **Add mobile examples**
  - React Native integration
  - Flutter integration (if PostHog supports)

- [ ] **Add advanced examples**
  - Real-time validation scenarios
  - Error boundary patterns (React)
  - Custom validator examples
  - Monorepo schema sharing

### Advanced Features
- [ ] **GraphQL integration**
  - Generate schemas from GraphQL types
  - Support GraphQL -> JSON Schema conversion
  - Add `--from-graphql` flag

- [ ] **OpenAPI integration**
  - Generate schemas from OpenAPI specs
  - Support OpenAPI -> JSON Schema conversion
  - Add `--from-openapi` flag

- [ ] **Schema registry support**
  - Fetch schemas from remote registry
  - Cache schemas locally
  - Version resolution

- [ ] **Hot reload for development**
  - Reload generated wrapper without restart
  - HMR support for React/Vue
  - Dynamic schema updates

- [ ] **Additional niche language support**
  - Swift (iOS/macOS) - covered in High Priority but may be lower priority
  - Kotlin (Android) - covered in High Priority but may be lower priority
  - Dart (Flutter) - covered in High Priority but may be lower priority
  - Scala (functional JVM)
  - Elixir (functional, Erlang VM)
  - Clojure (functional, JVM)
  - Haskell (pure functional)
  - OCaml/ReasonML (type-safe functional)
  - Zig (systems programming)
  - Nim (compiled, Python-like syntax)
  - See High Priority > Multi-Language Support for core languages (Go, Java, Ruby, PHP, C#, Rust)

### Developer Tools
- [ ] **VS Code extension**
  - Schema validation in editor
  - Auto-complete for properties
  - Inline documentation
  - Generate schema from example

- [ ] **Schema migration tool**
  - Upgrade schema from draft-04 to draft-07
  - Detect breaking changes
  - Suggest property renames

- [ ] **Schema testing framework**
  - Test schemas with example events
  - Validate schema coverage
  - Find unused properties

## Known Issues

### Documentation
- README mentions Next.js/Nuxt patterns but `/examples` doesn't include them
- No FAQ section for common questions
- Missing version compatibility matrix

### Type Generation
- Complex nested objects return `Record<string, any>` instead of proper types
- No support for recursive types
- Enum values not validated in Python (only TypeScript)

### Validation
- Format validation not implemented (`email`, `uuid`, `date-time`, etc.)
- No deep object validation (only top-level properties)
- Array item validation not implemented
- Pattern matching not implemented

### Platform Differences
- TypeScript has `.posthog` escape hatch, Python doesn't
- Constructor parameters differ between platforms
- Some validation behavior differences

## Future Considerations

### Performance
- Consider WASM for validation in browsers
- Lazy load validation logic
- Schema caching strategies

### Security
- Schema sanitization for untrusted sources
- Validation DoS prevention
- Safe eval for custom validators

### Scalability
- Support for 1000+ event types
- Incremental code generation
- Parallel schema processing

### Community
- Plugin marketplace
- Schema template library
- Community schema repository

---

**Priority Legend:**
- **Critical**: Blocking issues, bugs, broken functionality
- **High**: Important features, significant UX improvements
- **Medium**: Nice-to-have features, optimizations
- **Low**: Future enhancements, exploratory work

**Status Tracking:**
- [ ] Not started
- [x] Completed

Last updated: 2025-10-27
