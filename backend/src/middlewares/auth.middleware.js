import prisma from "../config/prisma.js";
import { verificarToken } from "../utils/jwt.js";
import { UnauthorizedError } from "../utils/errors.js";

// El token solo identifica al usuario: rol, negocio y estado se leen de la base en cada request.
export async function auth(req, res, next) {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return next(new UnauthorizedError("Token no proporcionado."));
	}

	const token = authHeader.slice("Bearer ".length);

	let payload;
	try {
		payload = verificarToken(token);
	} catch (error) {
		return next(new UnauthorizedError("Token inválido o expirado."));
	}

	if (!Number.isSafeInteger(payload.id) || !Number.isSafeInteger(payload.tenantId)) {
		return next(new UnauthorizedError("Token inválido o expirado."));
	}

	try {
		const usuario = await prisma.usuario.findFirst({
			where: { id: payload.id, tenantId: payload.tenantId },
			select: { id: true, tenantId: true, rol: true, activo: true },
		});
		if (!usuario || !usuario.activo) {
			return next(new UnauthorizedError("Token inválido o expirado."));
		}
		req.user = { id: usuario.id, rol: usuario.rol, tenantId: usuario.tenantId };
		next();
	} catch (error) {
		next(error);
	}
}
