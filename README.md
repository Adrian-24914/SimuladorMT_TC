# Simulador de Máquinas de Turing

Simulador académico de máquinas de Turing deterministas de una sola cinta, implementado en
TypeScript. Las máquinas se describen mediante archivos YAML y pueden ejecutarse desde una CLI
que muestra el historial completo de descripciones instantáneas y el resultado final.

## Video de demostración

[Ver explicación y demostración del simulador en YouTube](https://youtu.be/G9qysJE4Bck)

## Funcionalidades

- Lectura y validación de máquinas definidas en YAML.
- Cinta que crece hacia la izquierda y la derecha con celdas blancas implícitas.
- Lectura, escritura y movimiento del cabezal en direcciones `L` y `R`.
- Búsqueda determinista de transiciones por estado y símbolo leído.
- Historial con la configuración inicial y cada configuración posterior.
- Resultados diferenciados: `accepted`, `rejected` y `step_limit`.
- Límite configurable de pasos, con un valor predeterminado de 10 000.
- Ejecución de las entradas del YAML o de cadenas proporcionadas por terminal.
- Salida detallada o resumida.

## Requisitos

- Node.js 22 o superior.
- npm.

## Instalación

En PowerShell:

```powershell
cd C:\U_progra\6to\Compu\SimuladorMT_TC
npm.cmd install
```

En otros sistemas puede utilizarse `npm install`.

## Ejecución

Modo de desarrollo:

```powershell
npm.cmd run dev -- examples/reconocedora.yaml
```

Compilar y ejecutar el JavaScript generado:

```powershell
npm.cmd run build
node dist/cli/main.js examples/reconocedora.yaml
```

Si no se proporciona un archivo, la CLI permite seleccionar uno de `examples/`:

```powershell
npm.cmd run dev
```

### Opciones de la CLI

| Opción                 | Descripción                                                     |
| ---------------------- | --------------------------------------------------------------- |
| `-i, --input <cadena>` | Ejecuta una entrada concreta; puede repetirse.                  |
| `--max-steps <n>`      | Establece el límite de pasos para cada entrada.                 |
| `--summary`            | Oculta el historial y muestra solamente los resultados finales. |
| `-h, --help`           | Muestra la ayuda disponible.                                    |

Ejemplos:

```powershell
node dist/cli/main.js examples/reconocedora.yaml --input aabbcc
node dist/cli/main.js examples/reconocedora.yaml --input aabbcc --input aabbbcc --summary
node dist/cli/main.js examples/alteradora.yaml --summary
node dist/cli/main.js examples/alteradora.yaml --input 10101 --max-steps 20 --summary
```

## Máquinas incluidas

### Reconocedora

`examples/reconocedora.yaml` reconoce el lenguaje:

$$
L = \{a^n b^n c^n \mid n \geq 1\}
$$

Utiliza `X`, `Y` y `Z` para marcar una `a`, una `b` y una `c` en cada ciclo. Incluye tres
cadenas aceptadas y tres rechazadas, todas con longitud mínima de cinco.

### Alteradora

`examples/alteradora.yaml` transforma una cadena binaria `w` en `ww`. Marca los símbolos
originales, anexa una copia temporal al extremo derecho y finalmente restaura los marcadores.
Incluye cuatro entradas de longitud mínima de cinco.

Los resultados y las transiciones se documentan en [examples/README.md](examples/README.md).

## Arquitectura

El flujo principal es:

```text
archivo YAML
    -> parser y validador
    -> MachineConfig
    -> motor de simulación
    -> SimulationResult
    -> formateador y CLI
```

- `src/shared/`: contratos compartidos entre módulos.
- `src/parser/`: lectura de YAML, normalización y validación.
- `src/core/`: cinta, búsqueda de transiciones y simulación.
- `src/cli/`: argumentos, selección de archivos y presentación de resultados.
- `tests/`: pruebas unitarias y de integración.
- `examples/`: máquinas YAML listas para ejecutar.

La explicación detallada se encuentra en [ARCHITECTURE.md](ARCHITECTURE.md).

## Calidad y pruebas

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
npm.cmd run lint
npm.cmd run format:check
```

Las pruebas cubren parser, validación, cinta, transiciones, simulación, condiciones de parada,
formateo, CLI y ejecución real de los YAML incluidos.

## Formato básico del YAML

```yaml
mt:
  name: ejemplo
  states: [q0, q_accept]
  input_alphabet: [a]
  tape_alphabet: [a, X, '□']
  blank: '□'
  initial: q0
  accept: [q_accept]
  transitions:
    - from: q0
      read: [a]
      write: [X]
      move: R
      to: q_accept
  inputs: [aaaaa]
```

Cada combinación de estado y símbolo leído puede tener como máximo una transición.
