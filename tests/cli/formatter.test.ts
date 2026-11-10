import { describe, expect, it } from 'vitest';
import type { SimulationResult } from '../../src/shared/types.js';
import {
  formatDescription,
  formatHistory,
  formatResult,
  formatStepCount,
  formatSummary,
  formatTape,
  statusLabel,
} from '../../src/cli/formatter.js';

// Los objetos de este archivo están construidos a mano para probar el formato.
// NO son ejecuciones reales de ninguna máquina de Turing.
const acceptedMock: SimulationResult = {
  status: 'accepted',
  history: [
    { state: 'q0', tape: ['a', 'b'], headPosition: 0, step: 0 },
    { state: 'q1', tape: ['X', 'b'], headPosition: 1, step: 1 },
    { state: 'q_accept', tape: ['X', 'Y', '□'], headPosition: 2, step: 2 },
  ],
  finalState: 'q_accept',
  finalTape: ['X', 'Y', '□'],
  finalHeadPosition: 2,
  steps: 2,
};

const rejectedMock: SimulationResult = {
  status: 'rejected',
  history: [
    { state: 'q0', tape: ['b', 'a'], headPosition: 0, step: 0 },
    // Paso con dos dígitos para comprobar la alineación del historial.
    { state: 'q1', tape: ['b', 'a'], headPosition: 1, step: 10 },
  ],
  finalState: 'q1',
  finalTape: ['b', 'a'],
  finalHeadPosition: 1,
  steps: 10,
};

const stepLimitMock: SimulationResult = {
  status: 'step_limit',
  history: [{ state: 'q0', tape: ['a'], headPosition: 0, step: 0 }],
  finalState: 'q0',
  finalTape: ['a'],
  finalHeadPosition: 0,
  steps: 5000,
};

describe('statusLabel', () => {
  it('traduce cada estado de simulación', () => {
    expect(statusLabel('accepted')).toBe('ACEPTADA');
    expect(statusLabel('rejected')).toBe('RECHAZADA');
    expect(statusLabel('step_limit')).toBe('LÍMITE DE PASOS ALCANZADO');
  });
});

describe('formatStepCount', () => {
  it('usa singular y plural correctamente', () => {
    expect(formatStepCount(0)).toBe('0 pasos');
    expect(formatStepCount(1)).toBe('1 paso');
    expect(formatStepCount(12)).toBe('12 pasos');
  });
});

describe('formatTape', () => {
  it('marca con corchetes la celda bajo el cabezal', () => {
    expect(formatTape(['X', 'a', 'b', 'Y'], 2)).toBe('X a [b] Y');
  });

  it('marca el blanco cuando el cabezal está sobre él', () => {
    expect(formatTape(['1', '0', '□'], 2)).toBe('1 0 [□]');
  });

  it('no marca ninguna celda si el cabezal está fuera de la cinta', () => {
    expect(formatTape(['a', 'b'], 7)).toBe('a b');
  });

  it('indica una cinta vacía', () => {
    expect(formatTape([], 0)).toBe('(cinta vacía)');
  });
});

describe('formatDescription', () => {
  it('muestra paso, estado, posición del cabezal y cinta', () => {
    const line = formatDescription({ state: 'q1', tape: ['a', 'b'], headPosition: 1, step: 3 });
    expect(line).toBe('Paso 3 | estado: q1 | cabezal: 1 | cinta: a [b]');
  });

  it('rellena el número de paso al ancho indicado', () => {
    const line = formatDescription({ state: 'q0', tape: ['a'], headPosition: 0, step: 3 }, 3);
    expect(line).toBe('Paso   3 | estado: q0 | cabezal: 0 | cinta: [a]');
  });
});

describe('formatHistory', () => {
  it('lista cada descripción instantánea en orden', () => {
    const lines = formatHistory(acceptedMock.history).split('\n');
    expect(lines[0]).toBe('Historial de descripciones instantáneas:');
    expect(lines).toHaveLength(4);
    expect(lines[1]).toContain('Paso 0 | estado: q0 | cabezal: 0 | cinta: [a] b');
    expect(lines[2]).toContain('Paso 1 | estado: q1 | cabezal: 1 | cinta: X [b]');
    expect(lines[3]).toContain('Paso 2 | estado: q_accept | cabezal: 2 | cinta: X Y [□]');
  });

  it('alinea los pasos cuando hay números de varios dígitos', () => {
    const lines = formatHistory(rejectedMock.history).split('\n');
    expect(lines[1]).toContain('Paso  0 |');
    expect(lines[2]).toContain('Paso 10 |');
  });

  it('indica cuando no hay historial', () => {
    expect(formatHistory([])).toContain('(sin historial)');
  });
});

describe('formatSummary', () => {
  it('describe una cadena aceptada', () => {
    const text = formatSummary(acceptedMock);
    expect(text).toContain('Resultado: ACEPTADA');
    expect(text).toContain('llegó al estado de aceptación "q_accept"');
    expect(text).toContain('Pasos ejecutados: 2');
    expect(text).toContain('Estado final: q_accept');
    expect(text).toContain('Posición final del cabezal: 2');
    expect(text).toContain('Cinta final: X Y [□]');
  });

  it('describe una cadena rechazada indicando el símbolo sin transición', () => {
    const text = formatSummary(rejectedMock);
    expect(text).toContain('Resultado: RECHAZADA');
    expect(text).toContain('estado "q1" sin transición aplicable para el símbolo "a"');
    expect(text).not.toContain('ACEPTADA');
  });

  it('describe el límite de pasos sin afirmar aceptación ni rechazo', () => {
    const text = formatSummary(stepLimitMock);
    expect(text).toContain('Resultado: LÍMITE DE PASOS ALCANZADO');
    expect(text).toContain('tras 5000 pasos');
    expect(formatSummary({ ...stepLimitMock, steps: 1 })).toContain('tras 1 paso;');
    expect(text).toContain('sin aceptar ni rechazar');
    expect(text).not.toContain('Resultado: ACEPTADA');
    expect(text).not.toContain('Resultado: RECHAZADA');
  });
});

describe('formatResult', () => {
  it('muestra el historial primero y el resultado final después', () => {
    const text = formatResult(acceptedMock);
    const historyIndex = text.indexOf('Historial de descripciones instantáneas:');
    const resultIndex = text.indexOf('Resultado: ACEPTADA');
    expect(historyIndex).toBe(0);
    expect(resultIndex).toBeGreaterThan(historyIndex);
    expect(text).toContain('Paso 1 | estado: q1');
    expect(text).toContain('Cinta final: X Y [□]');
  });

  it('funciona con un historial vacío', () => {
    const text = formatResult({ ...acceptedMock, history: [] });
    expect(text).toContain('(sin historial)');
    expect(text).toContain('Resultado: ACEPTADA');
  });

  it('no usa marcas de "no implementado"', () => {
    expect(formatResult(rejectedMock)).not.toContain('Not implemented');
  });
});
