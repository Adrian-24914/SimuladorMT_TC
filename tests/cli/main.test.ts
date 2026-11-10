import { describe, expect, it } from 'vitest';
import type { MachineConfig, SimulationResult } from '../../src/shared/types.js';
import { UsageError, parseArgs, runCli, type CliDeps, type Engine } from '../../src/cli/main.js';

// Máquina y resultados construidos a mano. El motor de este archivo es un MOCK:
// no ejecuta ninguna máquina de Turing, solo comprueba cómo la CLI usa sus resultados.
const mockConfig: MachineConfig = {
  states: ['q0', 'qa'],
  inputAlphabet: ['a', 'b'],
  tapeAlphabet: ['a', 'b', '□'],
  blankSymbol: '□',
  initialState: 'q0',
  acceptStates: ['qa'],
  transitions: [],
  inputStrings: ['aaaaa', 'bbbbb'],
};

function mockResult(status: SimulationResult['status'], steps: number): SimulationResult {
  return {
    status,
    history: [{ state: 'q0', tape: ['a'], headPosition: 0, step: 0 }],
    finalState: status === 'accepted' ? 'qa' : 'q0',
    finalTape: ['a'],
    finalHeadPosition: 0,
    steps,
  };
}

interface Harness {
  deps: Partial<CliDeps>;
  out: string[];
  err: string[];
  runCalls: { input: string; maxSteps: number | undefined }[];
  prompts: string[];
}

function createHarness(
  options: {
    files?: Record<string, string>;
    config?: MachineConfig;
    loadError?: Error;
    runError?: Error;
    answer?: string;
    yamlFiles?: string[] | Error;
  } = {},
): Harness {
  const out: string[] = [];
  const err: string[] = [];
  const prompts: string[] = [];
  const runCalls: Harness['runCalls'] = [];
  const files = options.files ?? { 'maquina.yaml': 'contenido simulado' };

  const engine: Engine = {
    loadMachine: () => {
      if (options.loadError) throw options.loadError;
      return options.config ?? mockConfig;
    },
    run: (_config, input, runOptions) => {
      if (options.runError) throw options.runError;
      runCalls.push({ input, maxSteps: runOptions.maxSteps });
      return input.startsWith('a') ? mockResult('accepted', 3) : mockResult('rejected', 1);
    },
  };

  const deps: Partial<CliDeps> = {
    engine,
    examplesDir: 'ejemplos',
    readFile: async (filePath) => {
      const content = files[filePath];
      if (content === undefined) throw new Error(`ENOENT: ${filePath}`);
      return content;
    },
    listYamlFiles: async () => {
      if (options.yamlFiles instanceof Error) throw options.yamlFiles;
      return options.yamlFiles ?? ['uno.yaml', 'dos.yaml'];
    },
    prompt: async (question) => {
      prompts.push(question);
      return options.answer ?? '1';
    },
    out: (text) => out.push(text),
    err: (text) => err.push(text),
  };

  return { deps, out, err, runCalls, prompts };
}

describe('parseArgs', () => {
  it('lee archivo, cadenas, límite de pasos y resumen', () => {
    const args = parseArgs([
      'examples/reconocedora.yaml',
      '--input',
      'aaabbb',
      '-i',
      '',
      '--max-steps',
      '50',
      '--summary',
    ]);
    expect(args).toEqual({
      help: false,
      file: 'examples/reconocedora.yaml',
      inputs: ['aaabbb', ''],
      maxSteps: 50,
      summaryOnly: true,
    });
  });

  it('acepta la forma --opción=valor', () => {
    const args = parseArgs(['--input=abab', '--max-steps=7']);
    expect(args.inputs).toEqual(['abab']);
    expect(args.maxSteps).toBe(7);
  });

  it('sin argumentos no fija archivo ni límite', () => {
    const args = parseArgs([]);
    expect(args).toEqual({ help: false, inputs: [], summaryOnly: false });
    expect('file' in args).toBe(false);
    expect('maxSteps' in args).toBe(false);
  });

  it('reconoce la ayuda', () => {
    expect(parseArgs(['--help']).help).toBe(true);
    expect(parseArgs(['-h']).help).toBe(true);
  });

  it('rechaza opciones desconocidas', () => {
    expect(() => parseArgs(['--nada'])).toThrow(UsageError);
    expect(() => parseArgs(['--nada'])).toThrow('Opción desconocida: --nada');
  });

  it('rechaza opciones sin valor', () => {
    expect(() => parseArgs(['--input'])).toThrow('requiere una cadena');
    expect(() => parseArgs(['--max-steps'])).toThrow('requiere un número');
  });

  it('rechaza un límite de pasos que no sea entero no negativo', () => {
    expect(() => parseArgs(['--max-steps', 'abc'])).toThrow('entero no negativo');
    expect(() => parseArgs(['--max-steps=-3'])).toThrow('entero no negativo');
    expect(() => parseArgs(['--max-steps', '1.5'])).toThrow('entero no negativo');
  });

  it('rechaza más de un archivo', () => {
    expect(() => parseArgs(['a.yaml', 'b.yaml'])).toThrow('Solo se admite un archivo YAML');
  });
});

describe('runCli', () => {
  it('muestra la ayuda y termina con código 0', async () => {
    const h = createHarness();
    expect(await runCli(['--help'], h.deps)).toBe(0);
    expect(h.out.join('\n')).toContain('Uso:');
    expect(h.runCalls).toHaveLength(0);
  });

  it('simula cada cadena del YAML y muestra resultado por cadena', async () => {
    const h = createHarness();
    const code = await runCli(['maquina.yaml'], h.deps);

    expect(code).toBe(0);
    expect(h.runCalls.map((call) => call.input)).toEqual(['aaaaa', 'bbbbb']);
    const text = h.out.join('\n');
    expect(text).toContain('Archivo: maquina.yaml');
    expect(text).toContain('Cadenas a simular: 2');
    expect(text).toContain('=== Cadena 1 de 2: "aaaaa" (longitud 5) ===');
    expect(text).toContain('=== Cadena 2 de 2: "bbbbb" (longitud 5) ===');
    expect(text).toContain('Historial de descripciones instantáneas:');
    expect(text).toContain('Resultado: ACEPTADA');
    expect(text).toContain('Resultado: RECHAZADA');
    expect(text).toContain('=== Resumen de todas las cadenas ===');
    expect(text).toContain('aaaaa -> ACEPTADA (3 pasos)');
    expect(text).toContain('bbbbb -> RECHAZADA (1 paso)');
    expect(h.err).toHaveLength(0);
  });

  it('con --input ignora las cadenas del YAML', async () => {
    const h = createHarness();
    await runCli(['maquina.yaml', '--input', 'abab'], h.deps);
    expect(h.runCalls.map((call) => call.input)).toEqual(['abab']);
  });

  it('con --summary omite el historial', async () => {
    const h = createHarness();
    await runCli(['maquina.yaml', '--summary'], h.deps);
    const text = h.out.join('\n');
    expect(text).not.toContain('Historial de descripciones instantáneas:');
    expect(text).toContain('Resultado: ACEPTADA');
  });

  it('pasa --max-steps al motor y no lo fija si no se indica', async () => {
    const withLimit = createHarness();
    await runCli(['maquina.yaml', '--max-steps', '25'], withLimit.deps);
    expect(withLimit.runCalls.every((call) => call.maxSteps === 25)).toBe(true);

    const withoutLimit = createHarness();
    await runCli(['maquina.yaml'], withoutLimit.deps);
    expect(withoutLimit.runCalls.every((call) => call.maxSteps === undefined)).toBe(true);
  });

  it('permite simular la cadena vacía', async () => {
    const h = createHarness();
    await runCli(['maquina.yaml', '--input', ''], h.deps);
    expect(h.runCalls.map((call) => call.input)).toEqual(['']);
    expect(h.out.join('\n')).toContain('"" (cadena vacía)');
    expect(h.out.join('\n')).toContain('(vacía) ->');
  });

  it('sin archivo ofrece la lista y usa el número elegido', async () => {
    const h = createHarness({ files: { 'ejemplos/dos.yaml': 'x' }, answer: '2' });
    const code = await runCli([], h.deps);
    expect(code).toBe(0);
    const text = h.out.join('\n');
    expect(text).toContain('1) uno.yaml');
    expect(text).toContain('2) dos.yaml');
    expect(text).toContain('Archivo: ejemplos/dos.yaml');
    expect(h.prompts).toHaveLength(1);
  });

  it('rechaza una selección inválida con código 2', async () => {
    const h = createHarness({ answer: '9' });
    expect(await runCli([], h.deps)).toBe(2);
    expect(h.err.join('\n')).toContain('Selección inválida: "9"');
    expect(h.runCalls).toHaveLength(0);
  });

  it('informa cuando no hay archivos YAML para elegir', async () => {
    const h = createHarness({ yamlFiles: [] });
    expect(await runCli([], h.deps)).toBe(2);
    expect(h.err.join('\n')).toContain('No hay archivos YAML');
  });

  it('informa cuando no se puede leer la carpeta de ejemplos', async () => {
    const h = createHarness({ yamlFiles: new Error('sin permiso') });
    expect(await runCli([], h.deps)).toBe(2);
    expect(h.err.join('\n')).toContain('No se pudo leer la carpeta "ejemplos": sin permiso');
  });

  it('devuelve 2 ante argumentos inválidos', async () => {
    const h = createHarness();
    expect(await runCli(['--max-steps', 'x'], h.deps)).toBe(2);
    expect(h.err.join('\n')).toContain('Use --help');
  });

  it('devuelve 1 si el archivo no se puede leer', async () => {
    const h = createHarness();
    expect(await runCli(['no-existe.yaml'], h.deps)).toBe(1);
    expect(h.err.join('\n')).toContain('No se pudo leer el archivo "no-existe.yaml"');
  });

  it('devuelve 1 y muestra el detalle si el parser rechaza el YAML', async () => {
    const h = createHarness({ loadError: new Error('Invalid machine configuration:\n- mt: x') });
    expect(await runCli(['maquina.yaml'], h.deps)).toBe(1);
    const text = h.err.join('\n');
    expect(text).toContain('Error en la configuración de "maquina.yaml"');
    expect(text).toContain('Invalid machine configuration');
    expect(h.runCalls).toHaveLength(0);
  });

  it('devuelve 1 si el archivo no define cadenas y no se pasó --input', async () => {
    const withoutInputs: MachineConfig = { ...mockConfig };
    delete withoutInputs.inputStrings;
    const h = createHarness({ config: withoutInputs });
    expect(await runCli(['maquina.yaml'], h.deps)).toBe(1);
    expect(h.err.join('\n')).toContain('no define cadenas');
  });

  it('rechaza cadenas con símbolos fuera del alfabeto de entrada', async () => {
    const h = createHarness();
    expect(await runCli(['maquina.yaml', '--input', 'abcab'], h.deps)).toBe(2);
    expect(h.err.join('\n')).toContain('símbolo "c"');
    expect(h.runCalls).toHaveLength(0);
  });

  it('devuelve 1 si el motor falla al simular', async () => {
    const h = createHarness({ runError: new RangeError('maxSteps inválido') });
    expect(await runCli(['maquina.yaml'], h.deps)).toBe(1);
    expect(h.err.join('\n')).toContain('Error al simular la cadena "aaaaa"');
  });
});
