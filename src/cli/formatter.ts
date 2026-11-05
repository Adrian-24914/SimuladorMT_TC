import type { SimulationResult } from '../shared/types.js';

/** TODO(cli): Render status, final tape/state, and the step history for users. */
export function formatResult(_result: SimulationResult): string {
  throw new Error('Not implemented: simulation result formatter');
}
