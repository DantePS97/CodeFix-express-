import { AppError } from "../utils/errors.js";

// Middleware de 4 parámetros: Express lo reconoce como manejador de errores
// solo si tiene esta firma exacta. Debe montarse al final, después de todas
// las rutas (DDS 4.4).
export function errorHandler(err, req, res, next) {
	if (err instanceof AppError) {
		return res.status(err.status).json({ error: { codigo: err.codigo, mensaje: err.message } });
	}

	if (err?.type === "entity.parse.failed") {
		return res
			.status(400)
			.json({ error: { codigo: "VALIDACION", mensaje: "El cuerpo de la solicitud no es un JSON válido." } });
	}

	if (err?.type === "entity.too.large") {
		return res
			.status(413)
			.json({ error: { codigo: "CUERPO_DEMASIADO_GRANDE", mensaje: "El cuerpo de la solicitud es demasiado grande." } });
	}

	console.error(err);
	return res
		.status(500)
		.json({ error: { codigo: "ERROR_INTERNO", mensaje: "Ocurrió un error inesperado." } });
}
