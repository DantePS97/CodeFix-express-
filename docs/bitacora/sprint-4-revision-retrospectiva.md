# Revisión y Retrospectiva — Sprint 4 (Anulación, historial y panel)

Fecha de cierre: 2026-10-21

Alcance: RF-012, RF-013, RF-014 y RF-015, más el hardening surgido de la QA integrada de los Sprints 1 a 4. Los PR #5 (sprint) y #6 (hardening) se mergearon el 2026-10-21.

## 1. Revisión contra los criterios de aceptación del ERS v1.0 (sección 3.1)

### RF-012 — Anulación de facturas

| Criterio de aceptación (ERS) | Resultado |
|---|---|
| Solo se pueden anular facturas en estado Emitida | Cumple. Una segunda anulación responde 409 `TRANSICION_INVALIDA`. |
| Al anular, se revierte el stock con un movimiento de inventario tipo entrada | Cumple. `ENTRADA` por línea con `referenciaFacturaId`, también para productos inactivos. El stock se repone una sola vez incluso con 2 y 6 anulaciones simultáneas. |
| La factura queda Anulada y conserva su historial | Cumple. No se elimina físicamente. |
| Se registra el motivo de anulación | Cumple. Obligatorio, de 1 a 255 caracteres. |

El ERS deja como opcional que el Vendedor anule sus propias facturas. Decisión de diseño: **solo el ADMIN anula** (VENDEDOR y CONTADOR reciben 403).

### RF-013 — Historial de ventas e inventario

| Criterio | Resultado |
|---|---|
| Consultar el historial de facturas del negocio | Cumple. Pantalla `/facturas` con filtros y detalle; la ven ADMIN, VENDEDOR y CONTADOR. |
| Consultar el historial de movimientos de un producto específico | **Parcial.** El backend lo soporta (`GET /api/inventario/movimientos?productoId=`, verificado), pero la pantalla de inventario muestra el historial completo sin filtro por producto. |
| Las facturas anuladas se conservan | Cumple. Siguen apareciendo con el estado Anulada y su motivo. |

### RF-014 — Búsqueda y filtrado

| Criterio | Resultado |
|---|---|
| Buscar productos por nombre o categoría | Cumple en la API (`nombre` y `categoriaId`). La pantalla busca por nombre; la categoría solo se usa como filtro vía API. |
| Buscar clientes por nombre o identificación | Cumple, en API y pantalla. |
| Buscar facturas por número, cliente, estado o rango de fechas | **Parcial.** Cliente, estado y rango de fechas funcionan (incluido un `hasta` inclusivo del día completo). **No existe búsqueda por número de factura.** Queda para el Sprint 5. |

### RF-015 — Panel administrativo del negocio

| Criterio | Resultado |
|---|---|
| Visualizar indicadores generales (ventas del periodo, productos con stock bajo) | Cumple. El panel muestra ventas del mes, facturas emitidas y alertas de stock, solo para ADMIN. Las facturas anuladas no suman. |
| Acceder a la gestión de usuarios, productos, clientes y reportes | **Parcial.** Hay productos, clientes, facturas e inventario. **La gestión de usuarios existe solo en el backend** (la pantalla es un marcador de posición, planificada para el Sprint 5) y **no hay reportes**. |

**Resultado: RF-012 cumple sus criterios; RF-013, RF-014 y RF-015 cumplen en parte.** Lo faltante queda registrado para el Sprint 5.

## 2. QA integrada de los Sprints 1 a 4

Se ejecutó sobre la rama `sprint-4` con dos negocios, los tres roles, guiones de API contra el servidor real y un navegador real.

| Área | Primera corrida (antes del hardening) | Corrida final (commit `17adcd3`) |
|---|---|---|
| Sprint 1 | 81 de 86 | 86 de 86 |
| Sprint 2 | 76 de 101 | 101 de 101 |
| Sprint 3 | 71 de 72 | 72 de 72 |
| Sprint 4 | 182 de 182 | 182 de 182 |
| Aislamiento entre negocios | 33 de 33 | 33 de 33 |
| Robustez (entradas inválidas) | 7 de 28 | 28 de 28 |
| Hardening (guion nuevo) | no existía | 113 de 113 |

Las 52 comprobaciones fallidas de la primera corrida no eran 52 defectos distintos: la mayoría compartía una causa (validación laxa que terminaba en 500). En ninguna respuesta (unas 400 revisadas) apareció un hash, un secreto ni una traza de error.

**Hallazgos graves y su corrección (PR #6):**
- El JWT no se revalidaba: un usuario desactivado conservaba el acceso y un cambio de rol no se aplicaba. Ahora cada request relee al usuario de la base. Este hallazgo afecta a RF-003 y RF-004 del Sprint 1.
- Los movimientos de inventario no eran atómicos (2 aceptados y 8 errores 500 con 10 salidas paralelas). Ahora son atómicos: 5 aceptados y 5 rechazados, stock final 0.
- El único administrador de un negocio podía desactivarse o quitarse el rol. Ahora se responde 409 `ULTIMO_ADMIN`; en 40 rondas de dos administradores degradándose a la vez siempre hubo un 200 y un 409.
- JSON malformado, cuerpos gigantes, ids no numéricos y entradas fuera de rango respondían 500 o se aceptaban en silencio. Ahora responden 400, 404 o 413 según corresponda.

**Verificación en navegador (ADMIN, VENDEDOR, CONTADOR):** sin errores de JavaScript. El VENDEDOR ya no genera un 403 en consola tras guardar en inventario. La sesión de un usuario desactivado pasa a `/login` en su siguiente clic. La vista previa de IVA coincide con los totales del backend con tarifas 8.25%, 19% y 0%.

## 3. Decisiones tomadas en el hardening

- Límites elegidos: stock máximo de 1.000 millones, 1 millón por movimiento, y 1000 caracteres para descripción y observaciones. Son revisables si el ERS fija otros.
- Un `PATCH` con cuerpo vacío responde 400.
- El token inválido, inactivo o de otro negocio responde siempre el mismo 401, sin revelar cuál fue el caso.
- Costo asumido: una consulta extra a la base por cada request autenticado.

## 4. Deuda técnica y trabajo pendiente

- **Sprint 5:** pantalla de gestión de usuarios (RF-003, RF-004, RF-015), endpoint `GET /api/auth/me` para sincronizar el rol de la sesión, y los criterios del ERS que quedaron en parte (edición y desactivación de categorías, motivo obligatorio en todos los movimientos, cambio de la tarifa de IVA, historial por producto en pantalla, búsqueda de facturas por número y reportes).
- **Backlog:** suite de pruebas automáticas (hoy no existe ningún test versionado), CORS por entorno y escape de comodines en las búsquedas (`nombre=%` devuelve todo).
- El frontend conserva el rol del login hasta el siguiente inicio de sesión; el backend ya aplica el rol real.

## 5. Retrospectiva

**Qué funcionó:**
- Hacer la anulación con una transición de estado atómica resolvió de raíz la doble anulación, también la simultánea.
- Reutilizar el método de verificación (dos negocios, tres roles, servidor y navegador reales, y un guion repetible) permitió medir el antes y el después del hardening con números.
- Acotar cada ronda de trabajo a una lista cerrada de cambios con evidencia evitó que las correcciones introdujeran regresiones: el aislamiento y el Sprint 4 siguieron en verde en todo momento.
- Registrar la rama de la colaboradora con una fusión que no trae su contenido (`-s ours`) dejó el historial limpio sin perder su autoría.

**Qué no funcionó:**
- La QA integrada recién apareció al final: defectos graves de los Sprints 1 y 2 (JWT sin revalidar, inventario no atómico) llevaban semanas sin detectarse. Una suite automática los habría mostrado antes.
- Los criterios del ERS se contrastaron con el código en el cierre, y no sprint por sprint. Así aparecieron huecos que ninguna tarjeta cubría (edición de categorías, tarifa de IVA modificable, búsqueda por número, reportes).
- La pantalla de usuarios nunca tuvo tarjeta en el tablero, aunque RF-003 y RF-004 la suponen: el backend quedó completo y el criterio de "gestionar usuarios" solo se cumple por API.

**Ajustes para lo que sigue:**
- Incorporar una suite de pruebas automáticas y correrla antes de cada merge.
- Revisar cada tarjeta contra el texto literal del ERS al cerrar cada sprint.
- Registrar en el tablero las tarjetas de interfaz de cada requisito de backend desde el inicio del sprint.

## 6. Estado de cierre

- RF-012 cumple sus criterios del ERS. RF-013, RF-014 y RF-015 cumplen en parte; lo faltante queda para el Sprint 5.
- QA integrada y hardening completos, con el smoke final en verde sobre el commit `17adcd3`.
- Rama `sprint-4` lista para integrarse en `main` y etiquetarse `sprint-4-done`. El tag va sobre el merge que cierra los Sprints 2 a 4 en `main`.
