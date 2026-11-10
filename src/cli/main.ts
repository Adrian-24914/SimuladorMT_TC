import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { simulate } from '../core/index.js';
import { parseMachine } from '../parser/index.js';
import type { MachineConfig, SimulationOptions, SimulationResult } from '../shared/types.js';
import { formatResult, formatStepCount, formatSummary, statusLabel } from './formatter.js';

/* ------------------------------------------------------------------ */
/* PUNTO DE INTEGRACIÓN con el parser y el motor                       */
/*                                                                     */
/* Es el ÚNICO lugar de la CLI que llama al parser y al motor, y solo  */
/* mediante sus APIs públicas (src/parser/index.ts y src/core/index.ts) */
/* Si cambia alguna de esas APIs, se ajusta aquí y nada más.           */
/* ------------------------------------------------------------------ */

/** Lo que la CLI necesita del parser y del motor. */
export interface Engine {
  /** Convierte el texto YAML en una máquina validada. Lanza Error si es inválido. */
  loadMachine(yamlContent: string): MachineConfig;
  /** Simula una cadena de entrada sobre la máquina. */
  run(config: MachineConfig, input: string, options: SimulationOptions): SimulationResult;
}

/** Conexión real: parser (parseMachine) + motor (simulate). */
export const realEngine: Engine = {
  loadMachine: (yamlContent) => parseMachine(yamlContent),
  run: (config, input, options) => simulate(config, input, options),
};

/* ------------------------------------------------------------------ */
/* Argumentos                                                          */
/* ------------------------------------------------------------------ */

export const USAGE = `Simulador de Máquinas de Turing (una cinta)

Uso:
  npm run dev -- [archivo.yaml] [opciones]

Si no se indica archivo, se muestra la lista de archivos de examples/ para elegir uno.

Opciones:
  -i, --input <cadena>   Simula solo esta cadena (se puede repetir). Use "" para la cadena vacía.
                         Si no se indica, se simulan las cadenas de "inputs" del YAML.
  --max-steps <n>        Límite de pasos por cadena (por defecto, el del motor).
  --summary              Muestra solo el resultado final, sin el historial paso a paso.
  -h, --help             Muestra esta ayuda.

Ejemplos:
  npm run dev -- examples/reconocedora.yaml
  npm run dev -- examples/alteradora.yaml --summary
  npm run dev -- examples/reconocedora.yaml --input aabbcc --input aabbbcc`;

export interface CliArgs {
  help: boolean;
  file?: string;
  inputs: string[];
  maxSteps?: number;
  summaryOnly: boolean;
}

/** Error por uso incorrecto de la línea de comandos. */
export class UsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UsageError';
  }
}

function parseMaxSteps(value: string): number {
  if (!/^\d+$/.test(value)) {
    throw new UsageError(`--max-steps debe ser un entero no negativo (recibido: "${value}").`);
  }
  return Number(value);
}

/** Interpreta los argumentos de la línea de comandos (sin incluir node ni el script). */
export function parseArgs(argv: readonly string[]): CliArgs {
  const args: CliArgs = { help: false, inputs: [], summaryOnly: false };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === undefined) continue;

    if (arg === '-h' || arg === '--help') {
      args.help = true;
    } else if (arg === '--summary') {
      args.summaryOnly = true;
    } else if (arg === '-i' || arg === '--input') {
      index += 1;
      const value = argv[index];
      if (value === undefined) throw new UsageError(`La opción ${arg} requiere una cadena.`);
      args.inputs.push(value);
    } else if (arg.startsWith('--input=')) {
      args.inputs.push(arg.slice('--input='.length));
    } else if (arg === '--max-steps') {
      index += 1;
      const value = argv[index];
      if (value === undefined) throw new UsageError('La opción --max-steps requiere un número.');
      args.maxSteps = parseMaxSteps(value);
    } else if (arg.startsWith('--max-steps=')) {
      args.maxSteps = parseMaxSteps(arg.slice('--max-steps='.length));
    } else if (arg.startsWith('-')) {
      throw new UsageError(`Opción desconocida: ${arg}`);
    } else if (args.file === undefined) {
      args.file = arg;
    } else {
      throw new UsageError(`Solo se admite un archivo YAML (recibido también: "${arg}").`);
    }
  }

  return args;
}

/* ------------------------------------------------------------------ */
/* Ejecución                                                           */
/* ------------------------------------------------------------------ */

/** Dependencias externas de la CLI; se pueden reemplazar en pruebas. */
export interface CliDeps {
  engine: Engine;
  examplesDir: string;
  readFile(filePath: string): Promise<string>;
  listYamlFiles(directory: string): Promise<string[]>;
  prompt(question: string): Promise<string>;
  out(text: string): void;
  err(text: string): void;
}

const defaultDeps: CliDeps = {
  engine: realEngine,
  examplesDir: 'examples',
  readFile: (filePath) => readFile(filePath, 'utf8'),
  listYamlFiles: async (directory) =>
    (await readdir(directory)).filter((name) => /\.ya?ml$/i.test(name)).sort(),
  prompt: async (question) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    try {
      return await rl.question(question);
    } finally {
      rl.close();
    }
  },
  out: (text) => console.log(text),
  err: (text) => console.error(text),
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Pregunta al usuario cuál de los archivos YAML de la carpeta de ejemplos usar. */
async function chooseFile(deps: CliDeps): Promise<string> {
  let files: string[];
  try {
    files = await deps.listYamlFiles(deps.examplesDir);
  } catch (error) {
    throw new UsageError(
      `No se pudo leer la carpeta "${deps.examplesDir}": ${errorMessage(error)}\n` +
        'Indique la ruta de un archivo YAML como argumento.',
    );
  }
  if (files.length === 0) {
    throw new UsageError(
      `No hay archivos YAML en "${deps.examplesDir}". Indique la ruta de un archivo como argumento.`,
    );
  }

  deps.out('Archivos YAML disponibles:');
  files.forEach((name, index) => deps.out(`  ${index + 1}) ${name}`));
  const answer = (await deps.prompt('Seleccione un archivo (número): ')).trim();
  const choice = /^\d+$/.test(answer) ? Number(answer) : Number.NaN;
  const selected = files[choice - 1];
  if (selected === undefined) {
    throw new UsageError(
      `Selección inválida: "${answer}". Elija un número entre 1 y ${files.length}.`,
    );
  }
  return path.join(deps.examplesDir, selected);
}

function describeInput(input: string): string {
  return input === '' ? '"" (cadena vacía)' : `"${input}" (longitud ${input.length})`;
}

/**
 * Ejecuta la CLI y devuelve el código de salida:
 * 0 = terminó (aunque alguna cadena sea rechazada), 1 = error de archivo/YAML/simulación,
 * 2 = uso incorrecto.
 */
export async function runCli(
  argv: readonly string[],
  overrides: Partial<CliDeps> = {},
): Promise<number> {
  const deps: CliDeps = { ...defaultDeps, ...overrides };

  try {
    const args = parseArgs(argv);
    if (args.help) {
      deps.out(USAGE);
      return 0;
    }

    const file = args.file ?? (await chooseFile(deps));

    let yamlContent: string;
    try {
      yamlContent = await deps.readFile(file);
    } catch (error) {
      deps.err(`No se pudo leer el archivo "${file}": ${errorMessage(error)}`);
      return 1;
    }

    let config: MachineConfig;
    try {
      config = deps.engine.loadMachine(yamlContent);
    } catch (error) {
      deps.err(`Error en la configuración de "${file}":\n${errorMessage(error)}`);
      return 1;
    }

    const inputs = args.inputs.length > 0 ? args.inputs : (config.inputStrings ?? []);
    if (inputs.length === 0) {
      deps.err(
        `El archivo "${file}" no define cadenas ("inputs"). Use --input <cadena> para indicar una.`,
      );
      return 1;
    }

    for (const input of inputs) {
      const invalid = Array.from(input).find((symbol) => !config.inputAlphabet.includes(symbol));
      if (invalid !== undefined) {
        throw new UsageError(
          `La cadena ${describeInput(input)} contiene el símbolo "${invalid}", ` +
            `que no pertenece al alfabeto de entrada {${config.inputAlphabet.join(', ')}}.`,
        );
      }
    }

    const options: SimulationOptions =
      args.maxSteps === undefined ? {} : { maxSteps: args.maxSteps };
    const outcomes: string[] = [];

    deps.out(`Archivo: ${file}`);
    deps.out(`Cadenas a simular: ${inputs.length}`);

    for (const [index, input] of inputs.entries()) {
      let result: SimulationResult;
      try {
        result = deps.engine.run(config, input, options);
      } catch (error) {
        deps.err(`Error al simular la cadena ${describeInput(input)}: ${errorMessage(error)}`);
        return 1;
      }

      deps.out('');
      deps.out(`=== Cadena ${index + 1} de ${inputs.length}: ${describeInput(input)} ===`);
      deps.out(args.summaryOnly ? formatSummary(result) : formatResult(result));
      outcomes.push(
        `  ${input === '' ? '(vacía)' : input} -> ${statusLabel(result.status)} (${formatStepCount(result.steps)})`,
      );
    }

    deps.out('');
    deps.out('=== Resumen de todas las cadenas ===');
    deps.out(outcomes.join('\n'));
    return 0;
  } catch (error) {
    if (error instanceof UsageError) {
      deps.err(`${error.message}\nUse --help para ver las opciones.`);
      return 2;
    }
    deps.err(`Error inesperado: ${errorMessage(error)}`);
    return 1;
  }
}

/* ------------------------------------------------------------------ */
/* Punto de entrada: solo se ejecuta cuando este archivo se lanza       */
/* directamente (npm run dev / node dist/cli/main.js), no al importarlo */
/* ------------------------------------------------------------------ */

function isDirectRun(): boolean {
  const entry = process.argv[1];
  if (entry === undefined) return false;
  // Se comparan rutas del sistema (no URLs) y, en Windows, sin distinguir mayúsculas
  // (por ejemplo "c:" frente a "C:"), para que funcione igual en todos los sistemas.
  const normalize = (value: string): string =>
    process.platform === 'win32' ? value.toLowerCase() : value;
  return normalize(path.resolve(fileURLToPath(import.meta.url))) === normalize(path.resolve(entry));
}

if (isDirectRun()) {
  process.exitCode = await runCli(process.argv.slice(2));
}
