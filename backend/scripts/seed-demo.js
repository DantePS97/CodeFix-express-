// Datos de demostración de CodeFix Express.
//
//   npm run seed:demo             -> carga los datos (se detiene si ya existen)
//   npm run seed:demo -- --reset  -> borra SOLO los dos negocios demo y los recrea
//
// Reutiliza los servicios reales de la aplicación (negocios, usuarios, categorías,
// productos, clientes, inventario y facturas), así que numeración consecutiva,
// stock y movimientos son los que produce la aplicación, no filas escritas a mano.
// Lo único que se toca directamente con Prisma es la fecha de facturas y
// movimientos (para repartirlas por el mes en curso) y el borrado del --reset.

import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)), quiet: true });

// Contraseña compartida por TODOS los usuarios demo (mínimo 8 caracteres).
const DEMO_PASSWORD = "Demo2026*";

// Los negocios demo se identifican ÚNICAMENTE por estos NIT.
const NIT_PUNTO = "900111222-1";
const NIT_ANDES = "900333444-2";
const NITS_DEMO = [NIT_PUNTO, NIT_ANDES];

const RESET = process.argv.includes("--reset");

// Los servicios importan el cliente de Prisma, que lee DATABASE_URL al cargarse:
// por eso se importan dinámicamente, después de dotenv.config().
const { default: prisma } = await import("../src/config/prisma.js");
const negociosSvc = await import("../src/services/negocios.service.js");
const usuariosSvc = await import("../src/services/usuarios.service.js");
const categoriasSvc = await import("../src/services/categorias.service.js");
const productosSvc = await import("../src/services/productos.service.js");
const clientesSvc = await import("../src/services/clientes.service.js");
const inventarioSvc = await import("../src/services/inventario.service.js");
const facturasSvc = await import("../src/services/facturas.service.js");

// ---------------------------------------------------------------------------
// Datos: Papelería El Punto (IVA 19 %)
// ---------------------------------------------------------------------------

const USUARIOS_PUNTO = [
	{ clave: "vendedor", nombre: "Valentina Ríos", correo: "vendedor@elpunto.demo", rol: "VENDEDOR" },
	{ clave: "contador", nombre: "Camilo Torres", correo: "contador@elpunto.demo", rol: "CONTADOR" },
];
const ADMIN_PUNTO = { nombre: "Andrea Montoya", correo: "admin@elpunto.demo" };

const CATEGORIAS_PUNTO = [
	{ nombre: "Papelería", descripcion: "Papel, cuadernos y notas" },
	{ nombre: "Útiles escolares", descripcion: "Lápices, colores y material escolar" },
	{ nombre: "Oficina", descripcion: "Insumos y accesorios de oficina" },
	{ nombre: "Tecnología", descripcion: "Accesorios y electrónica básica" },
];

// stockMinimo: umbral de la alerta. El stock inicial entra como ENTRADA (historial real).
const PRODUCTOS_PUNTO = [
	{ codigo: "PAP-001", nombre: "Resma de papel carta 75 g (500 hojas)", categoria: "Papelería", precio: 16500, stockMinimo: 10 },
	{ codigo: "PAP-002", nombre: "Cuaderno cuadriculado 100 hojas", categoria: "Papelería", precio: 4500, stockMinimo: 20 },
	{ codigo: "PAP-003", nombre: "Block de notas adhesivas", categoria: "Papelería", precio: 3800, stockMinimo: 15 },
	{ codigo: "UTI-001", nombre: "Lápiz HB caja x12", categoria: "Útiles escolares", precio: 9800, stockMinimo: 10 },
	{ codigo: "UTI-002", nombre: "Colores x24", categoria: "Útiles escolares", precio: 14500, stockMinimo: 8 },
	{ codigo: "UTI-003", nombre: "Borrador de nata", categoria: "Útiles escolares", precio: 900, stockMinimo: 30 },
	{ codigo: "OFI-001", nombre: "Bolígrafo azul caja x12", categoria: "Oficina", precio: 12000, stockMinimo: 10 },
	{ codigo: "OFI-002", nombre: "Carpeta archivadora AZ", categoria: "Oficina", precio: 8900, stockMinimo: 8 },
	{ codigo: "OFI-003", nombre: "Grapadora metálica", categoria: "Oficina", precio: 18500, stockMinimo: 5 },
	{ codigo: "OFI-004", nombre: "Marcador permanente negro", categoria: "Oficina", precio: 3200, stockMinimo: 12 },
	{ codigo: "TEC-001", nombre: "Memoria USB 32 GB", categoria: "Tecnología", precio: 28900, stockMinimo: 5 },
	{ codigo: "TEC-002", nombre: "Calculadora científica", categoria: "Tecnología", precio: 54900, stockMinimo: 4 },
	{ codigo: "TEC-003", nombre: "Mouse inalámbrico", categoria: "Tecnología", precio: 35000, stockMinimo: 3 },
];

const CLIENTES_PUNTO = [
	{ clave: "colegio", nombre: "Colegio Santa Lucía", identificacion: "NIT 900.456.781-3", contacto: "310 555 0101 · compras@santalucia.demo" },
	{ clave: "ana", nombre: "Ana María Rodríguez", identificacion: "CC 1020456789", contacto: "311 555 0142 · ana.rodriguez@correo.demo" },
	{ clave: "mayorga", nombre: "Distribuciones Mayorga S.A.S.", identificacion: "NIT 901.234.567-8", contacto: "601 555 0177 · pedidos@mayorga.demo" },
	{ clave: "carlos", nombre: "Carlos Andrés Peña", identificacion: "CC 79845123", contacto: "315 555 0188" },
	{ clave: "integradas", nombre: "Oficinas Integradas Ltda.", identificacion: "NIT 800.987.654-1", contacto: "602 555 0133 · compras@oficinasintegradas.demo" },
	{ clave: "luisa", nombre: "Luisa Fernanda Gómez", identificacion: "CC 52310987", contacto: "320 555 0166" },
];
// Se desactiva al final: no debe aparecer en el selector de "Nueva factura".
const CLIENTE_INACTIVO_PUNTO = "luisa";
// Se desactiva al final: solo se ve en /productos con la insignia "Inactivo".
const PRODUCTO_INACTIVO_PUNTO = "TEC-003";

const COMPRA_INICIAL_PUNTO = [
	["PAP-001", 80, "Papelera Andina"],
	["PAP-002", 100, "Distribuidora Escolar"],
	["PAP-003", 100, "Papelera Andina"],
	["UTI-001", 60, "Distribuidora Escolar"],
	["UTI-002", 30, "Distribuidora Escolar"],
	["UTI-003", 200, "Distribuidora Escolar"],
	["OFI-001", 24, "Suministros Oficina Total"],
	["OFI-002", 45, "Suministros Oficina Total"],
	["OFI-003", 10, "Suministros Oficina Total"],
	["OFI-004", 24, "Suministros Oficina Total"],
	["TEC-001", 30, "Tecnoaccesorios del Norte"],
	["TEC-002", 15, "Tecnoaccesorios del Norte"],
	["TEC-003", 12, "Tecnoaccesorios del Norte"],
];

// Línea de tiempo en orden cronológico. `p` (0..1) es el avance dentro del mes
// transcurrido; el reloj lo convierte en una fecha real que nunca cae en el futuro.
const PASOS_PUNTO = [
	...COMPRA_INICIAL_PUNTO.map(([codigo, cantidad, proveedor]) => ({
		tipo: "movimiento",
		mov: "ENTRADA",
		codigo,
		cantidad,
		motivo: `Compra inicial de inventario - ${proveedor}`,
		p: 0,
	})),
	{ tipo: "factura", ref: "F1", cliente: "colegio", usuario: "vendedor", lineas: [["PAP-001", 10], ["PAP-002", 30], ["UTI-001", 10]], p: 0.05 },
	{ tipo: "factura", ref: "F2", cliente: "luisa", usuario: "vendedor", lineas: [["UTI-002", 4], ["UTI-003", 20]], p: 0.09 },
	{ tipo: "factura", ref: "F3", cliente: "mayorga", usuario: "admin", lineas: [["PAP-001", 20], ["OFI-002", 10], ["OFI-001", 5]], p: 0.14 },
	{ tipo: "factura", ref: "F4", cliente: "ana", usuario: "vendedor", lineas: [["TEC-001", 2], ["TEC-002", 1]], p: 0.19 },
	{ tipo: "factura", ref: "F5", cliente: "integradas", usuario: "vendedor", lineas: [["OFI-002", 8], ["PAP-003", 15], ["OFI-004", 6], ["OFI-001", 8]], p: 0.24 },
	{ tipo: "factura", ref: "F6", cliente: "colegio", usuario: "vendedor", lineas: [["TEC-002", 3], ["TEC-001", 5]], p: 0.28 },
	{ tipo: "anular", ref: "F6", motivo: "Error en la referencia de los productos solicitados", p: 0.31 },
	{ tipo: "factura", ref: "F7", cliente: "carlos", usuario: "vendedor", lineas: [["UTI-001", 5], ["PAP-002", 12]], p: 0.36 },
	{ tipo: "movimiento", mov: "ENTRADA", codigo: "PAP-002", cantidad: 60, motivo: "Reposición de cuadernos - Distribuidora Escolar", p: 0.4 },
	{ tipo: "factura", ref: "F8", cliente: "mayorga", usuario: "admin", lineas: [["PAP-001", 15], ["PAP-003", 10], ["OFI-004", 4]], p: 0.44 },
	{ tipo: "movimiento", mov: "SALIDA", codigo: "OFI-001", cantidad: 4, motivo: "Consumo interno de la tienda", p: 0.48 },
	{ tipo: "factura", ref: "F9", cliente: "ana", usuario: "vendedor", lineas: [["OFI-003", 4], ["OFI-002", 2]], p: 0.52 },
	{ tipo: "factura", ref: "F10", cliente: "integradas", usuario: "vendedor", lineas: [["OFI-001", 6], ["OFI-003", 5]], p: 0.58 },
	{ tipo: "anular", ref: "F10", motivo: "Factura duplicada por error de digitación", p: 0.6 },
	{
		tipo: "movimiento",
		mov: "AJUSTE",
		codigo: "OFI-004",
		cantidad: 9,
		motivo: "Ajuste por conteo físico",
		observaciones: "El conteo del estante arrojó 9 unidades; el sistema indicaba 14 (faltante de 5).",
		p: 0.66,
	},
	{ tipo: "movimiento", mov: "ENTRADA", codigo: "UTI-001", cantidad: 30, motivo: "Reposición de lápices - Distribuidora Escolar", p: 0.7 },
	{ tipo: "factura", ref: "F11", cliente: "colegio", usuario: "admin", lineas: [["UTI-003", 30], ["PAP-002", 25], ["UTI-001", 20]], p: 0.8 },
	{ tipo: "factura", ref: "F12", cliente: "carlos", usuario: "vendedor", lineas: [["TEC-001", 3], ["TEC-002", 2], ["PAP-003", 6], ["OFI-003", 6]], p: 0.92 },
];

// Estado final esperado tras TODA la línea de tiempo (se verifica al terminar).
const STOCK_FINAL_PUNTO = {
	"PAP-001": 35,
	"PAP-002": 93,
	"PAP-003": 69,
	"UTI-001": 55,
	"UTI-002": 26,
	"UTI-003": 150,
	"OFI-001": 7,
	"OFI-002": 25,
	"OFI-003": 0,
	"OFI-004": 9,
	"TEC-001": 25,
	"TEC-002": 12,
	"TEC-003": 12,
};
const ALERTAS_ESPERADAS_PUNTO = ["OFI-001", "OFI-003", "OFI-004"];

// ---------------------------------------------------------------------------
// Datos: Ferretería Los Andes (IVA 5 %, a propósito distinto)
// ---------------------------------------------------------------------------

const ADMIN_ANDES = { nombre: "Mauricio Velásquez", correo: "admin@losandes.demo" };
const CATEGORIAS_ANDES = [
	{ nombre: "Herramientas", descripcion: "Herramientas manuales" },
	{ nombre: "Tornillería", descripcion: "Tornillos, puntillas y fijaciones" },
];
const PRODUCTOS_ANDES = [
	{ codigo: "FER-001", nombre: "Martillo de carpintero 16 oz", categoria: "Herramientas", precio: 32900, stockMinimo: 5 },
	{ codigo: "FER-002", nombre: "Caja de tornillos 1 pulgada x100", categoria: "Tornillería", precio: 7500, stockMinimo: 20 },
	{ codigo: "FER-003", nombre: "Cinta métrica 5 m", categoria: "Herramientas", precio: 12900, stockMinimo: 8 },
];
const CLIENTES_ANDES = [
	{ clave: "constructora", nombre: "Constructora Andina S.A.S.", identificacion: "NIT 900.765.432-1", contacto: "601 555 0210 · obras@andina.demo" },
	{ clave: "jorge", nombre: "Jorge Luis Ramírez", identificacion: "CC 80123456", contacto: "300 555 0155" },
];
const PASOS_ANDES = [
	{ tipo: "movimiento", mov: "ENTRADA", codigo: "FER-001", cantidad: 25, motivo: "Compra inicial de inventario - Ferrisurtidos", p: 0 },
	{ tipo: "movimiento", mov: "ENTRADA", codigo: "FER-002", cantidad: 80, motivo: "Compra inicial de inventario - Ferrisurtidos", p: 0 },
	{ tipo: "movimiento", mov: "ENTRADA", codigo: "FER-003", cantidad: 40, motivo: "Compra inicial de inventario - Ferrisurtidos", p: 0 },
	{ tipo: "factura", ref: "A1", cliente: "constructora", usuario: "admin", lineas: [["FER-001", 4], ["FER-002", 10]], p: 0.3 },
	{ tipo: "factura", ref: "A2", cliente: "jorge", usuario: "admin", lineas: [["FER-003", 2], ["FER-002", 3]], p: 0.75 },
];
const STOCK_FINAL_ANDES = { "FER-001": 21, "FER-002": 67, "FER-003": 38 };

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

// Convierte el avance `p` de cada paso en una fecha dentro del mes en curso:
// nunca antes del día 1 ni después de "ahora". Los pasos de un mismo día se
// reparten en horario comercial (8:30-18:30), recortado a la hora actual si es hoy.
function calcularMarcasDeTiempo(pasos) {
	const ahora = new Date();
	const diasTranscurridos = ahora.getDate();
	const dias = pasos.map((paso) => Math.min(diasTranscurridos - 1, Math.floor(paso.p * diasTranscurridos)));

	const porDia = new Map();
	dias.forEach((dia, i) => porDia.set(dia, [...(porDia.get(dia) ?? []), i]));

	const marcas = new Array(pasos.length);
	for (const [dia, indices] of porDia) {
		const inicioDia = new Date(ahora.getFullYear(), ahora.getMonth(), dia + 1);
		let desde = new Date(ahora.getFullYear(), ahora.getMonth(), dia + 1, 8, 30);
		let hasta = new Date(ahora.getFullYear(), ahora.getMonth(), dia + 1, 18, 30);
		if (dia === diasTranscurridos - 1) {
			const limite = new Date(ahora.getTime() - 60 * 1000);
			if (limite < hasta) hasta = limite;
			if (hasta <= desde) {
				// Hoy y todavía temprano: se reparte entre medianoche y ahora.
				desde = inicioDia;
				hasta = limite > inicioDia ? limite : inicioDia;
			}
		}
		indices.forEach((indice, k) => {
			marcas[indice] = new Date(desde.getTime() + ((k + 1) / (indices.length + 1)) * (hasta.getTime() - desde.getTime()));
		});
	}
	return marcas;
}

async function fecharMovimiento(movimientoId, fecha) {
	await prisma.movimientoInventario.update({
		where: { id: movimientoId },
		data: { fechaMovimiento: fecha, createdAt: fecha, updatedAt: fecha },
	});
}

async function fecharFactura(facturaId, fecha) {
	await prisma.factura.update({ where: { id: facturaId }, data: { createdAt: fecha, updatedAt: fecha } });
	await prisma.movimientoInventario.updateMany({
		where: { referenciaFacturaId: facturaId, tipo: "SALIDA" },
		data: { fechaMovimiento: fecha, createdAt: fecha, updatedAt: fecha },
	});
}

async function fecharAnulacion(facturaId, fecha) {
	await prisma.factura.update({ where: { id: facturaId }, data: { updatedAt: fecha } });
	await prisma.movimientoInventario.updateMany({
		where: { referenciaFacturaId: facturaId, tipo: "ENTRADA" },
		data: { fechaMovimiento: fecha, createdAt: fecha, updatedAt: fecha },
	});
}

function dinero(valor) {
	return `$${Number(valor).toLocaleString("es-CO")}`;
}

async function borrarNegociosDemo() {
	const negocios = await prisma.negocio.findMany({ where: { nit: { in: NITS_DEMO } }, select: { id: true, nit: true } });
	if (negocios.length === 0) return 0;

	const ids = negocios.map((n) => n.id);
	// Hijos primero, respetando las claves foráneas. Solo se tocan filas de los negocios demo.
	await prisma.$transaction([
		prisma.detalleFactura.deleteMany({ where: { factura: { tenantId: { in: ids } } } }),
		prisma.movimientoInventario.deleteMany({ where: { tenantId: { in: ids } } }),
		prisma.factura.deleteMany({ where: { tenantId: { in: ids } } }),
		prisma.producto.deleteMany({ where: { tenantId: { in: ids } } }),
		prisma.categoriaProducto.deleteMany({ where: { tenantId: { in: ids } } }),
		prisma.cliente.deleteMany({ where: { tenantId: { in: ids } } }),
		prisma.usuario.deleteMany({ where: { tenantId: { in: ids } } }),
		prisma.negocio.deleteMany({ where: { id: { in: ids }, nit: { in: NITS_DEMO } } }),
	]);
	return negocios.length;
}

// Crea un negocio completo y ejecuta su línea de tiempo con los servicios reales.
async function sembrarNegocio({ nombre, nit, tarifaIva, admin, usuarios, categorias, productos, clientes, pasos, stockFinal }) {
	const { negocio, usuario: adminCreado } = await negociosSvc.registrarNegocioConAdmin({
		nombre,
		nit,
		tarifaIvaDefault: tarifaIva,
		adminNombre: admin.nombre,
		adminCorreo: admin.correo,
		adminContrasena: DEMO_PASSWORD,
	});
	const tenantId = negocio.id;

	const usuariosPorClave = { admin: adminCreado.id };
	const filasUsuarios = [{ rol: "ADMIN", correo: admin.correo, nombre: admin.nombre }];
	for (const u of usuarios) {
		const creado = await usuariosSvc.crearUsuario(tenantId, {
			nombre: u.nombre,
			correo: u.correo,
			contrasena: DEMO_PASSWORD,
			rol: u.rol,
		});
		usuariosPorClave[u.clave] = creado.id;
		filasUsuarios.push({ rol: u.rol, correo: u.correo, nombre: u.nombre });
	}

	const categoriaIds = {};
	for (const c of categorias) {
		categoriaIds[c.nombre] = (await categoriasSvc.crearCategoria(tenantId, c)).id;
	}

	// Los productos nacen con stock 0: el stock entra por movimientos de ENTRADA.
	const productoIds = {};
	for (const p of productos) {
		const creado = await productosSvc.crear(tenantId, {
			nombre: p.nombre,
			codigo: p.codigo,
			precio: p.precio,
			stockMinimo: p.stockMinimo,
			categoriaId: categoriaIds[p.categoria],
		});
		productoIds[p.codigo] = creado.id;
	}

	const clienteIds = {};
	for (const c of clientes) {
		clienteIds[c.clave] = (await clientesSvc.crear(tenantId, c)).id;
	}

	const marcas = calcularMarcasDeTiempo(pasos);
	const facturaIds = {};
	for (const [i, paso] of pasos.entries()) {
		const fecha = marcas[i];

		if (paso.tipo === "movimiento") {
			const movimiento = await inventarioSvc.registrarMovimiento(tenantId, {
				productoId: productoIds[paso.codigo],
				tipo: paso.mov,
				cantidad: paso.cantidad,
				motivo: paso.motivo,
				observaciones: paso.observaciones,
			});
			await fecharMovimiento(movimiento.id, fecha);
		} else if (paso.tipo === "factura") {
			const factura = await facturasSvc.crear(tenantId, usuariosPorClave[paso.usuario], {
				clienteId: clienteIds[paso.cliente],
				lineas: paso.lineas.map(([codigo, cantidad]) => ({ productoId: productoIds[codigo], cantidad })),
			});
			facturaIds[paso.ref] = factura.id;
			await fecharFactura(factura.id, fecha);
		} else if (paso.tipo === "anular") {
			await facturasSvc.anular(tenantId, facturaIds[paso.ref], paso.motivo);
			await fecharAnulacion(facturaIds[paso.ref], fecha);
		}
	}

	return { negocio, tenantId, filasUsuarios, productoIds, clienteIds, stockFinal };
}

async function verificarStock(tenantId, stockFinal) {
	const productos = await prisma.producto.findMany({ where: { tenantId } });
	for (const p of productos) {
		if (p.stock !== stockFinal[p.codigo]) {
			throw new Error(`Stock inesperado en ${p.codigo}: ${p.stock} (esperado ${stockFinal[p.codigo]}).`);
		}
	}
	if (productos.length !== Object.keys(stockFinal).length) {
		throw new Error("La cantidad de productos no coincide con la esperada.");
	}
}

async function resumenNegocio(tenantId, nombre, tarifaIva) {
	const [usuarios, categorias, productos, clientes, facturas, movimientos] = await Promise.all([
		prisma.usuario.count({ where: { tenantId } }),
		prisma.categoriaProducto.count({ where: { tenantId } }),
		prisma.producto.findMany({ where: { tenantId } }),
		prisma.cliente.findMany({ where: { tenantId } }),
		prisma.factura.findMany({ where: { tenantId } }),
		prisma.movimientoInventario.groupBy({ by: ["tipo"], where: { tenantId }, _count: { _all: true } }),
	]);
	const emitidas = facturas.filter((f) => f.estado === "EMITIDA");
	const ventas = emitidas.reduce((acc, f) => acc + Number(f.total), 0);
	const alertas = productos.filter((p) => p.activo && p.stock < p.stockMinimo);
	const porTipo = Object.fromEntries(movimientos.map((m) => [m.tipo, m._count._all]));
	const totalMov = movimientos.reduce((acc, m) => acc + m._count._all, 0);

	console.log(`\n${nombre} (IVA ${tarifaIva} %)`);
	console.log(`  Usuarios: ${usuarios} | Categorías: ${categorias}`);
	console.log(
		`  Productos: ${productos.length} (activos ${productos.filter((p) => p.activo).length}, ` +
			`inactivos ${productos.filter((p) => !p.activo).length}, agotados ${productos.filter((p) => p.activo && p.stock === 0).length}, ` +
			`en alerta de stock ${alertas.length}: ${alertas.map((p) => p.codigo).join(", ") || "-"})`,
	);
	console.log(`  Clientes: ${clientes.length} (inactivos ${clientes.filter((c) => !c.activo).length})`);
	console.log(
		`  Facturas: ${facturas.length} (emitidas ${emitidas.length}, anuladas ${facturas.length - emitidas.length}) | ` +
			`Ventas del mes (emitidas): ${dinero(ventas)}`,
	);
	console.log(
		`  Movimientos de inventario: ${totalMov} (ENTRADA ${porTipo.ENTRADA ?? 0}, SALIDA ${porTipo.SALIDA ?? 0}, AJUSTE ${porTipo.AJUSTE ?? 0})`,
	);
}

// ---------------------------------------------------------------------------
// Programa principal
// ---------------------------------------------------------------------------

async function main() {
	const existentes = await prisma.negocio.findMany({ where: { nit: { in: NITS_DEMO } }, select: { nombre: true, nit: true } });

	if (existentes.length > 0 && !RESET) {
		console.log("Los datos demo ya existen:");
		existentes.forEach((n) => console.log(`  - ${n.nombre} (NIT ${n.nit})`));
		console.log("No se modificó nada. Para borrarlos y recrearlos usá: npm run seed:demo -- --reset");
		return;
	}

	const otros = await prisma.negocio.count({ where: { nit: { notIn: NITS_DEMO } } });
	console.log(`Negocios que NO son demo en la base de datos (no se tocan): ${otros}`);

	if (RESET) {
		const borrados = await borrarNegociosDemo();
		console.log(`--reset: negocios demo eliminados: ${borrados}`);
	}

	const correos = [ADMIN_PUNTO.correo, ...USUARIOS_PUNTO.map((u) => u.correo), ADMIN_ANDES.correo];
	const ocupados = await prisma.usuario.findMany({ where: { correo: { in: correos } }, select: { correo: true } });
	if (ocupados.length > 0) {
		throw new Error(
			`Estos correos demo ya pertenecen a otro negocio y no se pueden usar: ${ocupados.map((u) => u.correo).join(", ")}. No se modificó nada.`,
		);
	}

	console.log("Creando datos demo...");
	const punto = await sembrarNegocio({
		nombre: "Papelería El Punto",
		nit: NIT_PUNTO,
		tarifaIva: 19,
		admin: ADMIN_PUNTO,
		usuarios: USUARIOS_PUNTO,
		categorias: CATEGORIAS_PUNTO,
		productos: PRODUCTOS_PUNTO,
		clientes: CLIENTES_PUNTO,
		pasos: PASOS_PUNTO,
		stockFinal: STOCK_FINAL_PUNTO,
	});

	// Estados que se aplican al final para no interferir con la facturación.
	await clientesSvc.actualizar(punto.tenantId, punto.clienteIds[CLIENTE_INACTIVO_PUNTO], { activo: false });
	await productosSvc.actualizar(punto.tenantId, punto.productoIds[PRODUCTO_INACTIVO_PUNTO], { activo: false });

	await verificarStock(punto.tenantId, STOCK_FINAL_PUNTO);
	const alertas = (await productosSvc.listarAlertasStock(punto.tenantId)).map((p) => p.codigo).sort();
	if (JSON.stringify(alertas) !== JSON.stringify([...ALERTAS_ESPERADAS_PUNTO].sort())) {
		throw new Error(`Alertas de stock inesperadas: ${alertas.join(", ")}`);
	}

	const andes = await sembrarNegocio({
		nombre: "Ferretería Los Andes",
		nit: NIT_ANDES,
		tarifaIva: 5,
		admin: ADMIN_ANDES,
		usuarios: [],
		categorias: CATEGORIAS_ANDES,
		productos: PRODUCTOS_ANDES,
		clientes: CLIENTES_ANDES,
		pasos: PASOS_ANDES,
		stockFinal: STOCK_FINAL_ANDES,
	});
	await verificarStock(andes.tenantId, STOCK_FINAL_ANDES);

	console.log("\n=== Resumen de datos demo ===");
	await resumenNegocio(punto.tenantId, "Papelería El Punto", 19);
	await resumenNegocio(andes.tenantId, "Ferretería Los Andes", 5);

	const filas = [
		...punto.filasUsuarios.map((u) => ({ negocio: "Papelería El Punto", ...u })),
		...andes.filasUsuarios.map((u) => ({ negocio: "Ferretería Los Andes", ...u })),
	];
	console.log("\n=== Usuarios demo ===");
	console.log(`${"Negocio".padEnd(22)}${"Rol".padEnd(10)}Correo`);
	filas.forEach((f) => console.log(`${f.negocio.padEnd(22)}${f.rol.padEnd(10)}${f.correo}`));
	console.log("\nContraseña de todos los usuarios: constante DEMO_PASSWORD al inicio de backend/scripts/seed-demo.js");
}

let codigoSalida = 0;
try {
	await main();
} catch (error) {
	console.error("\nError en el seed demo:", error.message ?? error);
	codigoSalida = 1;
} finally {
	await prisma.$disconnect();
}
process.exit(codigoSalida);
