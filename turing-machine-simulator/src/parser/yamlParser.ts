import type { MachineConfig } from '../shared/types.js';

/**
 * Parse YAML text into the shared, normalized one-tape machine contract.
 * TODO(parser): Parse the root `mt` object, normalize read/write arrays of
 * length one, and throw a descriptive error for malformed YAML or structures.
 */
export function parseMachine(yamlContent: string): MachineConfig {
  void yamlContent;
  throw new Error('Not implemented: YAML machine parser');
}
