# CodeFix Express — Frontend

Aplicación web (SPA) de CodeFix Express, una plataforma multi-tenant de facturación, inventario y reportes para pymes. Consume la API del [backend](../backend/README.md).

## Tecnologías

- React 19 y React Router 7
- Vite 8
- Axios para las llamadas a la API
- ESLint
- JavaScript (sin TypeScript) y CSS plano con variables. No usa librerías de componentes, de íconos ni fuentes externas: el logotipo y los íconos son SVG propios.

## Requisitos

- Node.js y npm. El proyecto se desarrolló y probó con Node.js 24.13 y npm 11.
- El backend en ejecución (ver su README).

## Puesta en marcha

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Crea el archivo `.env` en esta carpeta (ver [Variables de entorno](#variables-de-entorno)).

3. Inicia el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   Vite sirve la aplicación en `http://localhost:5173`. Si ese puerto está ocupado, usa el siguiente (por ejemplo 5174) y lo muestra en la terminal. Funciona igual, porque el backend acepta peticiones de cualquier origen.

## Variables de entorno

El archivo `.env` está ignorado por git.

| Variable | Obligatoria | Descripción |
|---|---|---|
| `VITE_API_URL` | Sí | URL base de la API. **Debe terminar en `/api`**. |

```env
VITE_API_URL=http://localhost:3000/api
```

Las variables de Vite se leen al iniciar el servidor: si cambias el `.env`, reinícialo.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente. |
| `npm run build` | Genera la versión de producción en `dist/`. |
| `npm run preview` | Sirve localmente la versión generada por `build`. |
| `npm run lint` | Ejecuta ESLint. |

## Rutas y permisos

La protección de rutas del frontend solo mejora la experiencia de usuario. El control de acceso real ocurre siempre en el backend.

| Ruta | Roles | Pantalla |
|---|---|---|
| `/login` | Público | Inicio de sesión. |
| `/registro-negocio` | Público | Registro de un negocio y su administrador. |
| `/dashboard` | Todos | Inicio con saludo e indicadores (los indicadores solo los ve el ADMIN). |
| `/productos` | Todos | Productos. Solo el ADMIN puede crear, editar y activar o desactivar. |
| `/perfil` | Todos | Perfil (en construcción). Se abre desde el chip de usuario. |
| `/inventario` | ADMIN, VENDEDOR | Movimientos de inventario. El VENDEDOR solo registra salidas. |
| `/clientes` | ADMIN, VENDEDOR | Clientes. |
| `/facturas/nueva` | ADMIN, VENDEDOR | Emisión de facturas. |
| `/facturas` | ADMIN, VENDEDOR, CONTADOR | Listado, filtros y detalle de facturas. Solo el ADMIN anula. |
| `/reportes` | ADMIN, VENDEDOR, CONTADOR | Reportes (en construcción). |
| `/configuracion` | ADMIN, CONTADOR | Configuración (en construcción). |
| `/usuarios` | ADMIN | Gestión de usuarios. |

Una ruta sin permiso, o una que no existe, redirige al inicio (o al login si no hay sesión). Tras iniciar sesión se vuelve a la página que se había pedido.

## Autenticación

- El token JWT se guarda **solo en memoria** (`context/authStorage.js`), nunca en `localStorage`. Por eso **recargar la página cierra la sesión**.
- Un `401` del backend limpia la sesión y devuelve al login. Esto incluye a un usuario que fue desactivado mientras tenía la sesión abierta.
- El rol que muestra la interfaz es el del inicio de sesión. El backend siempre aplica el rol real.

## Estructura

```
frontend/src/
├── api/              Instancia de Axios (baseURL, token e interceptor de 401)
├── context/          AuthContext y authStorage (sesión en memoria)
├── routes/           AppRoutes y ProtectedRoute
├── layouts/          DashboardLayout (menú lateral, barra superior) y navigation.js
├── pages/            Una carpeta por módulo (auth, dashboard, productos, inventario,
│                     clientes, facturas, usuarios, reportes, configuracion, perfil)
├── components/       Componentes reutilizables (ver más abajo)
├── hooks/            useProducts, useClients, useInvoices, useInventory, useUsers...
├── services/         Una función por endpoint; desempaquetan la respuesta
├── utils/            money.js (dinero en pesos colombianos) y roles.js
├── styles/           variables.css (tokens), reset.css, global.css, responsive.css
└── assets/
```

## Convenciones

- **Capas.** `pages` usa `hooks`, los `hooks` usan `services` y los `services` usan la instancia de `api`. Las páginas no llaman a la API directamente.
- **Servicios.** Cada función desempaqueta la respuesta (`data.productos`, `data.usuario`, etc.) para que quien la use reciba el dato directamente. Los errores del backend traen `{ error: { codigo, mensaje } }`, y se muestra el `mensaje` al usuario.
- **Hooks de datos.** Cargan al montar, descartan respuestas atrasadas, exponen `cargando` y `error`, y refrescan la lista después de cada alta o cambio. Un hook que carga al montar debe respetar los permisos del rol: si el rol no puede consultar un recurso, no debe pedirlo.
- **Formularios con `Select`.** Al abrir un formulario hay que preseleccionar un valor real. Un `Select` controlado cuyo valor inicial no coincide con ninguna opción muestra la primera opción, pero el estado sigue vacío.
- **Dinero.** `utils/money.js` formatea en pesos colombianos (`$ 2.936.920`) y calcula el IVA en centavos enteros con redondeo a dos decimales, igual que el backend. La vista previa de una factura usa la tarifa real del negocio.
- **Estilos.** Cada componente tiene su CSS junto al archivo. Los colores, espacios, radios y sombras salen de los tokens de `styles/variables.css`. El aspecto sigue los mapas de pantalla de [`../docs`](../docs).
- **Idioma.** Todo el texto de la interfaz está en español neutro (tú).

## Componentes reutilizables

| Componente | Notas |
|---|---|
| `Button` | También exporta `ButtonLink` y `IconButton` (con nombre accesible). |
| `Input`, `Select` | Campos con etiqueta y mensaje de error. `Input` admite un ícono. |
| `Modal` | Props `open`, `onClose` y `title`. Se cierra con Escape y haciendo clic fuera. |
| `Table`, `Badge` | Tabla basada en elementos hijos y pastillas de estado de color. |
| `Card`, `StatCard` | Tarjetas y tarjeta de indicador (número grande y etiqueta). |
| `PageHeader` | Título de la pantalla con su botón de acción. |
| `Icon`, `Logo` | Íconos y logotipo en SVG. El logotipo vive en un solo componente: para usar el logo original, basta con reemplazarlo ahí. |
| `EnConstruccion` | Aviso de módulo en construcción. |

## Diseño adaptable

El menú lateral se adapta al ancho: a 1024 px o menos pasa a mostrar solo íconos (con tooltip) y a 768 px o menos se convierte en una barra horizontal. Las tablas se desplazan horizontalmente dentro de su tarjeta; la página no se desborda.

## Datos de demostración

Las cuentas y el recorrido para presentar la aplicación están en [`../docs/demo.md`](../docs/demo.md). Los datos se cargan desde el backend con `npm run seed:demo`.

## Estado y límites conocidos

- Reportes, Configuración y Perfil muestran "Módulo en construcción".
- No hay pruebas automatizadas del frontend.
- `npm run lint` informa 9 errores heredados de la regla `react-hooks/set-state-in-effect`, que señala el patrón de carga de datos que usan los hooks del proyecto.
- Las filas clicables del listado de facturas no se pueden enfocar con el teclado.
- Los gráficos de los mapas de pantalla no están implementados (no hay datos que los alimenten).
- El logotipo es un SVG propio, no el logo oficial.
