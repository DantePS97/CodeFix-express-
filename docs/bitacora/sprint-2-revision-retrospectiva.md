# Revisión y Retrospectiva — Sprint 2 (Productos e inventario)

Fecha de cierre: 2026-10-21

Alcance: RF-005, RF-006, RF-007 y RF-008. El PR #2 del sprint se mergeó el 2026-10-02.

Este documento se escribe en el cierre integral de los Sprints 1 a 4, no al terminar el Sprint 2. Por eso la revisión se contrasta con el comportamiento final del sistema (commit `17adcd3`) e incluye defectos del Sprint 2 que se descubrieron y corrigieron después. La evidencia sale de `docs/bitacora/sprint-2.md`, de la QA integrada de los Sprints 1 a 4, del hardening (PR #6) y del smoke final posterior al merge.

## 1. Revisión contra los criterios de aceptación del ERS v1.0 (sección 3.1)

### RF-005 — Gestión de productos

| Criterio de aceptación (ERS) | Resultado |
|---|---|
| Registrar un producto con nombre, categoría, precio y existencias iniciales | Cumple. `POST /api/productos` con stock inicial y pantalla `/productos`. La categoría se valida contra el negocio. |
| Poder modificar su información | Cumple. `PATCH /api/productos/:id`. Hasta el hardening, el modal de edición mostraba Nombre y Código editables pero solo enviaba precio y categoría, así que esos cambios se perdían en silencio. |
| Desactivar productos que ya no se comercialicen (baja lógica) | Cumple. Hallazgo posterior: un producto desactivado desaparecía del listado y no se podía volver a activar desde la pantalla. Corregido con `incluirInactivos` (commits `e9b80c1` y `c5e2f33`). |
| Los productos activos deben poder seleccionarse en una factura | Cumple. El selector de "Nueva factura" lista solo productos activos. |

### RF-006 — Gestión de categorías de producto

| Criterio | Resultado |
|---|---|
| El Administrador puede crear, editar y desactivar categorías | **Parcial.** Solo existen `GET` y `POST` en `/api/categorias`: se pueden crear y listar. **La edición y la desactivación no están implementadas**: las tarjetas del tablero no las incluían. Queda para el Sprint 5. |
| Un producto puede asociarse a una categoría | Cumple. Además, una categoría de otro negocio se rechaza con 404. |

### RF-007 — Registro de movimientos de inventario

| Criterio | Resultado |
|---|---|
| El Administrador (y el Vendedor para salidas por venta) puede registrar movimientos | Cumple. El VENDEDOR solo puede registrar `SALIDA`; `ENTRADA` y `AJUSTE` son exclusivos del ADMIN. |
| Cada movimiento indica tipo, cantidad y motivo | **Parcial.** Tipo y cantidad son obligatorios. El motivo es obligatorio solo en `AJUSTE`; en `ENTRADA` y `SALIDA` es opcional. |
| El stock se actualiza de forma consistente tras cada movimiento | Cumple, con una corrección importante: la primera versión leía el stock y luego escribía el valor calculado, y bajo concurrencia perdía actualizaciones (ver sección 2). Desde el hardening cada tipo usa una sentencia atómica. |
| El stock nunca queda en un valor negativo | Cumple. Una salida mayor al stock responde 409 `STOCK_INSUFICIENTE`. |

### RF-008 — Alertas de stock mínimo

| Criterio | Resultado |
|---|---|
| Cada producto puede configurar un stock mínimo | Cumple. Campo `stockMinimo` (por defecto 5), editable. |
| El panel muestra los productos en alerta de stock bajo o agotado | Cumple. El widget del dashboard lista los productos con `stock < stockMinimo` (incluye los agotados). Solo lo ve el ADMIN, igual que el endpoint. |

**Resultado: RF-005 y RF-008 cumplen sus criterios; RF-006 y RF-007 cumplen en parte** (edición y desactivación de categorías; motivo obligatorio en todos los tipos de movimiento).

## 2. Defectos del Sprint 2 y cuándo se encontraron

| Defecto | Cómo se encontró | Corrección |
|---|---|---|
| `CategoriaProducto`, `Producto` y `MovimientoInventario` no tenían `tenantId`: todos los negocios habrían compartido catálogo, categorías y movimientos | Al retomar el sprint, antes de construir encima (2026-09-26) | `d4e77ff` y migración `20260926055027` |
| `role()` se llamaba con un array en vez de argumentos separados: ni el ADMIN pasaba | Probando contra el servidor real | Corregido en el mismo sprint, y también en el texto de las tarjetas |
| `<select>` controlado sin opción coincidente: la interfaz mostraba una categoría elegida pero el estado seguía vacío | Probando en el navegador | Se preselecciona la primera opción al abrir el modal |
| `useInventory` cargaba el historial al montar aunque el VENDEDOR no tiene permiso (403) | Probando en el navegador | Parámetro `cargarAlInicio` |
| Un `tenantId`, `id` o `stock` en el body de productos y categorías se aceptaba; `categoriaId` de otro negocio también | Revisión durante el Sprint 3, luego reproducido contra el servidor | PR #3 (`554f69c`): lista de campos permitidos y validación de categoría por negocio |
| `registrarMovimiento` no era atómico: 10 salidas paralelas dieron 2 aceptadas y 8 errores 500, y el stock quedó en 4 tras dos salidas | QA integrada | Hardening `19bc658` |
| Validación laxa: stock negativo, cantidad 1.5 o 1e9, precio 1.005, y varios casos que terminaban en 500 | QA integrada | Hardening `724fc44` |
| `PATCH` de producto con `codigo` duplicado respondía 500 | QA integrada | Hardening `724fc44` (ahora 409) |

## 3. Aislamiento multi-tenant

La QA integrada probó cada endpoint de productos, categorías e inventario con dos negocios: 33 de 33 comprobaciones de aislamiento pasaron, incluidos `?tenantId=` en la query, `tenantId` en el body, ids de otro negocio (404) y el uso de categorías o productos ajenos. La corrida final sobre el commit `17adcd3` repitió el resultado.

## 4. Consola del navegador

En el smoke final (ADMIN, VENDEDOR y CONTADOR) no hubo errores de JavaScript. Los únicos registros fueron los 4xx intencionales de las pruebas negativas.

## 5. Retrospectiva

**Qué funcionó:**
- Probar contra el servidor y el navegador reales encontró bugs que la lectura de código no mostraba (`role()` con array, el `<select>` sin preselección, el 403 del VENDEDOR).
- Detectar la falta de `tenantId` antes de construir nada encima evitó propagar el riesgo más alto del Plan de Trabajo a todas las entidades del sprint.
- Reutilizar `Modal` y `Select` como componentes genéricos permitió usarlos luego en clientes, facturas e inventario.

**Qué no funcionó:**
- El esquema compartido se mergeó sin revisar el aislamiento por negocio. El defecto se vio recién al retomar el trabajo.
- Las tarjetas de Notion traían el error de sintaxis de `role()`: un ejemplo mal copiado se replicó en varias.
- El tablero no cubría la edición y desactivación de categorías. Se detectó recién al contrastar el texto literal del ERS durante el cierre, no al terminar el sprint.
- La verificación del sprint se apoyó en el camino feliz. Las entradas inválidas, la concurrencia y la reutilización de `req.body` sin filtrar quedaron sin probar hasta la QA integrada.

**Ajustes para lo que sigue:**
- Contrastar cada tarjeta con los criterios literales del ERS al cerrar cada sprint, no al final de todos.
- Usar lista de campos permitidos y validación estricta desde el primer servicio.
- Probar concurrencia en todo lo que toque stock o numeración.
- Cortar cada rama de sprint desde la última rama integrada.

## 6. Estado de cierre

- RF-005 y RF-008 cumplen sus criterios del ERS. RF-006 y RF-007 cumplen en parte; lo faltante queda registrado para el Sprint 5.
- Aislamiento multi-tenant verificado de punta a punta.
- Rama `sprint-2` lista para integrarse en `main` y etiquetarse `sprint-2-done`. El tag va sobre `554f69c`, el último commit del sprint que queda dentro de la historia de `main`.
