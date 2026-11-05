import { describe, expect, it } from 'vitest';
import type { SimulationResult } from '../../src/shared/types.js';
import { formatResult } from '../../src/cli/formatter.js';
import { outputResult } from '../../src/cli/output.js';

const mockResult: SimulationResult = {
  status: 'accepted',
  history: [],
  finalState: 'qa',
  finalTape: ['a', '□'],
  finalHeadPosition: 1,
  steps: 1,
};

describe('CLI placeholders', () => {
  it('accepts a shared result contract but clearly marks formatting as pending', () => {
    expect(() => formatResult(mockResult)).toThrow('Not implemented');
  });

  it('keeps output behavior pending rather than producing fabricated output', () => {
    expect(() => outputResult(mockResult)).toThrow('Not implemented');
  });
});
