import { describe, expect, it } from 'vitest';
import type { MachineConfig } from '../../src/shared/types.js';
import { createTape } from '../../src/core/tape.js';
import { findTransition } from '../../src/core/transitionEngine.js';
import { simulate } from '../../src/core/turingMachine.js';

const minimalConfig: MachineConfig = {
  states: ['q0', 'qa'],
  inputAlphabet: ['a'],
  tapeAlphabet: ['a', '□'],
  blankSymbol: '□',
  initialState: 'q0',
  acceptStates: ['qa'],
  transitions: [],
};

const transitionConfig: MachineConfig = {
  ...minimalConfig,
  states: ['q0', 'q1', 'qa'],
  tapeAlphabet: ['a', 'b', 'X', '□'],
  transitions: [
    {
      currentState: 'q0',
      readSymbol: 'a',
      writeSymbol: 'X',
      direction: 'R',
      nextState: 'q1',
    },
    {
      currentState: 'q1',
      readSymbol: 'a',
      writeSymbol: 'a',
      direction: 'L',
      nextState: 'qa',
    },
  ],
};

describe('tape', () => {
  it('reads the input from the first cell and moves over it', () => {
    const tape = createTape('ab', '□');

    expect(tape.read()).toBe('a');
    tape.move('R');
    expect(tape.read()).toBe('b');
    expect(tape.getHeadPosition()).toBe(1);
    expect(tape.toArray()).toEqual(['a', 'b']);
  });

  it('writes over the current cell', () => {
    const tape = createTape('ab', '□');

    tape.write('X');

    expect(tape.read()).toBe('X');
    expect(tape.toArray()).toEqual(['X', 'b']);
  });

  it('grows with blank cells beyond both ends of the input', () => {
    const tape = createTape('a', '□');

    tape.move('L');
    expect(tape.read()).toBe('□');
    expect(tape.getHeadPosition()).toBe(0);
    expect(tape.toArray()).toEqual(['□', 'a']);

    tape.move('R');
    tape.move('R');
    expect(tape.read()).toBe('□');
    expect(tape.getHeadPosition()).toBe(2);
    expect(tape.toArray()).toEqual(['□', 'a', '□']);
  });

  it('represents an empty input with one blank cell', () => {
    const tape = createTape('', '□');

    expect(tape.read()).toBe('□');
    expect(tape.getHeadPosition()).toBe(0);
    expect(tape.toArray()).toEqual(['□']);
  });

  it('returns copies so snapshots cannot mutate the tape', () => {
    const tape = createTape('a', '□');
    const snapshot = tape.toArray();

    snapshot[0] = 'X';

    expect(tape.read()).toBe('a');
    expect(tape.toArray()).toEqual(['a']);
  });
});

describe('transition engine', () => {
  it('finds a transition matching both state and read symbol', () => {
    expect(findTransition(transitionConfig, 'q0', 'a')).toEqual({
      currentState: 'q0',
      readSymbol: 'a',
      writeSymbol: 'X',
      direction: 'R',
      nextState: 'q1',
    });
  });

  it('does not match a transition from a different state', () => {
    expect(findTransition(transitionConfig, 'qa', 'a')).toBeUndefined();
  });

  it('does not match a transition for a different symbol', () => {
    expect(findTransition(transitionConfig, 'q0', 'b')).toBeUndefined();
  });
});

describe('Turing machine simulation', () => {
  it('accepts immediately when the initial state is accepting', () => {
    const result = simulate({ ...minimalConfig, initialState: 'qa' }, 'a');

    expect(result).toEqual({
      status: 'accepted',
      history: [{ state: 'qa', tape: ['a'], headPosition: 0, step: 0 }],
      finalState: 'qa',
      finalTape: ['a'],
      finalHeadPosition: 0,
      steps: 0,
    });
  });

  it('applies transitions and records the complete history through acceptance', () => {
    const result = simulate(transitionConfig, 'aa');

    expect(result.status).toBe('accepted');
    expect(result.steps).toBe(2);
    expect(result.finalState).toBe('qa');
    expect(result.finalTape).toEqual(['X', 'a']);
    expect(result.finalHeadPosition).toBe(0);
    expect(result.history).toEqual([
      { state: 'q0', tape: ['a', 'a'], headPosition: 0, step: 0 },
      { state: 'q1', tape: ['X', 'a'], headPosition: 1, step: 1 },
      { state: 'qa', tape: ['X', 'a'], headPosition: 0, step: 2 },
    ]);
  });

  it('rejects when no transition applies outside an accepting state', () => {
    const result = simulate(minimalConfig, 'a');

    expect(result.status).toBe('rejected');
    expect(result.steps).toBe(0);
    expect(result.finalState).toBe('q0');
    expect(result.history).toHaveLength(1);
  });

  it('simulates an empty input starting on a blank cell', () => {
    const config: MachineConfig = {
      ...minimalConfig,
      transitions: [
        {
          currentState: 'q0',
          readSymbol: '□',
          writeSymbol: 'X',
          direction: 'R',
          nextState: 'qa',
        },
      ],
      tapeAlphabet: ['X', '□'],
    };

    const result = simulate(config, '');

    expect(result.status).toBe('accepted');
    expect(result.finalTape).toEqual(['X', '□']);
    expect(result.finalHeadPosition).toBe(1);
    expect(result.history).toHaveLength(2);
  });

  it('reports the step limit while another transition remains applicable', () => {
    const loopingConfig: MachineConfig = {
      ...minimalConfig,
      transitions: [
        {
          currentState: 'q0',
          readSymbol: 'a',
          writeSymbol: 'a',
          direction: 'R',
          nextState: 'q0',
        },
        {
          currentState: 'q0',
          readSymbol: '□',
          writeSymbol: '□',
          direction: 'L',
          nextState: 'q0',
        },
      ],
    };

    const result = simulate(loopingConfig, 'a', { maxSteps: 3 });

    expect(result.status).toBe('step_limit');
    expect(result.steps).toBe(3);
    expect(result.history).toHaveLength(4);
    expect(result.history.at(-1)).toEqual({
      state: 'q0',
      tape: ['a', '□'],
      headPosition: 1,
      step: 3,
    });
  });

  it('accepts when the accepting state is reached exactly at the limit', () => {
    const result = simulate(transitionConfig, 'aa', { maxSteps: 2 });

    expect(result.status).toBe('accepted');
    expect(result.steps).toBe(2);
  });

  it('rejects at the limit when the machine has naturally halted', () => {
    const result = simulate(minimalConfig, 'a', { maxSteps: 0 });

    expect(result.status).toBe('rejected');
  });

  it('rejects invalid step limits', () => {
    expect(() => simulate(minimalConfig, 'a', { maxSteps: -1 })).toThrow(RangeError);
    expect(() => simulate(minimalConfig, 'a', { maxSteps: 1.5 })).toThrow(RangeError);
  });
});
