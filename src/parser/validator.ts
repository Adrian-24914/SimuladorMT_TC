import type { MachineConfig, ValidationIssue, ValidationResult } from '../shared/types.js';

/*
  Utilidad para validar la configuración de una máquina de Turing. 
  La función validateMachineConfig toma un objeto MachineConfig 
  como entrada y verifica que cumpla con los requisitos de una 
  máquina de Turing válida. Devuelve un objeto ValidationResult 
  que indica si la configuración es válida y, en caso contrario,
  proporciona detalles sobre los problemas encontrados.


*/

// Agrega problemas de validación para valores duplicados en un arreglo de cadenas.
function addDuplicates(values: string[], path: string, issues: ValidationIssue[]): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) issues.push({ path, message: `duplicate value "${value}"` });
    seen.add(value);
  }
}

// Valida la configuración de una máquina de Turing, verificando que cumpla con los requisitos
export function validateMachineConfig(config: MachineConfig): ValidationResult {
  // Arreglo para almacenar problemas de validación encontrados durante la verificación.
  const issues: ValidationIssue[] = []; 
  const stateSet = new Set(config.states); // únicos
  const inputSet = new Set(config.inputAlphabet); // únicos
  const tapeSet = new Set(config.tapeAlphabet); // únicos

  // Que los arreglos de estados y alfabetos no estén vacíos y que no haya duplicados.
  if (config.states.length === 0) issues.push({ path: 'mt.states', message: 'must not be empty' });
  // Que los alfabetos de entrada y cinta no estén vacíos y que no haya duplicados.
  if (config.tapeAlphabet.length === 0)
    issues.push({ path: 'mt.tape_alphabet', message: 'must not be empty' });

  // Que el alfabeto de entrada sea un subconjunto del alfabeto de la cinta.
  addDuplicates(config.states, 'mt.states', issues);
  addDuplicates(config.inputAlphabet, 'mt.input_alphabet', issues);
  addDuplicates(config.tapeAlphabet, 'mt.tape_alphabet', issues);

  // Recorrer el alfabeto de entrada y verificar que cada símbolo esté 
  // presente en el alfabeto de la cinta.
  for (const symbol of config.inputAlphabet) {
    if (!tapeSet.has(symbol))
      issues.push({
        path: 'mt.input_alphabet',
        message: `symbol "${symbol}" is not in tape_alphabet`,
      });
  }
  // Verificar que el estado inicial y los estados de aceptación estén definidos en el conjunto de estados.
  if (!stateSet.has(config.initialState))

    issues.push({ path: 'mt.initial_state', message: `unknown state "${config.initialState}"` });
  // Recorrer los estados de aceptación y verificar que cada uno esté presente en el conjunto de estados.
  for (const state of config.acceptStates) {
    if (!stateSet.has(state))
      issues.push({ path: 'mt.accept_states', message: `unknown state "${state}"` });
  }

  // Verificar que el símbolo en blanco esté definido en el alfabeto de la cinta y no esté presente en el alfabeto de entrada.
  if (!tapeSet.has(config.blankSymbol))
    issues.push({
      path: 'mt.blank',
      message: `symbol "${config.blankSymbol}" is not in tape_alphabet`,
    });

  // Verificar que el símbolo en blanco no esté presente en el alfabeto de entrada.
  if (inputSet.has(config.blankSymbol))
    issues.push({ path: 'mt.blank', message: 'must not belong to input_alphabet' });

  // Para cada transición, verificar que los estados y símbolos estén definidos en los
  // conjuntos correspondientes y que la dirección sea válida.

  config.transitions.forEach((transition, index) => {
    
    const path = `mt.transitions[${index}]`; // ruta de la transición actual para los problemas de validación

    // Si el estado actual o el estado siguiente no están presentes en el conjunto 
    // de estados, registrar un problema de validación.
    if (!stateSet.has(transition.currentState))
      issues.push({ path: `${path}.from`, message: `unknown state "${transition.currentState}"` });

    // Si el estado siguiente no está presente en el conjunto de estados, registrar 
    // un problema de validación.

    if (!stateSet.has(transition.nextState))
      issues.push({ path: `${path}.to`, message: `unknown state "${transition.nextState}"` });

    // Si el símbolo leído o escrito no está presente en el alfabeto de la cinta, registrar 
    // un problema de validación.

    if (!tapeSet.has(transition.readSymbol))
      issues.push({
        path: `${path}.read`,
        message: `symbol "${transition.readSymbol}" is not in tape_alphabet`,
      });

    // Si el símbolo escrito no está presente en el alfabeto de la cinta, registrar
    // un problema de validación.

    if (!tapeSet.has(transition.writeSymbol))
      issues.push({
        path: `${path}.write`,
        message: `symbol "${transition.writeSymbol}" is not in tape_alphabet`,
      });

    // Verificar que la dirección de la transición sea válida (L o R).

    if (transition.direction !== 'L' && transition.direction !== 'R')
      issues.push({ path: `${path}.move`, message: 'must be "L" or "R"' });
  });

  // Para cada string de entrada, verificar que todos los símbolos estén presentes en el 
  // alfabeto de entrada.
  
  config.inputStrings?.forEach((input, inputIndex) => {
    for (const symbol of input) {
      if (!inputSet.has(symbol))
        issues.push({
          path: `mt.inputs[${inputIndex}]`,
          message: `symbol "${symbol}" is not in input_alphabet`,
        });
    }
  });

  return { valid: issues.length === 0, issues };
}
