import prisma from "../config/prisma.js";
import { Prisma } from "../generated/prisma/client.ts";
import { ConflictError, NotFoundError, ValidationError } from "../utils/errors.js";

// Todo método recibe tenantId como primer parámetro y lo aplica en la
// consulta (DDS 5.3).

const MAX_INTENTOS_NUMERO = 5;

const INCLUIR_DETALLE = {
	cliente: true,
	detalles: { include: { producto: { select: { id: true, nombre: true, codigo: true } } } },
};

// Ventas simultáneas calculan el mismo número: la restricción única deja pasar una y las demás reintentan.
export async function crear(tenantId, usuarioId, datos) {
	for (let intento = 1; ; intento++) {
		try {
			return await emitir(tenantId, usuarioId, datos);
		} catch (error) {
			if (!esChoqueDeNumero(error)) {
				throw error;
			}
			if (intento >= MAX_INTENTOS_NUMERO) {
				throw new ConflictError(
					"Otra factura se emitió al mismo tiempo. Intentá de nuevo.",
					"NUMERO_FACTURA_DUPLICADO",
				);
			}
		}
	}
}

async function emitir(tenantId, usuarioId, { clienteId, lineas }) {
	return prisma.$transaction(async (tx) => {
		const cliente = await tx.cliente.findFirst({ where: { id: clienteId, tenantId } });
		if (!cliente) {
			throw new NotFoundError("Cliente no encontrado.");
		}
		if (!cliente.activo) {
			throw new ValidationError("El cliente está inactivo.");
		}

		const negocio = await tx.negocio.findUnique({ where: { id: tenantId } });
		if (!negocio) {
			throw new NotFoundError("Negocio no encontrado.");
		}

		// Orden fijo por productoId para tomar los locks de fila siempre en el mismo orden.
		const lineasOrdenadas = [...lineas].sort((a, b) => a.productoId - b.productoId);
		const detalles = [];
		const movimientos = [];

		for (const { productoId, cantidad } of lineasOrdenadas) {
			const producto = await tx.producto.findFirst({ where: { id: productoId, tenantId } });
			if (!producto) {
				throw new NotFoundError(`Producto ${productoId} no encontrado.`);
			}
			if (!producto.activo) {
				throw new ValidationError(`El producto "${producto.nombre}" está inactivo.`);
			}

			// Decremento condicional atómico: evita sobreventa entre ventas concurrentes.
			const { count } = await tx.producto.updateMany({
				where: { id: productoId, tenantId, stock: { gte: cantidad } },
				data: { stock: { decrement: cantidad } },
			});
			if (count === 0) {
				throw new ConflictError(
					`El producto "${producto.nombre}" no tiene existencias suficientes (solicitado: ${cantidad}).`,
					"STOCK_INSUFICIENTE",
				);
			}

			// Se relee tras el UPDATE: la primera lectura puede estar desactualizada por ventas concurrentes.
			const { stock: stockNuevo } = await tx.producto.findFirst({
				where: { id: productoId, tenantId },
				select: { stock: true },
			});

			const precioUnitario = producto.precio;
			detalles.push({
				productoId,
				cantidad,
				precioUnitario,
				subtotalLinea: precioUnitario.mul(cantidad),
			});
			movimientos.push({
				tenantId,
				productoId,
				tipo: "SALIDA",
				cantidad,
				stockAnterior: stockNuevo + cantidad,
				stockNuevo,
			});
		}

		const subtotal = detalles.reduce((acc, d) => acc.add(d.subtotalLinea), new Prisma.Decimal(0));
		const impuesto = subtotal
			.mul(negocio.tarifaIvaDefault)
			.div(100)
			.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
		const total = subtotal.add(impuesto);

		const ultima = await tx.factura.findFirst({
			where: { tenantId },
			orderBy: { numero: "desc" },
			select: { numero: true },
		});
		const numero = (ultima?.numero ?? 0) + 1;

		const factura = await tx.factura.create({
			data: {
				tenantId,
				numero,
				clienteId,
				usuarioId,
				subtotal,
				impuesto,
				total,
				detalles: { create: detalles },
			},
		});

		await tx.movimientoInventario.createMany({
			data: movimientos.map((m) => ({
				...m,
				motivo: `Venta - factura #${numero}`,
				referenciaFacturaId: factura.id,
			})),
		});

		return tx.factura.findFirst({ where: { id: factura.id, tenantId }, include: INCLUIR_DETALLE });
	});
}

export async function listar(tenantId, { clienteId, estado, desde, hastaExclusivo } = {}) {
	const where = { tenantId };
	if (clienteId !== undefined) {
		where.clienteId = clienteId;
	}
	if (estado !== undefined) {
		where.estado = estado;
	}
	if (desde !== undefined || hastaExclusivo !== undefined) {
		where.createdAt = {
			...(desde !== undefined ? { gte: desde } : {}),
			...(hastaExclusivo !== undefined ? { lt: hastaExclusivo } : {}),
		};
	}
	return prisma.factura.findMany({
		where,
		orderBy: { numero: "desc" },
		include: { cliente: true },
	});
}

export async function resumenVentas(tenantId, desde, hastaExclusivo) {
	const { _sum, _count } = await prisma.factura.aggregate({
		where: { tenantId, estado: "EMITIDA", createdAt: { gte: desde, lt: hastaExclusivo } },
		_sum: { total: true },
		_count: { _all: true },
	});
	return {
		ventasPeriodo: _sum.total ?? new Prisma.Decimal(0),
		facturasEmitidas: _count._all,
	};
}

export async function anular(tenantId, facturaId, motivo) {
	return prisma.$transaction(async (tx) => {
		// Transición atómica: solo una de dos anulaciones simultáneas ve count 1.
		const { count } = await tx.factura.updateMany({
			where: { id: facturaId, tenantId, estado: "EMITIDA" },
			data: { estado: "ANULADA", motivoAnulacion: motivo },
		});
		if (count === 0) {
			const existente = await tx.factura.findFirst({ where: { id: facturaId, tenantId }, select: { id: true } });
			if (!existente) {
				throw new NotFoundError("Factura no encontrada.");
			}
			throw new ConflictError("La factura ya está anulada.", "TRANSICION_INVALIDA");
		}

		const { numero, detalles } = await tx.factura.findFirst({
			where: { id: facturaId, tenantId },
			select: { numero: true, detalles: { orderBy: { productoId: "asc" } } },
		});

		const movimientos = [];
		for (const { productoId, cantidad } of detalles) {
			// Se repone aunque el producto esté inactivo: el stock facturado debe volver.
			await tx.producto.updateMany({
				where: { id: productoId, tenantId },
				data: { stock: { increment: cantidad } },
			});
			const { stock: stockNuevo } = await tx.producto.findFirst({
				where: { id: productoId, tenantId },
				select: { stock: true },
			});
			movimientos.push({
				tenantId,
				productoId,
				tipo: "ENTRADA",
				cantidad,
				stockAnterior: stockNuevo - cantidad,
				stockNuevo,
				motivo: `Anulación - factura #${numero}`,
				referenciaFacturaId: facturaId,
			});
		}
		await tx.movimientoInventario.createMany({ data: movimientos });

		return tx.factura.findFirst({ where: { id: facturaId, tenantId }, include: INCLUIR_DETALLE });
	});
}

export async function obtenerPorId(tenantId, facturaId) {
	const factura = await prisma.factura.findFirst({
		where: { id: facturaId, tenantId },
		include: INCLUIR_DETALLE,
	});
	if (!factura) {
		throw new NotFoundError("Factura no encontrada.");
	}
	return factura;
}

// Con el adapter de MariaDB el nombre del índice viaja en meta.driverAdapterError, no en meta.target.
function esChoqueDeNumero(error) {
	if (error?.code !== "P2002") {
		return false;
	}
	const indice = error.meta?.driverAdapterError?.cause?.constraint?.index ?? error.meta?.target;
	return String(indice).includes("numero");
}
