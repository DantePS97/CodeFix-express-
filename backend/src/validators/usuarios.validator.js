import { esTexto } from "../utils/validacion.js";

const ROLES_VALIDOS = ["ADMIN", "VENDEDOR", "CONTADOR"];
const NOMBRE_MAX = 120;
const CORREO_MAX = 150;

export function validarCrearUsuario(body) {
	const errores = [];
	const { nombre, correo, contrasena, rol } = body ?? {};

	if (!esTexto(nombre, NOMBRE_MAX)) {
		errores.push(`El nombre es obligatorio y no puede superar los ${NOMBRE_MAX} caracteres.`);
	}
	if (typeof correo !== "string" || correo.length > CORREO_MAX || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
		errores.push("El correo no es válido.");
	}
	if (!contrasena || typeof contrasena !== "string" || contrasena.length < 8) {
		errores.push("La contraseña debe tener al menos 8 caracteres.");
	}
	if (!rol || !ROLES_VALIDOS.includes(rol)) {
		errores.push(`El rol debe ser uno de: ${ROLES_VALIDOS.join(", ")}.`);
	}

	return errores;
}

export function validarActualizarUsuario(body) {
	const errores = [];
	const { rol, activo } = body ?? {};

	if (rol === undefined && activo === undefined) {
		errores.push("Debes enviar al menos 'rol' o 'activo' para actualizar.");
	}
	if (rol !== undefined && !ROLES_VALIDOS.includes(rol)) {
		errores.push(`El rol debe ser uno de: ${ROLES_VALIDOS.join(", ")}.`);
	}
	if (activo !== undefined && typeof activo !== "boolean") {
		errores.push("El campo 'activo' debe ser booleano.");
	}

	return errores;
}
