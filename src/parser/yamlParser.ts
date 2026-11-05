import { parse } from 'yaml';
import type { Direction, MachineConfig, Transition, ValidationIssue } from '../shared/types.js';
import { validateMachineConfig } from './validator.js';

/*
  Utilidad para analizar y validar la configuración de una máquina de Turing a partir de un contenido YAML.
  La función parseMachine toma una cadena YAML como entrada, la analiza y valida, y devuelve un objeto 
  MachineConfig normalizado. Si el contenido YAML es inválido o no cumple con los requisitos de la 
  máquina de Turing, se lanza un error con detalles de validación.  
*/




// Representa un registro desconocido con claves de tipo string y valores de tipo desconocido.
// Luego se usa para validar y extraer campos de la configuración de la máquina de Turing.
type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Valida que un campo de cadena exista y no esté vacío, devolviendo su valor o
//  registrando un problema de validación si no es válido.

function stringField(
  source: UnknownRecord,
  names: string[],
  path: string,
  issues: ValidationIssue[],
): string {
  const value = names.map((name) => source[name]).find((candidate) => candidate !== undefined);
  if (typeof value !== 'string' || value.length === 0) {
    issues.push({ path, message: 'must be a non-empty string' });
    return '';
  }
  return value;
}

// Valida que un campo sea un arreglo de cadenas, devolviendo su valor o
// registrando un problema de validación si no es válido. El parámetro allowEmpty
// determina si se permiten cadenas vacías en el arreglo.

function stringArray(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  allowEmpty = false,
): string[] {
  if (!Array.isArray(value)) {
    issues.push({ path, message: 'must be an array of strings' });
    return [];
  }
  if (!value.every((item) => typeof item === 'string' && (allowEmpty || item.length > 0))) {
    issues.push({
      path,
      message: allowEmpty ? 'must contain only strings' : 'must contain only non-empty strings',
    });
    return [];
  }
  return value;
}


// Funcion auxiliar que permte validar que un campo de símbolo de 
// cinta contenga exactamente un símbolo (para máquinas de cinta única).

function oneTapeSymbol(value: unknown, path: string, issues: ValidationIssue[]): string {
  if (!Array.isArray(value) || value.length !== 1) {
    issues.push({
      path,
      message: 'must be a list containing exactly one symbol (single-tape machines only)',
    });
    return '';
  }
  if (typeof value[0] !== 'string' || value[0].length === 0) {
    issues.push({ path, message: 'must contain one non-empty string symbol' });
    return '';
  }
  return value[0];
}


// Función auxiliar que agrega problemas de validación para valores duplicados en un arreglo.
function formatIssues(issues: ValidationIssue[]): string {
  return issues.map((issue) => `- ${issue.path}: ${issue.message}`).join('\n');
}

// Función principal que parsea y valida el contenido YAML de una máquina de Turing.
export function parseMachine(yamlContent: string): MachineConfig {
  let document: unknown;

  // Leer y parsear el contenido YAML, capturando errores de sintaxis.]
  try {
    document = parse(yamlContent);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid YAML: ${detail}`);
  }
  if (!isRecord(document) || !isRecord(document.mt)) {
    throw new Error('Invalid machine configuration:\n- mt: must be an object');
  }

  // Mapear y validar los campos de la configuración de la máquina de Turing,
  // registrando problemas de validación.
  const mt = document.mt;
  const issues: ValidationIssue[] = [];
  const states = stringArray(mt.states, 'mt.states', issues);
  const inputAlphabet = stringArray(mt.input_alphabet, 'mt.input_alphabet', issues);
  const tapeAlphabet = stringArray(mt.tape_alphabet, 'mt.tape_alphabet', issues);
  const blankSymbol = stringField(mt, ['blank', 'blank_symbol'], 'mt.blank', issues);
  const initialState = stringField(mt, ['initial_state', 'initial'], 'mt.initial_state', issues);
  const acceptStates = stringArray(mt.accept_states ?? mt.accept, 'mt.accept_states', issues);

  // Mapear las transiciones de la máquina de Turing, validando cada transición y 
  // registrando problemas de validación.

  const transitions: Transition[] = [];

  // 1. Validar que mt.transitions sea un arreglo.
  if (!Array.isArray(mt.transitions)) {
    issues.push({ path: 'mt.transitions', message: 'must be an array' });
  } else {

    // 2. Validar cada transición individualmente.
    mt.transitions.forEach((rawTransition, index) => {
      const path = `mt.transitions[${index}]`;
      // 3. Validar que cada transición sea un objeto.
      if (!isRecord(rawTransition)) {
        issues.push({ path, message: 'must be an object' });
        return;
      }
      // 4. Validar y extraer los campos de la transición, registrando problemas de validación.
      const direction = stringField(rawTransition, ['move'], `${path}.move`, issues);
      // 5. Agregar la transición validada al arreglo de transiciones.
      transitions.push({
        currentState: stringField(rawTransition, ['from'], `${path}.from`, issues),
        readSymbol: oneTapeSymbol(rawTransition.read, `${path}.read`, issues),
        writeSymbol: oneTapeSymbol(rawTransition.write, `${path}.write`, issues),
        direction: direction as Direction,
        nextState: stringField(rawTransition, ['to'], `${path}.to`, issues),
      });
    });
  }

  // Validar que no haya problemas de validación antes de construir la configuración final.
  let inputStrings: string[] | undefined;
  // Leer y validar los strings de entrada, si están presentes.
  if (mt.inputs !== undefined) inputStrings = stringArray(mt.inputs, 'mt.inputs', issues, true);
  // Si hay problemas de validación, lanzar un error con los detalles.
  if (issues.length > 0) throw new Error(`Invalid machine configuration:\n${formatIssues(issues)}`);

  // Construir la configuración final de la máquina de Turing.
  const config: MachineConfig = {
    states,
    inputAlphabet,
    tapeAlphabet,
    blankSymbol,
    initialState,
    acceptStates,
    transitions,
    ...(inputStrings === undefined ? {} : { inputStrings }),
  };
  // Validar la configuración de la máquina de Turing usando la función validateMachineConfig.
  const validation = validateMachineConfig(config);
  // Si la validación falla, lanzar un error con los detalles de validación.
  if (!validation.valid)
    throw new Error(`Invalid machine configuration:\n${formatIssues(validation.issues)}`);
  return config;
}
