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

## Sesión 2026-10-21 — IVA real en nueva factura y reactivación de productos

**Planeado:** cerrar el pendiente de `[Sprint 3 - 05 - 02]` (la vista previa de "Nueva factura" usaba 19% fijo porque el frontend no tenía `Negocio.tarifaIvaDefault`) y corregir el bug de Sprint 2 por el que un producto desactivado desaparecía de `/productos` y no se podía volver a activar.

**Completado:**
- `GET /api/negocios/actual` (ADMIN y VENDEDOR, `auth` + `tenant` por ruta porque `POST /api/negocios` es público): devuelve `{ negocio: { id, nombre, tarifaIvaDefault } }` con campos explícitos; la tarifa viaja como string (`"8.25"`).
- `NewInvoicesPage` carga la tarifa al montar y calcula el IVA en centavos enteros con la tarifa en puntos base (`"8.25"` -> 825), redondeo half-up, igual que el backend. Si la tarifa no carga no se muestra IVA ni total (nunca se cae a 19%), se avisa que el servidor los calcula y se puede confirmar igual. Tras confirmar se muestran los totales reales de la respuesta.
- `GET /api/productos?incluirInactivos=true|false` con `leerBooleano` en `utils/query.js` (solo `"true"` o `"false"`, parámetro repetido o cualquier otro valor 400). Sin el parámetro se mantiene solo activos, así que selector de facturas, inventario y alertas de stock no cambian. `alertas-stock` sigue solo activos.
- `ProductsPage` es la única que pide `incluirInactivos: true`; los inactivos muestran la insignia "Inactivo" y el botón "Activar".

**Resultado (servidor real, tres negocios de prueba con tarifas 8.25, 19 y 0):**
- Backend, 66 verificaciones: `/negocios/actual` 200 para ADMIN y VENDEDOR con solo tres campos, CONTADOR 403, sin token o token inválido 401, cada negocio ve su tarifa (también tras cambiarla en la base), `?tenantId=` ignorado; productos con `incluirInactivos` en todas sus variantes, combinado con `nombre` y `categoriaId`, sin cruce entre negocios, `alertas-stock` intacto, factura 201 con totales idénticos a la fórmula del frontend y anulación 200.
- Navegador, ADMIN y VENDEDOR en los tres negocios: la vista previa coincidió al centavo con los totales devueltos por el backend, incluidos redondeos con centavos impares y un empate exacto (23,465 -> 23,47). Con la carga de la tarifa fallando, solo se ve el subtotal y la nota, y la factura se confirma con totales reales. En `/productos`: desactivar mantiene la fila con "Inactivo" y "Activar", la búsqueda encuentra inactivos y se mantiene al activar, y `/inventario` y "Nueva factura" no listan inactivos hasta que se reactivan. Consola sin errores en navegación nueva.
- Datos de prueba eliminados y servidores detenidos.

**Hallazgos fuera de alcance (no corregidos):**
- Express 5 ignora `?incluirInactivos[]=true` (clave `incluirInactivos[]`), igual que los demás filtros: se usa el valor por defecto. Solo un parámetro repetido forma un array y da 400.
- `incluirInactivos=` vacío se trata como ausente, igual que los otros helpers de `utils/query.js`.

## Hardening — defectos de la pasada de QA sobre Sprint 1-4

**Backend:**
- `auth.middleware` es async y relee el usuario (`id`, `tenantId`, `rol`, `activo`) en cada request: usuario inexistente, inactivo o de otro negocio da 401 con el mismo mensaje; `req.user` sale de la base, así que el rol de la base gana al del token y un cambio de rol o una desactivación rigen de inmediato.
- Movimientos de inventario atómicos: ENTRADA incrementa, SALIDA decrementa de forma condicional (409 `STOCK_INSUFICIENTE`) y AJUSTE toma `SELECT ... FOR UPDATE` para registrar un `stockAnterior` exacto. AJUSTE acepta 0; ENTRADA/SALIDA exigen 1..1.000.000 por movimiento y el stock no puede superar 1.000.000.000 (409 `STOCK_MAXIMO_EXCEDIDO`). `GET /inventario/movimientos` suma `producto { id, nombre, codigo }`.
- Errores: JSON malformado o cuerpo no objeto -> 400 `VALIDACION`, cuerpo grande -> 413 `CUERPO_DEMASIADO_GRANDE`, ruta inexistente -> 404 `RUTA_NO_ENCONTRADA`, sin `x-powered-by`. `:id` inválido (`leerIdRuta` en `utils/query.js`) -> 404 en usuarios, productos, clientes y facturas.
- Validación estricta (`utils/validacion.js`) en productos, inventario, negocios (`tarifaIvaDefault` 0..100, 2 decimales), usuarios, categorías y clientes: nada se redondea ni se convierte en silencio. PATCH de producto con código repetido -> 409 `CODIGO_DUPLICADO`. Una factura cuyo total desborda `Decimal(12,2)` -> 400 antes de tocar el stock.
- Último ADMIN: `PATCH /usuarios/:id` bloquea todos los usuarios del negocio en una transacción y devuelve 409 `ULTIMO_ADMIN` si desactivar o cambiar el rol dejaría al negocio sin administradores activos. Dos administradores que se degradan mutuamente a la vez: 40 de 40 rondas con un 200 y un 409.

**Frontend:** el modal de edición de productos envía nombre, código, precio, categoría y stock mínimo (el stock actual se muestra deshabilitado), precios con dos decimales, AJUSTE a 0 con cantidad obligatoria, historial con el nombre del producto aunque esté inactivo, sin GET de historial tras guardar como VENDEDOR e inputs de clientes con `id`/label.

**Resultado (servidor real):** los guiones de QA pasaron de 52 fallos a 0 (aislamiento 33/33, Sprint 4 182/182); 113 verificaciones nuevas de endurecimiento en verde. Navegador (ADMIN, VENDEDOR, CONTADOR): edición, código duplicado, AJUSTE 0, historial, sesión desactivada enviada a `/login`, consola sin errores de JS. Datos de prueba eliminados y servidores detenidos.

**Pendiente (sin corregir):** el frontend conserva el rol del login hasta el próximo inicio de sesión (el backend ya aplica el rol real); CORS abierto y demás hallazgos LOW; pantalla de Usuarios (Sprint 5).
