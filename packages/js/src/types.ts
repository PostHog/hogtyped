/**
 * Types for HogTyped code generation
 */

export enum ValidationMode {
  STRICT = 'strict',
  WARNING = 'warning',
  DISABLED = 'disabled'
}

export interface HogTypedOptions {
  validationMode?: ValidationMode;
  environment?: 'development' | 'production' | 'test';
}

export interface ValidationResult {
  valid: boolean;
  errors?: any[];
}