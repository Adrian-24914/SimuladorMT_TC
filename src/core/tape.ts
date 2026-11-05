import type { Direction } from '../shared/types.js';

/** Minimal single-tape storage contract for the core implementation. */
export interface Tape {
  read(): string;
  write(symbol: string): void;
  move(direction: Direction): void;
  getHeadPosition(): number;
  toArray(): string[];
}

/** TODO(core): Implement an unbounded tape with implicit blank cells. */
export function createTape(_input: string, _blankSymbol: string): Tape {
  throw new Error('Not implemented: tape');
}
