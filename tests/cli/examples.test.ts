import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { MachineConfig, SimulationResult } from '../../src/shared/types.js';
import { realEngine } from '../../src/cli/main.js';

// PRUEBA DE INTEGRACIÓN: a diferencia de los demás archivos de tests/cli, aquí SÍ se
// usan el parser y el motor reales (a través de realEngine) con los YAML de examples/.

function load(file: string): MachineConfig {
  return realEngine.loadMachine(
    readFileSync(new URL(`../../examples/${file}`, import.meta.url), 'utf8'),
  );
}

function run(config: MachineConfig, input: string): SimulationResult {
  return realEngine.run(config, input, {});
}

/** Contenido de la cinta sin los blancos de los extremos. */
function tapeContent(result: SimulationResult, blank: string): string {
  return result.finalTape.join('').split(blank).join('');
}

describe('examples/reconocedora.yaml', () => {
  const config = load('reconocedora.yaml');
  const inputs = config.inputStrings ?? [];
  const accepted = ['aabbcc', 'aaabbbccc', 'aaaabbbbcccc'];
  const rejected = ['aabbbcc', 'aabbc', 'aabccc'];

  it('define al menos dos cadenas aceptadas y dos rechazadas, todas de longitud >= 5', () => {
    expect(inputs).toEqual([...accepted, ...rejected]);
    expect(inputs.every((input) => input.length >= 5)).toBe(true);
    expect(accepted.length).toBeGreaterThanOrEqual(2);
    expect(rejected.length).toBeGreaterThanOrEqual(2);
  });

  it('usa una sola cinta (el parser exige read/write de un símbolo)', () => {
    expect(config.transitions.length).toBeGreaterThan(0);
  });

  it.each(accepted)('acepta %s', (input) => {
    expect(run(config, input).status).toBe('accepted');
  });

  it.each(rejected)('rechaza %s', (input) => {
    expect(run(config, input).status).toBe('rejected');
  });
});

describe('examples/alteradora.yaml', () => {
  const config = load('alteradora.yaml');
  // Arreglo de pares (y no un objeto) para conservar el orden de las cadenas.
  const expected: [input: string, output: string][] = [
    ['10101', '1010110101'],
    ['11010', '1101011010'],
    ['11111', '1111111111'],
    ['100101', '100101100101'],
  ];
  const inputs = expected.map(([input]) => input);

  it('define cuatro cadenas de longitud >= 5', () => {
    expect(config.inputStrings).toEqual(inputs);
    expect(config.inputStrings).toHaveLength(4);
    expect(config.inputStrings?.every((input) => input.length >= 5)).toBe(true);
  });

  it.each(expected)('transforma %s en %s', (input, output) => {
    const result = run(config, input);
    expect(result.status).toBe('accepted');
    expect(tapeContent(result, config.blankSymbol)).toBe(output);
  });

  it('no se limita a reemplazar todo por blancos', () => {
    for (const input of inputs) {
      const result = run(config, input);
      expect(tapeContent(result, config.blankSymbol).length).toBeGreaterThanOrEqual(input.length);
    }
  });
});
