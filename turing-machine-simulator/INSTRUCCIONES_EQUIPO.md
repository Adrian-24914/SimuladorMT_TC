# Instrucciones para el equipo

Este documento está dirigido a las tres personas que desarrollarán el simulador. Antes de programar, consulten `ARCHITECTURE.md` y confirmen el esquema de YAML y las reglas de movimiento con `Proyecto_3.pdf`.

## Preparación común

1. Clona el repositorio y entra al directorio `turing-machine-simulator/`.
2. Ejecuta `npm install`.
3. Ejecuta `npm run typecheck`, `npm test` y `npm run lint` antes de comenzar.
4. Cada persona trabaja en su rama y conserva `main` como rama estable.

```bash
git clone <URL_DEL_REPOSITORIO>
cd <repositorio>/turing-machine-simulator
npm install
```

## Integrante 1 — Parser YAML

**Rama:** `feature/parser`  
**Puede modificar principalmente:** `src/parser/` y `tests/parser/`.

Implementa `parseMachine(yamlContent): MachineConfig` y `validateMachineConfig(config)`. Lee la clave raíz `mt`; valida estados, alfabetos, estado inicial, estados de aceptación y transiciones. Normaliza `read`/`write` de arreglos YAML de una sola cinta a símbolos string. Define errores claros para YAML inválido, campos faltantes y arreglos de longitud incorrecta. No importes el motor ni la CLI.

Pruebas: YAML válido que coincide con `MachineConfig`; campos faltantes; estado desconocido; símbolos fuera de alfabeto; direcciones inválidas; lectura/escritura con cero o más de un símbolo.

## Integrante 2 — Motor

**Rama:** `feature/core`  
**Puede modificar principalmente:** `src/core/` y `tests/core/`.

Implementa `createTape`, `findTransition` y `simulate(config, input, options?)`. Usa una cinta única, movimiento de cabezal, escritura, cambio de estado, historial de descripciones instantáneas y estados `accepted`, `rejected` o `step_limit`. El significado del paso inicial/final, de la cinta vacía y del máximo de pasos debe documentarse y contrastarse con el PDF. No dependas del parser ni de la CLI.

Pruebas: lectura/escritura y movimiento a ambos lados; transición aplicable/no aplicable; aceptación; rechazo por ausencia de transición; historial; límite de pasos; entrada vacía.

## Integrante 3 — CLI y ejemplos

**Rama:** `feature/cli`  
**Puede modificar principalmente:** `src/cli/`, `tests/cli/` y `examples/`.

Implementa argumentos o selección de archivo, carga YAML usando la API pública del parser, invocación del core, `formatResult` y `outputResult`. Mostrar estado, pasos, historial/cinta y configuración final sin afirmar resultados no calculados. Ajusta `reconocedora.yaml` y `alteradora.yaml` al formato exacto del PDF. No implementes reglas del motor dentro de la CLI.

Pruebas: argumentos inválidos, formato de estados/resultados y salida usando objetos `SimulationResult` de prueba, sin ejecutar una máquina real.

## Crear rama y mantenerla actualizada

```bash
git switch main
git pull origin main
git switch -c feature/parser   # o feature/core / feature/cli
```

Antes de trabajar y antes de abrir PR:

```bash
git fetch origin
git rebase origin/main
```

Resuelve conflictos con el equipo si afectan contratos compartidos; no fuerces `push` a `main`. Publica la rama:

```bash
git push -u origin feature/parser
```

## Commits y Pull Requests

Haz commits pequeños, enfocados y descriptivos, por ejemplo:

```bash
git add src/parser tests/parser
git commit -m "feat(parser): validate one-tape transitions"
git push
```

Abre un PR de tu rama hacia `main`. Describe alcance, decisiones, pruebas ejecutadas y cualquier cambio de contrato. Solicita revisión a los otros integrantes. Integra solo cuando CI pase y el equipo apruebe. Después del merge, actualiza tu rama o elimínala si ya no se necesita.

## Conflictos básicos

1. Ejecuta `git status` y revisa qué archivos están en conflicto.
2. Abre cada archivo y combina los cambios intencionalmente; elimina marcadores `<<<<<<<`, `=======`, `>>>>>>>`.
3. Ejecuta `npm run typecheck`, `npm test` y `npm run lint`.
4. Marca resueltos con `git add <archivo>` y continúa el rebase (`git rebase --continue`) o crea el commit de merge.
5. Si un conflicto afecta `src/shared/types.ts`, detente y coordina con todos antes de elegir una versión.

## No modificar sin consultar

- `src/shared/types.ts` y `src/shared/index.ts`: contratos usados por los tres módulos.
- `package.json`, `package-lock.json`, TypeScript, ESLint, Prettier y workflow de CI.
- Archivos asignados a otra persona. Si se requiere un cambio transversal, acuerden el alcance y divídanlo en PRs pequeños.

## Criterios de aceptación por módulo

- La API pública respeta los contratos compartidos y no filtra detalles internos.
- No quedan placeholders `Not implemented` en el alcance del módulo terminado.
- Pruebas unitarias cubren casos normales y errores relevantes y pasan.
- `npm run typecheck`, `npm run lint`, `npm test` y `npm run build` pasan localmente.
- La documentación se actualiza y el PR explica cómo se verificó el trabajo.

El scaffold actual sí contiene placeholders intencionales; son trabajo pendiente, no criterios ya satisfechos.
