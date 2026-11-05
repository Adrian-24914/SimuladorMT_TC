import { describe, expect, it } from 'vitest';
import { parseMachine, validateMachineConfig } from '../../src/parser/index.js';
import type { MachineConfig } from '../../src/shared/types.js';

const validYaml = `
mt:
  states: [q0, q_accept]
  input_alphabet: [a]
  tape_alphabet: [a, "□"]
  blank: "□"
  initial_state: q0
  accept_states: [q_accept]
  transitions:
    - from: q0
      read: [a]
      write: [a]
      move: R
      to: q_accept
  inputs: ["", a, aa]
`;

describe('parseMachine', () => {
  it('normalizes a valid single-tape YAML machine', () => {
    expect(parseMachine(validYaml)).toEqual({
      states: ['q0', 'q_accept'],
      inputAlphabet: ['a'],
      tapeAlphabet: ['a', '□'],
      blankSymbol: '□',
      initialState: 'q0',
      acceptStates: ['q_accept'],
      transitions: [
        {
          currentState: 'q0',
          readSymbol: 'a',
          writeSymbol: 'a',
          direction: 'R',
          nextState: 'q_accept',
        },
      ],
      inputStrings: ['', 'a', 'aa'],
    });
  });

  it('accepts the initial/accept aliases used by repository examples', () => {
    const yaml = validYaml
      .replace('initial_state:', 'initial:')
      .replace('accept_states:', 'accept:');
    expect(parseMachine(yaml).initialState).toBe('q0');
  });

  it('reports malformed YAML clearly', () => {
    expect(() => parseMachine('mt: [unterminated')).toThrow(/Invalid YAML:/);
  });

  it('reports missing required fields with their paths', () => {
    expect(() => parseMachine('mt: {}')).toThrow(/mt\.states: must be an array/);
  });

  it.each([['[]'], ['[a, b]']])('rejects read lists incompatible with one tape: %s', (read) => {
    expect(() => parseMachine(validYaml.replace('read: [a]', `read: ${read}`))).toThrow(
      /read: must be a list containing exactly one symbol/,
    );
  });

  it('rejects a multi-symbol write list', () => {
    expect(() => parseMachine(validYaml.replace('write: [a]', 'write: [a, a]'))).toThrow(
      /write: must be a list containing exactly one symbol/,
    );
  });

  it('rejects unknown states, invalid transition symbols, and directions', () => {
    const invalid = validYaml
      .replace('to: q_accept', 'to: missing')
      .replace('write: [a]', 'write: [b]')
      .replace('move: R', 'move: S');
    expect(() => parseMachine(invalid)).toThrow(/unknown state "missing"/);
    expect(() => parseMachine(invalid)).toThrow(/symbol "b" is not in tape_alphabet/);
    expect(() => parseMachine(invalid)).toThrow(/must be "L" or "R"/);
  });

  it('rejects alphabet and example input inconsistencies', () => {
    expect(() =>
      parseMachine(validYaml.replace('input_alphabet: [a]', 'input_alphabet: [a, b]')),
    ).toThrow(/symbol "b" is not in tape_alphabet/);
    expect(() => parseMachine(validYaml.replace('inputs: ["", a, aa]', 'inputs: [ab]'))).toThrow(
      /symbol "b" is not in input_alphabet/,
    );
  });
});

describe('validateMachineConfig', () => {
  it('returns useful issues without throwing', () => {
    const config: MachineConfig = {
      states: ['q0'],
      inputAlphabet: ['a'],
      tapeAlphabet: ['□'],
      blankSymbol: '□',
      initialState: 'missing',
      acceptStates: [],
      transitions: [],
    };
    expect(validateMachineConfig(config)).toEqual({
      valid: false,
      issues: [
        { path: 'mt.input_alphabet', message: 'symbol "a" is not in tape_alphabet' },
        { path: 'mt.initial_state', message: 'unknown state "missing"' },
      ],
    });
  });
});
