import type { Direction } from '../shared/types.js';

/** Minimal single-tape storage contract for the core implementation. */
export interface Tape {
  read(): string;
  write(symbol: string): void;
  move(direction: Direction): void;
  getHeadPosition(): number;
  toArray(): string[];
}

/**
 * Creates a tape that grows whenever the head crosses a represented edge.
 *
 * The input occupies the initial cells from left to right. An empty input is
 * represented by one blank cell. Moving left from position zero prepends a
 * blank cell, while moving right past the last cell appends one. Therefore,
 * the exposed head position is always a valid index in `toArray()`.
 */
export function createTape(input: string, blankSymbol: string): Tape {
  const cells = input.length > 0 ? Array.from(input) : [blankSymbol];
  let headPosition = 0;

  return {
    read(): string {
      return cells[headPosition] ?? blankSymbol;
    },

    write(symbol: string): void {
      cells[headPosition] = symbol;
    },

    move(direction: Direction): void {
      if (direction === 'L') {
        if (headPosition === 0) {
          cells.unshift(blankSymbol);
        } else {
          headPosition -= 1;
        }
        return;
      }

      headPosition += 1;
      if (headPosition === cells.length) {
        cells.push(blankSymbol);
      }
    },

    getHeadPosition(): number {
      return headPosition;
    },

    toArray(): string[] {
      return [...cells];
    },
  };
}
