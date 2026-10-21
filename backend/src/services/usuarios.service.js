import prisma from "../config/prisma.js";
import { hashPassword } from "../utils/hash.js";
import { ConflictError, NotFoundError } from "../utils/errors.js";

// Todo método recibe tenantId como primer parámetro y lo aplica en la
// consulta (DDS 5.3): ningún ADMIN puede ver o tocar usuarios de otro negocio.

export async function listarUsuarios(tenantId) {
	return prisma.usuario.findMany({
		where: { tenantId },
		select: { id: true, nombre: true, correo: true, rol: true, activo: true, creadoEn: true },
		orderBy: { creadoEn: "asc" },
	});
}

export async function crearUsuario(tenantId, { nombre, correo, contrasena, rol }) {
	const contraseñaHash = await hashPassword(contrasena);

	try {
		const usuario = await prisma.usuario.create({
			data: { tenantId, nombre: nombre.trim(), correo, contraseñaHash, rol },
		});
		return sanear(usuario);
	} catch (error) {
		if (error.code === "P2002") {
			throw new ConflictError("Ya existe un usuario registrado con ese correo.", "CORREO_DUPLICADO");
		}
		throw error;
	}
}

export async function actualizarUsuario(tenantId, usuarioId, cambios) {
	const actualizado = await prisma.$transaction(async (tx) => {
		// Se bloquean todos los usuarios del negocio en orden de id: dos cambios simultáneos se serializan y el segundo ve el resultado del primero.
		const usuarios = await tx.$queryRaw`SELECT id, rol, activo FROM Usuario WHERE tenantId = ${tenantId} ORDER BY id FOR UPDATE`;
		const usuario = usuarios.find((u) => u.id === usuarioId);
		if (!usuario) {
			throw new NotFoundError("Usuario no encontrado.");
		}

		const esAdminActivo = (u) => u.rol === "ADMIN" && Boolean(u.activo);
		const dejaDeSerAdmin =
			esAdminActivo(usuario) &&
			(cambios.activo === false || (cambios.rol !== undefined && cambios.rol !== "ADMIN"));
		if (dejaDeSerAdmin && usuarios.filter(esAdminActivo).length === 1) {
			throw new ConflictError(
				"No se puede desactivar ni quitar el rol de administrador al último administrador activo del negocio.",
				"ULTIMO_ADMIN",
			);
		}

		return tx.usuario.update({
			where: { id: usuarioId },
			data: {
				...(cambios.rol !== undefined ? { rol: cambios.rol } : {}),
				...(cambios.activo !== undefined ? { activo: cambios.activo } : {}),
			},
		});
	});

	return sanear(actualizado);
}

function sanear(usuario) {
	const { contraseñaHash, ...resto } = usuario;
	return resto;
}
