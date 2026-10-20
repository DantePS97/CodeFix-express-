import { ValidationError } from "../utils/errors.js";
import { leerEnteroPositivo, leerFecha, leerTexto } from "../utils/query.js";

const ESTADOS = ["EMITIDA", "ANULADA"];
const MOTIVO_MAX = 255;

export function validarAnularFactura(body) {
	const { motivo } = body ?? {};

	if (typeof motivo !== "string" || motivo.trim() === "") {
		return ["El motivo de anulación es obligatorio."];
	}
	if (motivo.trim().length > MOTIVO_MAX) {
		return [`El motivo no puede superar los ${MOTIVO_MAX} caracteres.`];
	}
	return [];
}

// hastaExclusivo = medianoche del día siguiente a `hasta`, así el día completo queda incluido.
export function leerFiltrosFacturas({ clienteId, estado, desde, hasta }) {
	const filtros = {
		clienteId: leerEnteroPositivo(clienteId, "clienteId"),
		estado: leerTexto(estado, "estado"),
		desde: leerFecha(desde, "desde"),
		hasta: leerFecha(hasta, "hasta"),
	};

	if (filtros.estado !== undefined && !ESTADOS.includes(filtros.estado)) {
		throw new ValidationError(`El estado debe ser uno de: ${ESTADOS.join(", ")}.`);
	}
	if (filtros.desde && filtros.hasta && filtros.desde > filtros.hasta) {
		throw new ValidationError('El parámetro "desde" no puede ser posterior a "hasta".');
	}

	const hastaExclusivo = filtros.hasta
		? new Date(filtros.hasta.getFullYear(), filtros.hasta.getMonth(), filtros.hasta.getDate() + 1)
		: undefined;

	return { clienteId: filtros.clienteId, estado: filtros.estado, desde: filtros.desde, hastaExclusivo };
}

export function validarCrearFactura(body) {
	const errores = [];
	const { clienteId, lineas } = body ?? {};

	if (!Number.isInteger(clienteId) || clienteId <= 0) {
		errores.push("El cliente es obligatorio.");
	}

	if (!Array.isArray(lineas) || lineas.length === 0) {
		errores.push("La factura debe tener al menos una línea.");
		return errores;
	}

	const productosVistos = new Set();
	lineas.forEach((linea, i) => {
		const numeroLinea = i + 1;
		const { productoId, cantidad } = linea ?? {};

		if (!Number.isInteger(productoId) || productoId <= 0) {
			errores.push(`Línea ${numeroLinea}: el producto es obligatorio.`);
		} else if (productosVistos.has(productoId)) {
			errores.push(`Línea ${numeroLinea}: el producto ${productoId} está repetido; agrupá la cantidad en una sola línea.`);
		} else {
			productosVistos.add(productoId);
		}

		if (!Number.isInteger(cantidad) || cantidad <= 0) {
			errores.push(`Línea ${numeroLinea}: la cantidad debe ser un entero mayor a 0.`);
		}
	});

	return errores;
}
