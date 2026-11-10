import type {
  InstantaneousDescription,
  SimulationResult,
  SimulationStatus,
} from '../shared/types.js';

const STATUS_LABELS: Record<SimulationStatus, string> = {
  accepted: 'ACEPTADA',
  rejected: 'RECHAZADA',
  step_limit: 'LÍMITE DE PASOS ALCANZADO',
};

/** Etiqueta legible (en español) para el estado final de una simulación. */
export function statusLabel(status: SimulationStatus): string {
  return STATUS_LABELS[status];
}

/** Cantidad de pasos con singular o plural: "1 paso", "5 pasos". */
export function formatStepCount(steps: number): string {
  return `${steps} ${steps === 1 ? 'paso' : 'pasos'}`;
}

/**
 * Representa la cinta como texto: los símbolos separados por espacios y la
 * celda bajo el cabezal entre corchetes. Ejemplo: `X a [b] Y`.
 */
export function formatTape(tape: readonly string[], headPosition: number): string {
  if (tape.length === 0) return '(cinta vacía)';
  return tape.map((symbol, index) => (index === headPosition ? `[${symbol}]` : symbol)).join(' ');
}

/** Una descripción instantánea en una línea: paso, estado, cabezal y cinta. */
export function formatDescription(description: InstantaneousDescription, stepWidth = 1): string {
  const step = String(description.step).padStart(stepWidth, ' ');
  const tape = formatTape(description.tape, description.headPosition);
  return `Paso ${step} | estado: ${description.state} | cabezal: ${description.headPosition} | cinta: ${tape}`;
}

/** Todas las descripciones instantáneas, una por línea y con los pasos alineados. */
export function formatHistory(history: readonly InstantaneousDescription[]): string {
  const title = 'Historial de descripciones instantáneas:';
  if (history.length === 0) return `${title}\n  (sin historial)`;

  const width = history.reduce((max, entry) => Math.max(max, String(entry.step).length), 1);
  const lines = history.map((entry) => `  ${formatDescription(entry, width)}`);
  return [title, ...lines].join('\n');
}

function describeOutcome(result: SimulationResult): string {
  switch (result.status) {
    case 'accepted':
      return `La máquina llegó al estado de aceptación "${result.finalState}".`;
    case 'rejected': {
      const symbol = result.finalTape[result.finalHeadPosition];
      const reading = symbol === undefined ? '' : ` para el símbolo "${symbol}"`;
      return `La máquina se detuvo en el estado "${result.finalState}" sin transición aplicable${reading}.`;
    }
    case 'step_limit':
      return `Se alcanzó el límite de pasos tras ${formatStepCount(result.steps)}; la ejecución se interrumpió sin aceptar ni rechazar.`;
  }
}

/** Resultado final: aceptación/rechazo/límite, estado final y contenido final de la cinta. */
export function formatSummary(result: SimulationResult): string {
  return [
    `Resultado: ${statusLabel(result.status)}`,
    `Detalle: ${describeOutcome(result)}`,
    `Pasos ejecutados: ${result.steps}`,
    `Estado final: ${result.finalState}`,
    `Posición final del cabezal: ${result.finalHeadPosition}`,
    `Cinta final: ${formatTape(result.finalTape, result.finalHeadPosition)}`,
  ].join('\n');
}

/** Historial completo de descripciones instantáneas seguido del resultado final. */
export function formatResult(result: SimulationResult): string {
  return `${formatHistory(result.history)}\n\n${formatSummary(result)}`;
}
