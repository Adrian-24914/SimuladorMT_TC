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

describe('remaining core placeholders', () => {
  it('keeps transition lookup explicitly pending', () => {
    expect(() => findTransition(minimalConfig, 'q0', 'a')).toThrow('Not implemented');
  });

  it('does not claim to simulate before the engine is implemented', () => {
    expect(() => simulate(minimalConfig, 'a')).toThrow('Not implemented');
  });
});
