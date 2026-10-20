import { ValidationError } from "./errors.js";

const MAX_INT = 2147483647;

// Devuelve undefined si el parámetro no vino o llegó vacío; rechaza arrays y objetos (?a[]=1, ?a[b]=1).
export function leerTexto(valor, nombre) {
	if (valor === undefined) {
		return undefined;
	}
	if (typeof valor !== "string") {
		throw new ValidationError(`El parámetro "${nombre}" no es válido.`);
	}
	const texto = valor.trim();
	return texto === "" ? undefined : texto;
}

export function leerEnteroPositivo(valor, nombre) {
	const texto = leerTexto(valor, nombre);
	if (texto === undefined) {
		return undefined;
	}
	const numero = Number(texto);
	if (!/^\d+$/.test(texto) || numero <= 0 || numero > MAX_INT) {
		throw new ValidationError(`El parámetro "${nombre}" debe ser un entero positivo.`);
	}
	return numero;
}

// Fecha YYYY-MM-DD interpretada a medianoche en la hora local del servidor.
export function leerFecha(valor, nombre) {
	const texto = leerTexto(valor, nombre);
	if (texto === undefined) {
		return undefined;
	}
	const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
	if (partes) {
		const [anio, mes, dia] = partes.slice(1).map(Number);
		const fecha = new Date(anio, mes - 1, dia);
		if (fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia) {
			return fecha;
		}
	}
	throw new ValidationError(`El parámetro "${nombre}" debe ser una fecha válida con formato AAAA-MM-DD.`);
}
