import prisma from "../config/prisma.js";
import { NotFoundError } from "../utils/errors.js";

// Todo método recibe tenantId como primer parámetro y lo aplica en la
// consulta (DDS 5.3). Los campos se copian uno a uno: el body no puede inyectar tenantId.

export async function listar(tenantId, filtros = {}) {
	const where = { tenantId };
	if (filtros.activo !== undefined) {
		where.activo = filtros.activo;
	}
	return prisma.cliente.findMany({
		where,
		orderBy: { nombre: "asc" },
	});
}

export async function crear(tenantId, { nombre, identificacion, contacto }) {
	return prisma.cliente.create({
		data: { tenantId, nombre: nombre.trim(), identificacion, contacto },
	});
}

export async function actualizar(tenantId, clienteId, cambios) {
	const cliente = await prisma.cliente.findFirst({ where: { id: clienteId, tenantId } });
	if (!cliente) {
		throw new NotFoundError("Cliente no encontrado.");
	}

	const { nombre, identificacion, contacto, activo } = cambios;
	return prisma.cliente.update({
		where: { id: clienteId },
		data: {
			...(nombre !== undefined ? { nombre: nombre.trim() } : {}),
			...(identificacion !== undefined ? { identificacion } : {}),
			...(contacto !== undefined ? { contacto } : {}),
			...(activo !== undefined ? { activo } : {}),
		},
	});
}
