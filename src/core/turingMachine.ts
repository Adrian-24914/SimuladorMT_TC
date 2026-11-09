import type {
  InstantaneousDescription,
  MachineConfig,
  SimulationOptions,
  SimulationResult,
  SimulationStatus,
} from '../shared/types.js';
import { createTape, type Tape } from './tape.js';
import { findTransition } from './transitionEngine.js';

/** Safety limit used when the caller does not provide `SimulationOptions.maxSteps`. */
export const DEFAULT_MAX_STEPS = 10_000;

function takeSnapshot(state: string, tape: Tape, step: number): InstantaneousDescription {
  return {
    state,
    tape: tape.toArray(),
    headPosition: tape.getHeadPosition(),
    step,
  };
}

function createResult(
  status: SimulationStatus,
  state: string,
  tape: Tape,
  steps: number,
  history: InstantaneousDescription[],
): SimulationResult {
  return {
    status,
    history,
    finalState: state,
    finalTape: tape.toArray(),
    finalHeadPosition: tape.getHeadPosition(),
    steps,
  };
}

/**
 * Simulates an input on a deterministic, single-tape Turing machine.
 *
 * A snapshot is recorded for the initial configuration and after every
 * applied transition. Acceptance takes precedence when an accepting state is
 * reached. A machine rejects when no transition applies outside an accepting
 * state, and reports `step_limit` when another transition exists but executing
 * it would exceed `maxSteps`. The default limit is `DEFAULT_MAX_STEPS`.
 */
export function simulate(
  config: MachineConfig,
  input: string,
  options: SimulationOptions = {},
): SimulationResult {
  const maxSteps = options.maxSteps ?? DEFAULT_MAX_STEPS;
  if (!Number.isInteger(maxSteps) || maxSteps < 0) {
    throw new RangeError('maxSteps must be a non-negative integer');
  }

  const tape = createTape(input, config.blankSymbol);
  let state = config.initialState;
  let steps = 0;
  const history: InstantaneousDescription[] = [takeSnapshot(state, tape, steps)];

  while (true) {
    if (config.acceptStates.includes(state)) {
      return createResult('accepted', state, tape, steps, history);
    }

    const transition = findTransition(config, state, tape.read());
    if (transition === undefined) {
      return createResult('rejected', state, tape, steps, history);
    }

    if (steps >= maxSteps) {
      return createResult('step_limit', state, tape, steps, history);
    }

    tape.write(transition.writeSymbol);
    tape.move(transition.direction);
    state = transition.nextState;
    steps += 1;
    history.push(takeSnapshot(state, tape, steps));
  }
}
