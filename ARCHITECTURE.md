# Arquitectura del simulador

## Objetivo del diseño

El programa separa la definición de una máquina, su validación, la simulación y la presentación
de resultados. El motor no lee archivos ni conoce el formato YAML, por lo que una máquina nueva
puede agregarse sin modificar la lógica de simulación.

## Flujo de ejecución

```text
archivo YAML
    -> CLI: lectura del archivo
    -> parser: conversión y normalización
    -> validator: validación semántica
    -> MachineConfig
    -> core.simulate
    -> SimulationResult
    -> formatter/output
    -> terminal
```

La CLI integra los módulos únicamente mediante sus APIs públicas:

- `src/parser/index.ts`: `parseMachine` y `validateMachineConfig`.
- `src/core/index.ts`: `createTape`, `findTransition`, `simulate` y
  `DEFAULT_MAX_STEPS`.

## Módulo `shared`

`src/shared/types.ts` contiene los contratos neutrales compartidos:

- `Transition`: estado actual, símbolo leído, símbolo escrito, dirección y siguiente estado.
- `MachineConfig`: definición normalizada de una máquina determinista de una cinta.
- `InstantaneousDescription`: estado, copia de la cinta, posición del cabezal y paso.
- `SimulationResult`: estado de terminación, historial y configuración final.
- `SimulationOptions`: opciones de ejecución, incluido `maxSteps`.
- `ValidationResult`: resultado y detalles de la validación.

`SimulationStatus` distingue tres terminaciones:

- `accepted`: se alcanzó un estado de aceptación.
- `rejected`: no existe una transición aplicable fuera de un estado de aceptación.
- `step_limit`: existe una transición aplicable, pero ejecutarla excedería el límite.

## Módulo `parser`

El parser recibe texto YAML y devuelve un `MachineConfig`. Su responsabilidad es adaptar los
nombres externos, como `input_alphabet`, `from` y `to`, a los nombres internos de TypeScript.

Las propiedades `read` y `write` del YAML son arreglos de exactamente un elemento porque el
simulador implementa una sola cinta. El parser normaliza esos elementos a `readSymbol` y
`writeSymbol`.

El validador comprueba, entre otros aspectos:

- existencia y formato de los campos requeridos;
- pertenencia de estados y símbolos a sus alfabetos;
- validez de los estados iniciales y de aceptación;
- direcciones permitidas (`L` o `R`);
- transiciones deterministas sin duplicados por estado y símbolo;
- compatibilidad de las entradas configuradas con el alfabeto de entrada.

Los errores se comunican antes de iniciar la simulación.

## Módulo `core`

### Cinta

`src/core/tape.ts` representa la cinta mediante un arreglo y un índice de cabezal. La entrada
ocupa inicialmente las celdas de izquierda a derecha; una entrada vacía comienza con una celda
en blanco.

- Al mover a la derecha después de la última celda, se agrega un blanco al final.
- Al mover a la izquierda desde la posición cero, se agrega un blanco al principio.
- `toArray()` devuelve una copia para que los historiales no cambien después de registrarse.

De esta forma, `headPosition` siempre es un índice válido dentro del arreglo expuesto.

### Motor de transiciones

`src/core/transitionEngine.ts` busca una transición cuya combinación de `currentState` y
`readSymbol` coincida exactamente con la configuración actual. Devuelve `undefined` cuando no
existe una transición aplicable.

### Simulación

`src/core/turingMachine.ts` ejecuta el siguiente ciclo:

1. Crea la cinta y registra la configuración inicial como paso cero.
2. Comprueba si el estado actual es de aceptación.
3. Busca una transición para el estado y símbolo actuales.
4. Si no existe, devuelve `rejected`.
5. Si el siguiente paso excedería `maxSteps`, devuelve `step_limit`.
6. Escribe el símbolo, mueve el cabezal y actualiza el estado.
7. Incrementa el paso y guarda una nueva descripción instantánea.
8. Repite desde la comprobación de aceptación.

La aceptación y la detención natural se comprueban antes del límite. Por ello, una máquina que
acepta o se bloquea exactamente al alcanzar el máximo conserva su resultado real. El límite
predeterminado es `DEFAULT_MAX_STEPS = 10_000`.

El `SimulationResult` conserva:

- estado de terminación;
- historial completo;
- estado final;
- cinta final;
- posición final del cabezal;
- cantidad de transiciones ejecutadas.

## Módulo `cli`

`src/cli/main.ts` es el punto de integración. Sus responsabilidades son:

- interpretar los argumentos;
- permitir seleccionar un YAML de `examples/`;
- leer el archivo;
- llamar al parser y al motor mediante `realEngine`;
- validar las entradas proporcionadas por terminal;
- ejecutar una o varias cadenas;
- seleccionar salida detallada o resumida;
- establecer códigos de salida para éxito, error y uso incorrecto.

`src/cli/formatter.ts` transforma el historial y el resultado en texto. La celda bajo el cabezal
se muestra entre corchetes. `src/cli/output.ts` envía el texto a la consola o a un destino
inyectado.

## Dependencias entre módulos

```text
parser -> shared
core   -> shared
cli    -> parser + core + shared
```

El parser no depende del motor. El motor no depende del YAML, del sistema de archivos ni de la
consola. Esta separación permite probar cada componente de manera independiente.

## Estrategia de pruebas

- `tests/parser/`: conversión de YAML y validación.
- `tests/core/`: cinta, transiciones, historial, aceptación, rechazo y límite de pasos.
- `tests/cli/formatter.test.ts`: presentación del historial y resultados.
- `tests/cli/output.test.ts`: envío de salida a destinos inyectados.
- `tests/cli/main.test.ts`: argumentos y flujo de la CLI con dependencias simuladas.
- `tests/cli/examples.test.ts`: integración real de parser, motor y YAML de `examples/`.

Las pruebas de integración verifican la reconocedora de `a^n b^n c^n` y la alteradora que
duplica cadenas binarias mediante la transformación `w -> ww`.

## Extensibilidad

Para agregar otra máquina compatible solo se necesita crear un YAML con estados, alfabetos y
transiciones válidas. No es necesario modificar el parser, la cinta, el motor ni la CLI.

El formato actual representa máquinas deterministas de una cinta y admite únicamente movimientos
`L` y `R`.
