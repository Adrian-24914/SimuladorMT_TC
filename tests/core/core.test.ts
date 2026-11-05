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

describe('core placeholders', () => {
  it('keeps the tape implementation explicitly pending', () => {
    expect(() => createTape('a', '□')).toThrow('Not implemented');
  });

  it('keeps transition lookup explicitly pending', () => {
    expect(() => findTransition(minimalConfig, 'q0', 'a')).toThrow('Not implemented');
  });

  it('does not claim to simulate before the engine is implemented', () => {
    expect(() => simulate(minimalConfig, 'a')).toThrow('Not implemented');
  });
});
