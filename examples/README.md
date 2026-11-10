# Ejemplos de máquinas de Turing

Dos máquinas de una sola cinta, listas para ejecutarse con la CLI. Los resultados que se
muestran abajo son los obtenidos con el parser y el motor reales integrados en `main`, y están
verificados por `tests/cli/examples.test.ts`.

## Requisitos

Node.js 22 o superior y las dependencias instaladas:

```bash
npm install
```

## Cómo ejecutarlos

Todas las cadenas definidas en el YAML, con historial paso a paso:

```bash
npm run dev -- examples/reconocedora.yaml
npm run dev -- examples/alteradora.yaml
```

Solo el resultado final de cada cadena (sin historial):

```bash
npm run dev -- examples/reconocedora.yaml --summary
```

Sin indicar archivo, la CLI lista los YAML de `examples/` y pide elegir uno por número:

```bash
npm run dev
```

Otras opciones:

| Opción                   | Efecto                                                         |
| ------------------------ | -------------------------------------------------------------- |
| `-i`, `--input <cadena>` | Simula solo esa cadena (repetible). `""` es la cadena vacía.   |
| `--max-steps <n>`        | Límite de pasos por cadena (por defecto el del motor, 10 000). |
| `--summary`              | Muestra solo el resultado final.                               |
| `-h`, `--help`           | Muestra la ayuda.                                              |

Ejemplo: `npm run dev -- examples/reconocedora.yaml --input aaabbb --input aaabb`

También se puede compilar y ejecutar el JavaScript generado:

```bash
npm run build
node dist/cli/main.js examples/alteradora.yaml --summary
```

Códigos de salida: `0` terminó (aunque haya cadenas rechazadas), `1` error de archivo, YAML o
simulación, `2` uso incorrecto de la línea de comandos.

## Salida

Cada cadena muestra las descripciones instantáneas (paso, estado, posición del cabezal y cinta,
con la celda bajo el cabezal entre corchetes) y el resultado final (aceptada, rechazada o límite
de pasos, estado final y cinta final). Al final se imprime un resumen de todas las cadenas.

## `reconocedora.yaml`: L = { aⁿbⁿ | n ≥ 1 }

| Cadena       | Longitud | Resultado |
| ------------ | -------- | --------- |
| `aaabbb`     | 6        | Aceptada  |
| `aaaabbbb`   | 8        | Aceptada  |
| `aaaaabbbbb` | 10       | Aceptada  |
| `aaabb`      | 5        | Rechazada |
| `aabbb`      | 5        | Rechazada |
| `ababab`     | 6        | Rechazada |

## `alteradora.yaml`: suma 1 a un número binario

La cinta final contiene el resultado (los `□` son blancos).

| Entrada  | Longitud | Cinta final |
| -------- | -------- | ----------- |
| `10111`  | 5        | `11000`     |
| `11111`  | 5        | `100000`    |
| `10100`  | 5        | `10101`     |
| `101011` | 6        | `101100`    |

## Formato del YAML

Clave raíz `mt` con `states`, `input_alphabet`, `tape_alphabet`, `blank`, `initial`, `accept`,
`transitions` (cada una con `from`, `read: [símbolo]`, `write: [símbolo]`, `move: L|R`, `to`) e
`inputs` (cadenas a simular). Es el formato que acepta el parser actual (`src/parser`).
