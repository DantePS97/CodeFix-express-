import { esTexto, esTextoOpcional } from "../utils/validacion.js";

const NOMBRE_MAX = 100;
const DESCRIPCION_MAX = 255;

export function validarCrearCategoria(body) {
	const errores = [];
	const { nombre, descripcion } = body ?? {};

	if (!esTexto(nombre, NOMBRE_MAX)) {
		errores.push(`El nombre de la categoría es obligatorio y no puede superar los ${NOMBRE_MAX} caracteres.`);
	}
	if (!esTextoOpcional(descripcion, DESCRIPCION_MAX)) {
		errores.push(`La descripción debe ser texto de hasta ${DESCRIPCION_MAX} caracteres.`);
	}

	return errores;
}
