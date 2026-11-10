# Simulador de Máquinas de Turing

Base académica en TypeScript para desarrollar, en módulos independientes, una CLI que simule máquinas de Turing de una sola cinta.

> Estado: scaffold inicial. El parser, el motor, la presentación de resultados y los ejemplos aún no han sido verificados contra `Proyecto_3.pdf`. No se afirma que exista una simulación funcional.

## Video de demostración

[Ver explicación y demostración del simulador en YouTube](https://youtu.be/G9qysJE4Bck)

## Requisitos previos

- Node.js 22 o superior.
- npm (incluido con Node.js).
- Git.

## Instalación

Desde este directorio:

```bash
npm install
```

## Comandos

| Comando | Propósito |
| --- | --- |
| `npm run dev` | Imprime un aviso de desarrollo; no simula. |
| `npm run build` | Compila `src/` a `dist/`. |
| `npm run typecheck` | Verifica tipos de fuente y pruebas. |
| `npm test` | Ejecuta pruebas unitarias iniciales con Vitest. |
| `npm run lint` | Analiza el código con ESLint. |
| `npm run format` | Aplica Prettier. |
| `npm run format:check` | Comprueba formato sin modificar archivos. |

## Estructura

```text
src/shared/  Contratos estables compartidos
src/parser/  Adaptación de YAML y validación
src/core/    Cinta, transiciones y simulación
src/cli/     Entrada de consola y presentación
 tests/      Pruebas separadas por módulo
examples/    Borradores YAML de máquina reconocedora y alteradora
.github/     Automatización de verificaciones de calidad
```

## Pruebas

Ejecuta `npm test`. Las pruebas actuales verifican que los puntos aún no implementados estén expuestos y fallen explícitamente; no prueban comportamiento de simulación. Para probar módulos de forma independiente, usa `MachineConfig`/`SimulationResult` escritos a mano y mocks, sin importar implementaciones internas de otros módulos.

## Estado y trabajo pendiente

- Parser: lectura YAML, esquema final, validación y errores descriptivos.
- Core: cinta ilimitada, motor de transición, historial, condiciones de parada y límite de pasos.
- CLI: argumentos/selección de archivos, visualización paso a paso y salida final.
- Ejemplos: confirmar formato y semántica con los requisitos exactos de `Proyecto_3.pdf`.
- Revisar y regenerar `package-lock.json` ejecutando `npm install` al integrar dependencias.
