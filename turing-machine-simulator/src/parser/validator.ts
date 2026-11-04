import type { MachineConfig, ValidationResult } from '../shared/types.js';

/**
 * Validate machine states, alphabets, initial/accepting states, and transitions.
 * TODO(parser): Return all useful structural and semantic validation issues.
 */
export function validateMachineConfig(config: MachineConfig): ValidationResult {
  void config;
  throw new Error('Not implemented: machine configuration validator');
}
