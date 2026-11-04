import type { MachineConfig, Transition } from '../shared/types.js';

/** TODO(core): Find the applicable one-tape transition for the current state/symbol. */
export function findTransition(
  _config: MachineConfig,
  _state: string,
  _readSymbol: string,
): Transition | undefined {
  throw new Error('Not implemented: transition engine');
}
