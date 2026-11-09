import type { MachineConfig, Transition } from '../shared/types.js';

/** Finds the transition enabled by the current state and symbol under the head. */
export function findTransition(
  config: MachineConfig,
  state: string,
  readSymbol: string,
): Transition | undefined {
  return config.transitions.find(
    (transition) => transition.currentState === state && transition.readSymbol === readSymbol,
  );
}
