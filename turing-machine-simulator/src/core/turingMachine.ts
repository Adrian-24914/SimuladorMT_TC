import type { MachineConfig, SimulationOptions, SimulationResult } from '../shared/types.js';

/**
 * Simulate an input using the supplied machine definition.
 * TODO(core): Execute transitions, record instantaneous descriptions, halt on
 * acceptance/rejection, and enforce the optional step limit.
 */
export function simulate(
  config: MachineConfig,
  input: string,
  options: SimulationOptions = {},
): SimulationResult {
  void config;
  void input;
  void options;
  throw new Error('Not implemented: Turing machine simulation');
}
