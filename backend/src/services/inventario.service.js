import prisma from "../config/prisma.js";
import { ConflictError, NotFoundError } from "../utils/errors.js";
import { MAX_STOCK } from "../utils/validacion.js";

// Todo método recibe tenantId como primer parámetro y lo aplica en la
// consulta (DDS 5.3) — mismo patrón que negocios.service.js del Sprint 1.

async function leerStock(tx, tenantId, productoId) {
	const producto = await tx.producto.findFirst({ where: { id: productoId, tenantId }, select: { stock: true } });
	if (!producto) {
		throw new NotFoundError("Producto no encontrado.");
	}
	return producto.stock;
}

// Cada tipo se resuelve con una sola sentencia atómica sobre la fila del producto: sin lecturas intermedias que pierdan actualizaciones.
async function aplicarStock(tx, tenantId, { productoId, tipo, cantidad }) {
	if (tipo === "ENTRADA") {
		const { count } = await tx.producto.updateMany({
			where: { id: productoId, tenantId, stock: { lte: MAX_STOCK - cantidad } },
			data: { stock: { increment: cantidad } },
		});
		if (count === 0) {
			const disponible = await leerStock(tx, tenantId, productoId);
			throw new ConflictError(
				`El stock resultante superaría el máximo permitido (disponible: ${disponible}, entrada: ${cantidad}, máximo: ${MAX_STOCK}).`,
				"STOCK_MAXIMO_EXCEDIDO",
			);
		}
		const stockNuevo = await leerStock(tx, tenantId, productoId);
		return { stockAnterior: stockNuevo - cantidad, stockNuevo };
	}

	if (tipo === "SALIDA") {
		const { count } = await tx.producto.updateMany({
			where: { id: productoId, tenantId, stock: { gte: cantidad } },
			data: { stock: { decrement: cantidad } },
		});
		if (count === 0) {
			const disponible = await leerStock(tx, tenantId, productoId);
			throw new ConflictError(
				`El producto no tiene existencias suficientes (disponible: ${disponible}, solicitado: ${cantidad}).`,
				"STOCK_INSUFICIENTE",
			);
		}
		const stockNuevo = await leerStock(tx, tenantId, productoId);
		return { stockAnterior: stockNuevo + cantidad, stockNuevo };
	}

	// AJUSTE: la cantidad es el nuevo valor absoluto tras un conteo físico, no un delta.
	// El bloqueo de fila hace exacto el stockAnterior mientras dure la transacción.
	const filas = await tx.$queryRaw`SELECT stock FROM productos WHERE id = ${productoId} AND tenantId = ${tenantId} FOR UPDATE`;
	if (filas.length === 0) {
		throw new NotFoundError("Producto no encontrado.");
	}
	await tx.producto.update({ where: { id: productoId }, data: { stock: cantidad } });
	return { stockAnterior: Number(filas[0].stock), stockNuevo: cantidad };
}

export async function registrarMovimiento(tenantId, datos) {
	const { productoId, tipo, cantidad, motivo, observaciones } = datos;

	return prisma.$transaction(async (tx) => {
		const { stockAnterior, stockNuevo } = await aplicarStock(tx, tenantId, { productoId, tipo, cantidad });

		return tx.movimientoInventario.create({
			data: {
				tenantId,
				productoId,
				tipo,
				cantidad,
				stockAnterior,
				stockNuevo,
				motivo: motivo?.trim(),
				observaciones,
			},
		});
	});
}

export async function listarMovimientos(tenantId, { productoId } = {}) {
	const where = { tenantId };
	if (productoId !== undefined) {
		where.productoId = productoId;
	}
	return prisma.movimientoInventario.findMany({
		where,
		orderBy: { fechaMovimiento: "desc" },
		include: { producto: { select: { id: true, nombre: true, codigo: true } } },
	});
}
