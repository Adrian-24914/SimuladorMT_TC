# Ejemplos de máquinas de Turing

Dos máquinas de una sola cinta, listas para ejecutarse con la CLI. Los resultados que se
muestran abajo son los obtenidos con el parser y el motor reales integrados en `main`, y están
verificados por `tests/cli/examples.test.ts`.

## Requisitos

Node.js 22 o superior y las dependencias instaladas:

```powershell
npm.cmd install
```

En sistemas distintos de Windows puede utilizarse `npm` en lugar de `npm.cmd`.

## Cómo ejecutarlos

Todas las cadenas definidas en el YAML, con historial paso a paso:

```powershell
npm.cmd run dev -- examples/reconocedora.yaml
npm.cmd run dev -- examples/alteradora.yaml
```

Solo el resultado final de cada cadena (sin historial):

```powershell
npm.cmd run dev -- examples/reconocedora.yaml --summary
npm.cmd run dev -- examples/alteradora.yaml --summary
```

Sin indicar archivo, la CLI lista los YAML de `examples/` y pide elegir uno por número:

```powershell
npm.cmd run dev
```

Otras opciones:

| Opción                   | Efecto                                                         |
| ------------------------ | -------------------------------------------------------------- |
| `-i`, `--input <cadena>` | Simula solo esa cadena (repetible). `""` es la cadena vacía.   |
| `--max-steps <n>`        | Límite de pasos por cadena (por defecto el del motor, 10 000). |
| `--summary`              | Muestra solo el resultado final.                               |
| `-h`, `--help`           | Muestra la ayuda.                                              |

Ejemplo: `npm.cmd run dev -- examples/reconocedora.yaml --input aabbcc --input aabbbcc`

También se puede compilar y ejecutar el JavaScript generado:

```powershell
npm.cmd run build
node dist/cli/main.js examples/reconocedora.yaml --summary
node dist/cli/main.js examples/alteradora.yaml --summary
```

Códigos de salida: `0` terminó (aunque haya cadenas rechazadas), `1` error de archivo, YAML o
simulación, `2` uso incorrecto de la línea de comandos.

## Salida

Cada cadena muestra las descripciones instantáneas (paso, estado, posición del cabezal y cinta,
con la celda bajo el cabezal entre corchetes) y el resultado final (aceptada, rechazada o límite
de pasos, estado final y cinta final). Al final se imprime un resumen de todas las cadenas.

## `reconocedora.yaml`: L = { aⁿbⁿcⁿ | n ≥ 1 }

La máquina relaciona tres bloques: marca una `a` con `X`, una `b` con `Y` y una `c` con `Z`
en cada ciclo. Después vuelve al extremo izquierdo y repite.

| Cadena         | Longitud | Resultado |
| -------------- | -------- | --------- |
| `aabbcc`       | 6        | Aceptada  |
| `aaabbbccc`    | 9        | Aceptada  |
| `aaaabbbbcccc` | 12       | Aceptada  |
| `aabbbcc`      | 7        | Rechazada |
| `aabbc`        | 5        | Rechazada |
| `aabccc`       | 6        | Rechazada |

## `alteradora.yaml`: duplicación de una cadena binaria

La transformación es `w -> ww`. La máquina marca los símbolos originales, anexa una copia
temporal al extremo derecho y finalmente restaura todos los marcadores. Los `□` son blancos.

| Entrada  | Longitud | Cinta final    |
| -------- | -------- | -------------- |
| `10101`  | 5        | `1010110101`   |
| `11010`  | 5        | `1101011010`   |
| `11111`  | 5        | `1111111111`   |
| `100101` | 6        | `100101100101` |

## Formato del YAML

Clave raíz `mt` con `states`, `input_alphabet`, `tape_alphabet`, `blank`, `initial`, `accept`,
`transitions` (cada una con `from`, `read: [símbolo]`, `write: [símbolo]`, `move: L|R`, `to`) e
`inputs` (cadenas a simular). Es el formato que acepta el parser actual (`src/parser`).
