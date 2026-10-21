# Guía de demostración — CodeFix Express

Guía para quien presenta. Los datos de demostración los crea `backend/scripts/seed-demo.js` usando los servicios reales de la aplicación (numeración, stock y movimientos son los que genera el sistema, no filas escritas a mano).

## 1. Qué está implementado (por sprint)

| Sprint | Alcance | Qué se puede mostrar |
| ------ | ------- | -------------------- |
| 1 | Autenticación y negocio | Registro de negocio con su ADMIN, login con JWT, roles ADMIN / VENDEDOR / CONTADOR, aislamiento por negocio (multi-tenant) |
| 2 | Productos e inventario | Categorías (crear/listar), productos (crear, editar, activar/desactivar, búsqueda), movimientos ENTRADA / SALIDA / AJUSTE, alertas de stock bajo |
| 3 | Clientes y facturación | Clientes (crear, editar, buscar), emisión de facturas con descuento de stock y numeración consecutiva por negocio |
| 4 | Anulación, filtros e indicadores | Anulación con motivo (repone stock), filtros de facturas (estado, cliente, rango de fechas), indicadores del dashboard, IVA real del negocio en "Nueva factura", reactivación de productos |

## 2. Cómo arrancar todo

Requisito: MariaDB encendida y la base `codefix_express` creada (la conexión está en `backend/.env`).

```bash
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd frontend
npm run dev
```

- Backend: el puerto sale de `PORT` en `backend/.env` (por defecto 3000). Prueba rápida: abrir `http://localhost:<puerto>/api` y ver el mensaje "API CodeFix Express funcionando".
- Frontend: Vite usa 5173 por defecto y muestra la URL real al arrancar. La URL del API sale de `VITE_API_URL` en `frontend/.env` y **debe terminar en `/api`** (por ejemplo `http://localhost:3000/api`).
- Si un puerto está ocupado:
  - Backend: arrancar con otro puerto (`PORT=3101 npm run dev` en bash) y ajustar `VITE_API_URL` para que apunte a ese puerto.
  - Frontend: `npm run dev -- --port 5199 --strictPort`.
  - Antes de matar un proceso, verificar que es tuyo (`netstat -ano | findstr :<puerto>` y el PID en el Administrador de tareas). Puede haber otros proyectos corriendo en la misma máquina.
- Si el login falla con "Network Error", casi siempre `VITE_API_URL` apunta a un puerto donde no está el backend. Reiniciar Vite después de cambiar `frontend/.env`.

## 3. Cargar y recargar los datos demo

Desde `backend/`:

```bash
npm run seed:demo             # carga los datos; si ya existen, avisa y no toca nada
npm run seed:demo -- --reset  # borra SOLO los dos negocios demo y los recrea
```

- Los negocios demo se identifican únicamente por su NIT (`900111222-1` y `900333444-2`). Cualquier otro negocio de la base queda intacto; el script informa cuántos hay.
- Después de usar la demo (crear facturas, anular, editar), correr `--reset` deja todo como al inicio. Es repetible: siempre da el mismo resultado.
- Las facturas se reparten en fechas del **mes en curso**. Si se presenta en otro mes distinto al de la carga, correr `--reset` antes: el indicador de ventas solo cuenta el mes actual.
- Detener el backend no es necesario para correr el seed.

## 4. Credenciales

| Negocio | Rol | Correo |
| ------- | --- | ------ |
| Papelería El Punto (IVA 19 %) | ADMIN | `admin@elpunto.demo` |
| Papelería El Punto | VENDEDOR | `vendedor@elpunto.demo` |
| Papelería El Punto | CONTADOR | `contador@elpunto.demo` |
| Ferretería Los Andes (IVA 5 %) | ADMIN | `admin@losandes.demo` |

Contraseña (la misma para todos): constante `DEMO_PASSWORD` en `backend/scripts/seed-demo.js`.

## 5. Datos que quedan cargados

**Papelería El Punto**: 3 usuarios, 4 categorías, 13 productos, 6 clientes, 12 facturas (10 emitidas + 2 anuladas), 53 movimientos de inventario.

- Productos bajo su stock mínimo: Bolígrafo azul caja x12 (stock 7, mínimo 10) y Marcador permanente negro (stock 9, mínimo 12).
- Producto agotado: Grapadora metálica (stock 0, mínimo 5). Como 0 es menor que su mínimo, **también cuenta como alerta**.
- Producto inactivo: Mouse inalámbrico (solo se ve en `/productos`, con la insignia "Inactivo" y el botón "Activar").
- Cliente inactivo: Luisa Fernanda Gómez (se ve con la insignia "Inactivo" y el botón "Activar" en `/clientes`; no aparece en el selector de "Nueva factura"; sí figura en el filtro de clientes de `/facturas` y tiene la factura #2).
- Facturas anuladas: #6 (motivo: error en la referencia de los productos solicitados) y #10 (motivo: factura duplicada por error de digitación).
- Un AJUSTE de inventario: Marcador permanente negro, de 14 a 9 unidades, motivo "Ajuste por conteo físico".

**Ferretería Los Andes**: 1 usuario ADMIN, 2 categorías, 3 productos, 2 clientes, 2 facturas emitidas, 7 movimientos.

### Números que debe mostrar el dashboard (recién cargado)

| Negocio | Ventas del período | Facturas emitidas | Alertas de stock |
| ------- | ------------------ | ----------------- | ---------------- |
| Papelería El Punto | $ 2.936.920 | 10 | 3 (Bolígrafo, Grapadora, Marcador) |
| Ferretería Los Andes | $ 267.645 | 2 | 0 |

Las facturas anuladas no suman a ventas ni a "Facturas emitidas". El período mostrado es el mes calendario en curso (del 01 al último día del mes).

## 6. Recorrido sugerido (10 minutos)

1. **Login como ADMIN de El Punto** (`admin@elpunto.demo`). Mencionar que el token vive solo en memoria.
2. **Dashboard** (~1 min): ventas del período, facturas emitidas, alertas. Señalar el widget "Alertas de stock" con los 3 productos y su mínimo.
3. **Productos** (~2 min): buscar "cuad" (búsqueda por nombre). Mostrar el Mouse inalámbrico con la insignia "Inactivo" y reactivarlo con "Activar" (volver a "Desactivar" si se quiere dejar el estado). Editar el precio de un producto y mostrar que el stock no se edita aquí ("se cambia desde Inventario").
4. **Inventario** (~2 min): historial con ENTRADA, SALIDA y el AJUSTE del Marcador, con la columna "Motivo". Crear un movimiento de tipo Ajuste: el formulario pide "Stock resultante" y "Motivo". Volver al dashboard y mostrar cómo cambia la alerta.
5. **Clientes** (~30 s): listado con columna "Estado" y búsqueda por nombre o identificación; crear o editar uno; activar a Luisa Fernanda Gómez (volver a desactivarla si se quiere dejar el estado).
6. **Facturas** (~2 min): filtrar por estado "Anulada"; filtrar por rango de fechas (por ejemplo desde el día 6 hasta el día 11 del mes: devuelve las facturas #5 a #9) y por cliente. Abrir el detalle de una emitida (#5) y el de una anulada (#6, muestra el motivo). Anular una emitida como ADMIN y mostrar que el stock vuelve (movimiento ENTRADA "Anulación - factura #N" en Inventario).
7. **Nueva factura** (~1 min): el resumen muestra "Impuesto (IVA 19%)" calculado con la tarifa real del negocio. Ejemplo: 2 resmas de papel carta = subtotal $33.000, IVA $6.270, total $39.270, igual al total que devuelve el servidor al confirmar. Para el mensaje de stock insuficiente: agregar 1 Grapadora metálica (stock 0) y confirmar; aparece el error "no tiene existencias suficientes". Verificar que Luisa Fernanda Gómez no está en el selector de clientes ni el Mouse (inactivo) en el de productos.
8. **Usuarios** (~1 min, solo ADMIN): la lista muestra los tres usuarios con su rol y estado; la fila propia lleva la insignia "Tú" y sus acciones están desactivadas (evita que el administrador se bloquee a sí mismo). Crear un usuario (la contraseña pide mínimo 8 caracteres), cambiarle el rol y desactivarlo/reactivarlo. Un usuario desactivado no puede iniciar sesión. Si se dejan campos vacíos o se repite un correo, el formulario muestra el mensaje del servidor. Después de la demo, `--reset` elimina los usuarios creados.
9. **Roles** (~1 min): cerrar sesión y entrar como VENDEDOR (sin Usuarios, sin indicadores en el dashboard, sin botones de crear/editar productos ni de anular facturas) y como CONTADOR (solo Inicio, Productos y Facturas, sin filtro de cliente).
10. **Aislamiento entre negocios** (~30 s): entrar como `admin@losandes.demo`. Solo ve sus 3 productos, 2 clientes y 2 facturas, nada de El Punto. En "Nueva factura" el IVA es **5 %**, no 19 %.

## 7. Limitaciones (decirlas con honestidad)

- **Pantalla Usuarios**: permite listar, crear, cambiar el rol y activar/desactivar. No permite editar nombre o correo ni cambiar contraseñas, y el administrador no puede actuar sobre su propia cuenta desde la pantalla. El backend además impide dejar al negocio sin ningún administrador activo (mensaje `ULTIMO_ADMIN`); desde la interfaz solo se llegaría a ese caso con la propia cuenta, que está bloqueada.
- **Recargar la página cierra la sesión**: el token JWT se guarda solo en memoria. Navegar con los enlaces del menú, no con la barra de direcciones.
- **Categorías**: solo se pueden crear y listar; editar y desactivar están previstos para más adelante. No hay pantalla de categorías: se gestionan desde la API.
- **IVA**: la tarifa se define solo al registrar el negocio; la edición posterior queda para el Sprint 5.
- **Dashboard**: la alerta de stock cuenta todo producto activo con stock menor al mínimo, incluido el agotado. Los montos se muestran en pesos colombianos (`$ 2.936.920`): sin decimales cuando son enteros y con dos decimales (`$ 1.234,56`) cuando hay centavos.
- **Reportes**: todavía no existen.
- **Alcance de roles**: los indicadores y el widget de alertas solo se muestran al ADMIN.
