import type { SimulationResult } from '../shared/types.js';
import { formatResult } from './formatter.js';

/** Destino de la salida de texto. Por defecto es la consola; se puede inyectar en pruebas. */
export type OutputSink = (text: string) => void;

const consoleSink: OutputSink = (text) => {
  console.log(text);
};

/** Formatea un resultado de simulación y lo envía al destino indicado (consola por defecto). */
export function outputResult(result: SimulationResult, sink: OutputSink = consoleSink): void {
  sink(formatResult(result));
}
