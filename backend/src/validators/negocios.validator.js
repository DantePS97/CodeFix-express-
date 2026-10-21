import { esDecimal, esTexto } from "../utils/validacion.js";

const NOMBRE_NEGOCIO_MAX = 150;
const NIT_MAX = 30;
const NOMBRE_ADMIN_MAX = 120;
const CORREO_MAX = 150;

export function validarRegistroNegocio(body) {
	const errores = [];
	const { nombre, nit, tarifaIvaDefault, adminNombre, adminCorreo, adminContrasena } = body ?? {};

	if (!esTexto(nombre, NOMBRE_NEGOCIO_MAX)) {
		errores.push(`El nombre del negocio es obligatorio y no puede superar los ${NOMBRE_NEGOCIO_MAX} caracteres.`);
	}
	if (!esTexto(nit, NIT_MAX)) {
		errores.push(`El NIT del negocio es obligatorio y no puede superar los ${NIT_MAX} caracteres.`);
	}
	if (tarifaIvaDefault !== undefined && !esDecimal(tarifaIvaDefault, 100)) {
		errores.push("La tarifa de IVA debe ser un número entre 0 y 100 con hasta 2 decimales.");
	}
	if (!esTexto(adminNombre, NOMBRE_ADMIN_MAX)) {
		errores.push(`El nombre del administrador es obligatorio y no puede superar los ${NOMBRE_ADMIN_MAX} caracteres.`);
	}
	if (typeof adminCorreo !== "string" || adminCorreo.length > CORREO_MAX || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminCorreo)) {
		errores.push("El correo del administrador no es válido.");
	}
	if (!adminContrasena || typeof adminContrasena !== "string" || adminContrasena.length < 8) {
		errores.push("La contraseña del administrador debe tener al menos 8 caracteres.");
	}

	return errores;
}
