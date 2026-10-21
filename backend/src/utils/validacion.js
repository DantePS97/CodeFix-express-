import { MAX_INT } from "./query.js";

export const MAX_STOCK = 1000000000;
export const MAX_CANTIDAD_MOVIMIENTO = 1000000;
export const MAX_PRECIO = 99999999.99;

export function esTexto(valor, max) {
	return typeof valor === "string" && valor.trim().length >= 1 && valor.trim().length <= max;
}

export function esTextoOpcional(valor, max) {
	return valor === undefined || valor === null || (typeof valor === "string" && valor.length <= max);
}

export function esEntero(valor, min, max = MAX_INT) {
	return Number.isSafeInteger(valor) && valor >= min && valor <= max;
}

// Se valida sobre la representación decimal para no redondear en silencio (1.005 no es un monto de 2 decimales).
export function esDecimal(valor, max) {
	return (
		typeof valor === "number" &&
		Number.isFinite(valor) &&
		valor >= 0 &&
		valor <= max &&
		/^\d+(\.\d{1,2})?$/.test(String(valor))
	);
}
