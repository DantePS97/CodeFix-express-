import { MAX_CANTIDAD_MOVIMIENTO, MAX_STOCK, esEntero, esTextoOpcional } from "../utils/validacion.js";

const TIPOS_VALIDOS = ["ENTRADA", "SALIDA", "AJUSTE"];
const MOTIVO_MAX = 255;
const OBSERVACIONES_MAX = 1000;

export function validarMovimiento(body) {
	const errores = [];
	const { productoId, cantidad, tipo, motivo, observaciones } = body ?? {};

	if (!esEntero(productoId, 1)) {
		errores.push("El producto es obligatorio.");
	}
	if (!TIPOS_VALIDOS.includes(tipo)) {
		errores.push(`El tipo debe ser uno de: ${TIPOS_VALIDOS.join(", ")}.`);
	}
	if (tipo === "AJUSTE") {
		if (!esEntero(cantidad, 0, MAX_STOCK)) {
			errores.push(`El stock resultante del ajuste debe ser un entero entre 0 y ${MAX_STOCK}.`);
		}
	} else if (!esEntero(cantidad, 1, MAX_CANTIDAD_MOVIMIENTO)) {
		errores.push(`La cantidad debe ser un entero entre 1 y ${MAX_CANTIDAD_MOVIMIENTO}.`);
	}
	if (tipo === "AJUSTE" && (typeof motivo !== "string" || !motivo.trim())) {
		errores.push("El motivo es obligatorio para un ajuste de inventario.");
	} else if (!esTextoOpcional(motivo, MOTIVO_MAX)) {
		errores.push(`El motivo debe ser texto de hasta ${MOTIVO_MAX} caracteres.`);
	}
	if (!esTextoOpcional(observaciones, OBSERVACIONES_MAX)) {
		errores.push(`Las observaciones deben ser texto de hasta ${OBSERVACIONES_MAX} caracteres.`);
	}

	return errores;
}
