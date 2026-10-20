# Bitácora — Sprint 3 (Clientes y facturación)

Registro breve por sesión: lo planeado, lo completado y los bloqueos (Plan de Trabajo v1.0, sección 2.3).

## Sesión 2026-10-02 — Backend: clientes y facturación

**Planeado:** Tarjetas `[Sprint 3 - 01]` (schema), `[Sprint 3 - 02] [01]` y `[02]` (clientes), `[Sprint 3 - 03] [01]` y `[02]` (facturas). Rama local `sprint-3` creada desde `sprint-2` (ya existe una rama remota `sprint-3` de otro colaborador: no se hizo push ni merge).

**Completado:**
- `backend/prisma/schema.prisma`: modelos `Cliente`, `Factura`, `DetalleFactura`, enum `EstadoFactura`; `MovimientoInventario` gana `referenciaFacturaId` (relación opcional a `Factura`). Todas las entidades de negocio llevan `tenantId` e `@@index([tenantId])`; `Factura` tiene `@@unique([tenantId, numero])`.
- Migración `20261002132247_add_clientes_facturacion` aplicada y `npx prisma generate` corrido explícitamente (la migración sola no regenera el cliente).
- `validators/clientes.validator.js`, `services/clientes.service.js`, `controllers/clientes.controller.js`, `routes/clientes.routes.js` (el archivo de rutas existía vacío): `GET/POST /api/clientes`, `PATCH /api/clientes/:id`, roles ADMIN y VENDEDOR.
- `validators/facturas.validator.js`, `services/facturas.service.js`, `controllers/facturas.controller.js`, `routes/facturas.routes.js`: `POST/GET /api/facturas`, `GET /api/facturas/:id`. Anular queda para el Sprint 4.
- `app.js`: montadas `/api/clientes` y `/api/facturas`.

**Decisiones de diseño:**
- La factura se emite en una sola `prisma.$transaction`: valida cliente y productos del tenant, descuenta stock, calcula totales, asigna número, crea factura, detalles y un movimiento `SALIDA` por línea con `referenciaFacturaId`.
- Precio siempre tomado del producto en base de datos; el precio que envíe el cliente se ignora.
- Importes con `Prisma.Decimal` (sin floats), redondeo `ROUND_HALF_UP` a 2 decimales solo en el impuesto (tarifa: `Negocio.tarifaIvaDefault`).
- Descuento de stock con `updateMany` condicional (`stock >= cantidad`) y verificación de `count`: dos ventas concurrentes no pueden sobrevender. Por lectura de código, `inventario.service.js` (Sprint 2) lee el stock y luego escribe el valor calculado, sin esa protección (no probado en ejecución).
- Número de factura = último del tenant + 1 dentro de la transacción. Si dos ventas simultáneas calculan el mismo número, la restricción única rechaza una (`P2002`) y el servicio reintenta hasta 5 veces; agotados los intentos responde 409 `NUMERO_FACTURA_DUPLICADO`.
- Con el adapter de MariaDB (Prisma 7) el `P2002` no trae `meta.target`; el índice viaja en `meta.driverAdapterError.cause.constraint.index` (verificado contra la base real).
- Los servicios copian campo a campo del body (no `...req.body`) para que no se pueda inyectar `tenantId`.

**Resultado (probado contra el servidor real, dos negocios de prueba):**
- Clientes: 401 sin token; ADMIN y VENDEDOR crean/listan/editan; CONTADOR recibe 403; el negocio B no ve ni edita clientes de A (404); un `tenantId` en el body de un PATCH se ignora.
- Facturas: totales correctos (incluido el redondeo de 0.095 a 0.10), stock descontado, movimientos `SALIDA` con `referenciaFacturaId`.
- Stock insuficiente: 409 `STOCK_INSUFICIENTE` sin escrituras parciales, también cuando la línea 2 falla tras haber descontado la línea 1 (la transacción revierte).
- Aislamiento: B no ve la factura de A (404) ni puede facturar con el cliente o el producto de A (404).
- Roles: VENDEDOR emite (201); CONTADOR recibe 403 al emitir y 200 al consultar.
- Concurrencia: 10 pedidos simultáneos de 1 unidad sobre stock 5 dieron 5 facturas con números únicos y 5 rechazos `STOCK_INSUFICIENTE`.
- Bug encontrado probando: sin el reintento por número duplicado, 9 de 10 ventas simultáneas legítimas fallaban con 409; se agregó el reintento y se volvió a probar.
- Datos de prueba eliminados de la base al terminar.

**Hallazgos fuera de alcance:**
- Existe un `routes/factura.routes.js` (singular) vacío, placeholder previo; el archivo real es `facturas.routes.js` (plural).
- Por lectura de código (no probado en ejecución): `productos.controller.js` pasa `req.body` completo al service, y `productos.service.js` hace `{ tenantId, ...datos }`, así que un body con `tenantId` pisaría el del token. Lo mismo en `actualizar`.

**Bloqueos:** ninguno.

**Pendiente:** un commit por tarjeta (RF-009, RF-010, RF-011).
