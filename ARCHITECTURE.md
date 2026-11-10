# Arquitectura

## Límites de módulos

- `shared`: interfaces TypeScript neutrales al formato YAML y a la consola. Es el único contrato importado por los tres módulos.
- `parser`: recibe texto YAML, convierte la configuración al contrato normalizado y comunica errores de formato/validación.
- `core`: consume `MachineConfig` y devuelve `SimulationResult`. No lee archivos ni imprime.
- `cli`: conecta entrada/salida de usuario con los contratos; no contiene reglas de transición.

El flujo previsto es `archivo YAML → parser → MachineConfig → core.simulate → SimulationResult → formatter/output`. En este scaffold ese flujo está documentado, pero deliberadamente no está conectado ni implementado.

## Contratos compartidos

`src/shared/types.ts` define `Transition`, `MachineConfig`, `InstantaneousDescription`, `SimulationResult`, `Direction`, `SimulationStatus`, `SimulationOptions` y tipos de validación. La transición interna modela una sola cinta con un símbolo leído/escrito y dirección `L` o `R`. En YAML, los campos `read` y `write` pueden presentarse como arreglos de longitud uno; el parser deberá normalizarlos a strings y rechazar arreglos incompatibles.

`SimulationStatus` distingue `accepted`, `rejected` y `step_limit`. Una descripción instantánea guarda estado, cinta, posición del cabezal y número de paso. La cinta se expresa como arreglo de símbolos; la política de celdas en blanco y de límites se debe fijar en el core de acuerdo con el PDF.

Decisiones provisionales por falta del PDF en el repositorio: Node.js 22, ESM, YAML con la biblioteca `yaml`, direcciones `L`/`R` sin movimiento estacionario, y nombres de claves YAML ilustrados en `examples/`. Confirmar o ajustar estas decisiones al consultar el documento fuente.

## Dependencias permitidas

`parser → shared`, `core → shared`, `cli → shared`. La CLI podrá orquestar parser/core cuando estén listos, pero ningún módulo importará implementaciones internas de otro módulo. Las pruebas de CLI pueden inyectar resultados; las pruebas del core crean configuraciones a mano; las pruebas del parser comparan contra objetos esperados.

## Mocks y trabajo independiente

- Parser: probar la conversión usando texto YAML y comparar el resultado con un `MachineConfig` esperado; simular dependencias externas solo si se agregan.
- Core: construir `MachineConfig` directamente, sin cargar archivos YAML.
- CLI: crear `SimulationResult` de prueba o mockear `formatResult`/salida; no requiere una simulación real.

## Cambios a contratos compartidos

Los cambios en `shared/types.ts` deben conservar la compatibilidad o actualizar las pruebas y consumidores afectados. Preferir campos opcionales solo cuando exista una necesidad documentada. Cada módulo debe exportar su API pública desde su `index.ts` y evitar exponer detalles internos.

## Estado actual

Las funciones de parser, validador, cinta, motor, simulación y formateo lanzan errores `Not implemented`. Esto es intencional: no debe interpretarse como una implementación de referencia ni como un resultado de aceptación/rechazo.
