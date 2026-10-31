# CodeFix Express — Backend

API REST de CodeFix Express, una plataforma multi-tenant de facturación, inventario y reportes para pymes. Cada negocio (tenant) trabaja de forma aislada: ningún usuario puede ver ni modificar datos de otro negocio.

El frontend que consume esta API está en [`../frontend`](../frontend/README.md).

## Tecnologías

- Node.js (módulos ES) y Express 5
- Prisma 7 con el adaptador de MariaDB (`@prisma/adapter-mariadb`) sobre MySQL 8 o superior
- Autenticación con JWT (`jsonwebtoken`) y contraseñas con `bcrypt`
- `cors` y `dotenv`

## Requisitos

- Node.js y npm. El proyecto se desarrolló y probó con Node.js 24.13 y npm 11.
- Un servidor MySQL 8 o superior en ejecución.

## Puesta en marcha

1. Instala las dependencias:

   ```bash
   npm install
   ```

   El `postinstall` ejecuta `prisma skills sync` (una utilidad de Prisma para asistentes de IA). Si falla, no interrumpe la instalación.

2. Crea el archivo `.env` en esta carpeta (ver [Variables de entorno](#variables-de-entorno)).

3. Crea una base de datos vacía en MySQL, por ejemplo `codefix_express`.

4. Aplica las migraciones y genera el cliente de Prisma:

   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

   La migración por sí sola no regenera el cliente: `prisma generate` hay que ejecutarlo siempre después de cambiar el esquema. El CLI toma la configuración de `prisma7.config.ts`, que lee `DATABASE_URL` del `.env`.

5. Inicia el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   El servidor queda escuchando en `http://localhost:3000` (o en el puerto de `PORT`).

Para comprobar el estado de las migraciones en cualquier momento: `npx prisma migrate status`.

## Variables de entorno

El archivo `.env` está ignorado por git. No subas credenciales al repositorio.

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DATABASE_URL` | Sí | Cadena de conexión a MySQL, por ejemplo `mysql://usuario:contraseña@localhost:3306/codefix_express`. |
| `JWT_SECRET` | Sí | Secreto con el que se firman los tokens. Usa un valor largo y aleatorio. Sin él, el login falla. |
| `PORT` | No | Puerto del servidor. Por defecto `3000`. |
| `JWT_EXPIRES_IN` | No | Duración del token. Por defecto `8h`. |

Ejemplo de `.env` con valores de relleno:

```env
DATABASE_URL="mysql://usuario:contraseña@localhost:3306/codefix_express"
JWT_SECRET="cambia-este-valor-por-un-secreto-largo-y-aleatorio"
PORT=3000
```

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Inicia el servidor con recarga automática (`node --watch`). |
| `npm start` | Inicia el servidor sin recarga automática. |
| `npm run seed:demo` | Carga los datos de demostración (ver [Datos de demostración](#datos-de-demostración)). |

## Estructura

```
backend/
├── prisma/
│   ├── schema.prisma        Modelos de datos
│   └── migrations/          Migraciones aplicadas con Prisma
├── prisma7.config.ts        Configuración del CLI de Prisma (conexión y migraciones)
├── scripts/
│   └── seed-demo.js         Datos de demostración
└── src/
    ├── server.js            Arranque del servidor
    ├── app.js               Express: middlewares globales y montaje de rutas
    ├── config/prisma.js     Cliente de Prisma (único en toda la aplicación)
    ├── routes/              Rutas y permisos por rol
    ├── controllers/         Reciben la petición, validan y llaman al servicio
    ├── services/            Lógica de negocio y acceso a datos
    ├── validators/          Validación de las entradas
    ├── middlewares/         auth, tenant, role y manejo de errores
    └── utils/               errors, jwt, hash, query, validacion, pick
```

## Arquitectura y convenciones

El flujo de una petición es siempre el mismo: `routes` → `controllers` → `services`, con los `validators` entre el controlador y el servicio.

**Cadena de middlewares.** Las rutas privadas pasan por tres middlewares, en este orden:

1. `auth`: verifica el JWT y vuelve a leer al usuario de la base de datos en cada petición. Si el usuario no existe, está inactivo o pertenece a otro negocio, responde 401. Por eso desactivar a un usuario o cambiarle el rol se aplica de inmediato, sin esperar a que el token expire.
2. `tenant`: adjunta el negocio del usuario como `req.tenantId`.
3. `role("ADMIN", "VENDEDOR", ...)`: permite el acceso solo a esos roles. Recibe los roles como argumentos separados, nunca como un arreglo.

**Aislamiento multi-tenant.** Todos los métodos de los servicios reciben `tenantId` como primer parámetro y lo aplican en cada consulta. Un recurso de otro negocio responde 404, no 403, para no confirmar que existe.

**Entradas.** Nunca se esparcen `req.body` ni `req.query` dentro de una consulta a la base de datos. Cada campo se lee de forma explícita, se valida (`utils/validacion.js`, `utils/query.js`) y, si está mal formado, se responde 400.

**Errores.** Todos los errores esperados extienden `AppError` y llegan al manejador central con `next(error)`. La respuesta siempre tiene esta forma:

```json
{ "error": { "codigo": "STOCK_INSUFICIENTE", "mensaje": "El producto no tiene existencias suficientes (...)." } }
```

Códigos principales: `VALIDACION` (400), `NO_AUTENTICADO` (401), `NO_AUTORIZADO` (403), `NO_ENCONTRADO` y `RUTA_NO_ENCONTRADA` (404), `CUERPO_DEMASIADO_GRANDE` (413), y 409 para conflictos: `STOCK_INSUFICIENTE`, `STOCK_MAXIMO_EXCEDIDO`, `TRANSICION_INVALIDA`, `ULTIMO_ADMIN`, `CODIGO_DUPLICADO`, `CATEGORIA_DUPLICADA`, `CORREO_DUPLICADO`, `NIT_DUPLICADO` y `NUMERO_FACTURA_DUPLICADO`.

## Roles y endpoints

Roles: `ADMIN`, `VENDEDOR` y `CONTADOR`. Salvo los públicos, todos los endpoints exigen el encabezado `Authorization: Bearer <token>`.

| Método y ruta | Roles | Descripción |
|---|---|---|
| `POST /api/negocios` | Público | Registra un negocio y su administrador. |
| `GET /api/negocios/actual` | ADMIN, VENDEDOR | Datos del negocio, incluida la tarifa de IVA. |
| `POST /api/auth/login` | Público | Inicia sesión y devuelve el token. |
| `GET /api/usuarios` | ADMIN | Lista los usuarios del negocio. |
| `POST /api/usuarios` | ADMIN | Crea un usuario con su rol. |
| `PATCH /api/usuarios/:id` | ADMIN | Cambia el rol y/o activa o desactiva. |
| `GET /api/categorias` | ADMIN, VENDEDOR, CONTADOR | Lista las categorías. |
| `POST /api/categorias` | ADMIN | Crea una categoría. |
| `GET /api/productos` | ADMIN, VENDEDOR, CONTADOR | Lista productos. Filtros: `nombre`, `categoriaId`, `incluirInactivos`. |
| `POST /api/productos` | ADMIN | Crea un producto. |
| `PATCH /api/productos/:id` | ADMIN | Edita, activa o desactiva un producto. |
| `GET /api/productos/alertas-stock` | ADMIN | Productos con stock por debajo del mínimo. |
| `POST /api/inventario/movimientos` | ADMIN, VENDEDOR | Registra un movimiento. El VENDEDOR solo puede registrar `SALIDA`. |
| `GET /api/inventario/movimientos` | ADMIN, CONTADOR | Historial de movimientos. Filtro: `productoId`. |
| `GET /api/clientes` | ADMIN, VENDEDOR | Lista clientes. Filtro: `nombre` (busca por nombre o identificación). |
| `POST /api/clientes` | ADMIN, VENDEDOR | Crea un cliente. |
| `PATCH /api/clientes/:id` | ADMIN, VENDEDOR | Edita, activa o desactiva un cliente. |
| `POST /api/facturas` | ADMIN, VENDEDOR | Emite una factura. |
| `GET /api/facturas` | ADMIN, VENDEDOR, CONTADOR | Lista facturas. Filtros: `clienteId`, `estado`, `desde`, `hasta`. |
| `GET /api/facturas/:id` | ADMIN, VENDEDOR, CONTADOR | Detalle de una factura. |
| `POST /api/facturas/:id/anular` | ADMIN | Anula una factura. Requiere `motivo`. |
| `GET /api/dashboard/indicadores` | ADMIN | Ventas del mes, facturas emitidas y alertas de stock. |

## Reglas de negocio relevantes

- **Facturación.** La emisión ocurre en una sola transacción: valida cliente y productos del negocio, descuenta el stock, calcula los totales, asigna un número consecutivo por negocio y registra un movimiento `SALIDA` por línea. El precio siempre se toma del producto en la base de datos, nunca de lo que envíe el cliente. El IVA usa la tarifa del negocio (`tarifaIvaDefault`) con redondeo a dos decimales.
- **Anulación.** Solo se anulan facturas en estado `EMITIDA`. Revierte el stock con un movimiento `ENTRADA` por línea, queda registrada con su motivo y no se borra. Una doble anulación, incluso simultánea, repone el stock una sola vez.
- **Inventario.** Los movimientos son atómicos y el stock nunca queda negativo. Un `AJUSTE` fija el valor absoluto del stock (puede ser 0) y exige un motivo. Límites: 1.000.000 de unidades por movimiento y 1.000.000.000 de stock.
- **Usuarios.** No se puede desactivar ni quitar el rol de administrador al último administrador activo de un negocio.
- **Sesión.** El token dura 8 horas por defecto (`JWT_EXPIRES_IN`).

## Datos de demostración

```bash
npm run seed:demo             # carga los datos si todavía no existen
npm run seed:demo -- --reset  # borra y vuelve a crear los dos negocios de demostración
```

El script crea dos negocios ficticios, "Papelería El Punto" (IVA 19 %) y "Ferretería Los Andes" (IVA 5 %), con usuarios por rol, productos, clientes, movimientos y facturas. Solo toca esos dos negocios y nunca borra ningún otro. La contraseña de las cuentas es la constante `DEMO_PASSWORD` al inicio de [`scripts/seed-demo.js`](scripts/seed-demo.js). Las cuentas y el recorrido de la presentación están en [`../docs/demo.md`](../docs/demo.md).

## Estado y límites conocidos

- No hay una suite de pruebas automatizadas. La verificación se hizo con scripts manuales contra un servidor real. Está registrada como tarea pendiente.
- Los reportes (RF-016 a RF-018) no están implementados. Los archivos `src/routes/reportes.routes.js` y `src/routes/factura.routes.js` están vacíos y no se montan en `app.js`.
- CORS está abierto (`cors()` sin restricciones). Es adecuado para desarrollo; restríngelo por entorno antes de publicar.
- La búsqueda por `nombre` no escapa los comodines de SQL: `nombre=%` devuelve todo (sin efecto fuera del propio negocio).
- Editar o desactivar categorías y cambiar la tarifa de IVA después del registro todavía no tienen endpoint.
