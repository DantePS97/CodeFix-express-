# Bitácora — Sprint 4 (Anulación, filtros e indicadores)

Registro breve por sesión: lo planeado, lo completado y los bloqueos (Plan de Trabajo v1.0, sección 2.3).

## Sesión 2026-10-20 — Backend: anulación, búsqueda e indicadores

**Planeado:** Tarjetas `[Sprint 4 - 02]` (anulación, RF-012), `[03]` (filtros y búsqueda, RF-013/RF-014), `[04]` (historial por producto, RF-013) y `[05]` (indicadores, RF-015). Rama local `sprint-4` creada desde `upstream/sprint-3` (Sprint 3 ya mergeado). La rama remota `sprint-4` de Laura se usó solo como referencia: sus servicios no tenían imports, faltaban validadores y rutas. No se hizo merge ni cherry-pick.

**Completado:**
- `services/facturas.service.js`: `anular`, filtros en `listar` y `resumenVentas`. Constante `INCLUIR_DETALLE` compartida por `emitir`, `anular` y `obtenerPorId`.
- `validators/facturas.validator.js`: `validarAnularFactura` y `leerFiltrosFacturas`. Nuevo `utils/query.js` con `leerTexto`, `leerEnteroPositivo` y `leerFecha` (rechazan arrays y formatos inválidos con 400).
- `controllers/facturas.controller.js` y `routes/facturas.routes.js`: `POST /api/facturas/:id/anular` (solo ADMIN); `GET /api/facturas` con `clienteId`, `estado`, `desde`, `hasta`.
- `productos`: `GET /api/productos?nombre=&categoriaId=`. `clientes`: `GET /api/clientes?nombre=` (coincide con nombre o identificación).
- `inventario`: `GET /api/inventario/movimientos?productoId=`.
- `controllers/dashboard.controller.js`, `routes/dashboard.routes.js`, montado en `app.js`: `GET /api/dashboard/indicadores` (solo ADMIN).

**Decisiones de diseño:**
- La anulación ocurre en una sola `prisma.$transaction`. El cambio de estado es un `updateMany` condicional (`estado: "EMITIDA"`): si `count` es 0 se relee la factura con `tenantId` para distinguir 404 de 409 `TRANSICION_INVALIDA`. Así una doble anulación, incluso simultánea, repone el stock una sola vez.
- La reposición usa `increment` atómico y también aplica a productos inactivos. Cada línea genera un movimiento `ENTRADA` con `referenciaFacturaId`, con los mismos campos que `emitir` llena para la `SALIDA`.
- Solo ADMIN anula (el ERS deja la anulación por VENDEDOR como opcional).
- Ningún controlador ni servicio esparce `req.body` o `req.query` en un `where`: cada parámetro se lee por separado, se valida y devuelve 400 si está mal formado. `listarMovimientos` y `productos.listar` hacían spread de `filtros`; ahora reciben campos explícitos.
- Filtro por fechas sobre `Factura.createdAt` en hora local del servidor. `hasta` es inclusivo del día completo (se consulta con `< medianoche del día siguiente`).
- Indicadores: período = mes calendario en curso (hora local del servidor). `ventasPeriodo` es un `Decimal` que se serializa como string, igual que los totales de factura (`"37.5"`, `"0"` si no hay ventas). `alertasStock` reutiliza `listarAlertasStock`.
- Nombre del parámetro de búsqueda: `nombre`, igual que los borradores de frontend de Laura (`recargar({ nombre: busqueda })`).

**Resultado (probado contra el servidor real, tres negocios de prueba, ~150 verificaciones):**
- Anular: ADMIN 200 con stock repuesto exacto y movimientos `ENTRADA` (también visibles en el historial por `productoId`); segunda anulación 409 sin reponer de nuevo; 2 y 6 peticiones simultáneas dieron un solo 200 y el resto 409, con stock repuesto una vez; VENDEDOR y CONTADOR 403; sin token 401; motivo vacío, solo espacios, no string o de 256 caracteres 400 (255 caracteres 200); id inexistente, 0, no numérico o fuera de rango 404; el negocio B anulando una factura de A 404 sin cambios; producto inactivo recupera su stock.
- Filtros de facturas: por estado, cliente, rango de fechas (con una factura a las 23:59:30, `hasta` del mismo día la incluye) y combinados; parámetros inválidos (estado, fecha inexistente, `desde` > `hasta`, ids mal formados, parámetros repetidos) 400; CONTADOR y VENDEDOR 200; B nunca ve filas de A; `?tenantId=` ignorado.
- Búsqueda: productos por nombre parcial (sin distinguir mayúsculas) y por categoría, inactivos excluidos; clientes por nombre o identificación; parámetro vacío devuelve todo; `?tenantId=` ignorado; VENDEDOR busca clientes y productos.
- Historial: filtra por producto; `productoId` mal formado 400; producto de otro negocio devuelve lista vacía; roles sin cambios (ADMIN y CONTADOR 200, VENDEDOR 403).
- Indicadores: números correctos con facturas ANULADAS y de otro mes excluidas; alertas coinciden con los productos activos bajo mínimo; VENDEDOR y CONTADOR 403; sin token 401; B solo ve lo suyo; un negocio sin facturas devuelve `"0"`, 0 y 0.
- Regresión: crear cliente, emitir factura y descontar stock siguen funcionando; el `tenantId` en el body de `POST /api/productos` sigue ignorándose.
- Datos de prueba eliminados de la base y servidor detenido al terminar.

**Hallazgos fuera de alcance (no corregidos):**
- `inventario.service.js` `registrarMovimiento` sigue sin ser atómico (lee y luego escribe).
- `PATCH /api/productos/:id` con un `codigo` duplicado responde 500 en lugar de 409.
- La búsqueda por `nombre` no escapa `%` ni `_`: `nombre=%` devuelve todo (sin impacto de seguridad, solo comodín dentro del propio negocio).
- Express 5 usa el parser de query simple: `?estado[]=X` no forma un array, es una clave `estado[]` que se ignora.

**Bloqueos:** ninguno.

**Pendiente:** un commit por tarjeta (RF-012, RF-013, RF-014, RF-015) y la fase de frontend.
