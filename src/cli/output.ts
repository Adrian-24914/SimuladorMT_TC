import type { SimulationResult } from '../shared/types.js';

/** TODO(cli): Send formatted output to stdout or another injected output sink. */
export function outputResult(_result: SimulationResult): void {
  throw new Error('Not implemented: CLI output');
}
