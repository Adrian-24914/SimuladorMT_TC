import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SimulationResult } from '../../src/shared/types.js';
import { formatResult } from '../../src/cli/formatter.js';
import { outputResult } from '../../src/cli/output.js';

// Objeto construido a mano para probar la salida; no es una ejecución real.
const mockResult: SimulationResult = {
  status: 'accepted',
  history: [{ state: 'q0', tape: ['a', '□'], headPosition: 0, step: 0 }],
  finalState: 'qa',
  finalTape: ['a', '□'],
  finalHeadPosition: 1,
  steps: 1,
};

describe('outputResult', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('envía el texto formateado al destino inyectado', () => {
    const received: string[] = [];
    outputResult(mockResult, (text) => received.push(text));
    expect(received).toEqual([formatResult(mockResult)]);
  });

  it('escribe en la consola cuando no se indica destino', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    outputResult(mockResult);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(formatResult(mockResult));
  });
});
