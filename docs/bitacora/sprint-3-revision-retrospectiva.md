# Revisión y Retrospectiva — Sprint 3 (Clientes y facturación)

Fecha de cierre: 2026-10-21

Alcance: RF-009, RF-010 y RF-011. El PR #4 del sprint se mergeó el 2026-10-20.

Como en el Sprint 2, la revisión se contrasta con el comportamiento final (commit `17adcd3`). La evidencia sale de `docs/bitacora/sprint-3.md`, de la QA integrada, del hardening (PR #6) y del smoke final posterior al merge.

## 1. Revisión contra los criterios de aceptación del ERS v1.0 (sección 3.1)

### RF-009 — Gestión de clientes

| Criterio de aceptación (ERS) | Resultado |
|---|---|
| Vendedor o Administrador registra un cliente con nombre e identificación/contacto | Cumple. `POST /api/clientes` y pantalla `/clientes`. El CONTADOR no tiene acceso (403). |
| Poder consultar y actualizar un cliente existente | Cumple. `GET` con búsqueda por nombre o identificación y `PATCH /api/clientes/:id`. |
| Los clientes están disponibles para asociarse a una factura | Cumple. El selector de "Nueva factura" lista solo clientes activos; el backend rechaza uno inactivo con 400. |

### RF-010 — Creación de facturas / ventas

| Criterio | Resultado |
|---|---|
| Seleccionar el cliente y agregar uno o más productos con su cantidad | Cumple. Pantalla `/facturas/nueva`; los productos repetidos se agrupan en una sola línea porque el backend rechaza duplicados. |
| Validar que exista stock suficiente para cada producto | Cumple. 409 `STOCK_INSUFICIENTE` sin escrituras parciales, también cuando falla la segunda línea tras haber descontado la primera: la transacción revierte. |
| Calcular automáticamente subtotal, IVA y total | Cumple. El backend es la fuente de verdad: toma siempre el precio del producto en la base e ignora el que envíe el cliente. |
| Al confirmar, descontar el stock con un movimiento de inventario tipo salida | Cumple. Un movimiento `SALIDA` por línea con `referenciaFacturaId`, en la misma transacción. |
| Número de factura único dentro del negocio | Cumple. Consecutivo por negocio con restricción única. Sin reintento, 9 de 10 ventas simultáneas legítimas fallaban con 409; se agregó un reintento acotado. |
| La factura inicia en estado Emitida | Cumple. |

### RF-011 — Cálculo de impuestos

| Criterio | Resultado |
|---|---|
| El negocio puede configurar la tarifa de IVA (por defecto, la tarifa general) | **Parcial.** La tarifa (`tarifaIvaDefault`, entre 0 y 100) se define al registrar el negocio y se consulta con `GET /api/negocios/actual`, pero **no existe endpoint ni pantalla para cambiarla después**. Queda para el Sprint 5. |
| Mostrar el desglose de subtotal, impuesto y total antes de confirmar | Cumple. La vista previa usa la tarifa real y calcula en centavos con redondeo half-up. Coincidió al centavo con los totales del backend con tarifas 8.25%, 19% y 0%, incluido un empate exacto (23,465 a 23,47). Originalmente usaba 19% fijo; se corrigió en el Sprint 4. |

**Resultado: RF-009 y RF-010 cumplen sus criterios; RF-011 cumple en parte** (la tarifa no es modificable tras el registro).

## 2. Integración con el trabajo de una segunda colaboradora

Laura trabajó en paralelo el frontend y parte del backend sobre una rama `sprint-3` cortada antes del Sprint 2 (`27d6a37`), así que no contenía `Modal`, `Select` ni `useProducts`, ni el esquema de clientes y facturas.

| Hallazgo en su rama | Resolución |
|---|---|
| `clients.service.js` e `invoices.service.js` importaban `./api`, pero el cliente HTTP está en `../api/api.js` | Corregido |
| `useInvoices.js` e `invoices.service.js` estaban vacíos (0 bytes) pese a que el commit decía implementarlos | Implementados |
| `actualizarCliente` usaba `PUT`; el backend y el resto del proyecto usan `PATCH` | Corregido |
| Sus servicios devolvían la respuesta completa en vez de desempaquetarla | Corregido, igual que los servicios del Sprint 2 |
| `ClientsPage` usaba props que no existen en nuestros componentes (`isOpen`, `columns`) y campos `documento`, `telefono`, `email` y `direccion` que el backend no tiene | Alineada con `Modal` y `Table` y con `identificacion` y `contacto`. **El cambio de campos no se pudo confirmar con la colaboradora**, que dejó de subir cambios. |
| Su controlador y rutas de facturas no usaban los middlewares `auth` ni `tenant` | Se conservó la implementación del backend verificada |
| El auto-merge dejó `AppRoutes.jsx` roto (imports y JSX después del componente) y su link "Nueva factura" fuera del componente del sidebar | Corregido a mano |

La integración se resolvió con un merge de su rama en `sprint-3` (PR #4), sin reescribir historia.

## 3. Pruebas de la QA integrada

- Facturación, ciclo completo: 72 de 72 comprobaciones del Sprint 3 pasaron en la corrida final.
- Concurrencia: 10 ventas simultáneas de una unidad sobre stock 5 dieron exactamente 5 facturas con números únicos consecutivos y 5 rechazos `STOCK_INSUFICIENTE`.
- Aislamiento: el negocio B no ve ni toca clientes ni facturas del A, ni puede facturar con su cliente o producto (404).
- Roles: VENDEDOR emite; CONTADOR consulta facturas pero no emite (403) y no accede a clientes.
- Hardening posterior: una factura cuyo total desborda `Decimal(12,2)` responde 400 antes de escribir (antes, 500 con rollback correcto).

## 4. Consola del navegador

Sin errores de JavaScript en el smoke final con los tres roles. Solo aparecieron los 4xx intencionales (por ejemplo, el 409 de stock insuficiente).

## 5. Retrospectiva

**Qué funcionó:**
- Diseñar la emisión de facturas como una única transacción con descuento atómico de stock evitó la sobreventa incluso bajo concurrencia.
- Probar la concurrencia de verdad destapó el problema de los números de factura repetidos, que ninguna prueba secuencial habría mostrado.
- Integrar por merge, sin reescribir historia, dejó el trabajo de la colaboradora como parte de la historia del proyecto.

**Qué no funcionó:**
- El trabajo en paralelo sin una base común: su rama se cortó antes del Sprint 2, con archivos vacíos y mensajes de commit que no describían el contenido. El esfuerzo de integración fue grande.
- Una afirmación sobre su rama se comprobó contra la rama equivocada (`sprint-4` en lugar de la punta de `sprint-3`) y hubo que corregirla con evidencia.
- La vista previa de IVA salió con una tarifa fija y se corrigió un sprint después, porque el frontend no tenía de dónde leerla.
- El tablero no incluía una forma de cambiar la tarifa de IVA, aunque el criterio de RF-011 lo pide.

**Ajustes para lo que sigue:**
- Cortar cada rama de sprint desde la última rama integrada y acordar el contrato de la API antes de empezar el frontend.
- Revisar `git show --stat` de los commits ajenos antes de confiar en su mensaje.
- Contrastar cada tarjeta con los criterios literales del ERS al cerrar el sprint.

## 6. Estado de cierre

- RF-009 y RF-010 cumplen sus criterios del ERS. RF-011 cumple en parte; lo faltante queda para el Sprint 5.
- Rama `sprint-3` lista para integrarse en `main` y etiquetarse `sprint-3-done`. El tag va sobre `619eba0`, el merge del PR #4.
