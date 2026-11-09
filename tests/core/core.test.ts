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

describe('remaining core placeholders', () => {
  it('does not claim to simulate before the engine is implemented', () => {
    expect(() => simulate(minimalConfig, 'a')).toThrow('Not implemented');
  });
});
