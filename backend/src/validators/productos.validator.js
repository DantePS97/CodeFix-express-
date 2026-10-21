import { MAX_PRECIO, MAX_STOCK, esDecimal, esEntero, esTexto, esTextoOpcional } from "../utils/validacion.js";

const NOMBRE_MAX = 150;
const CODIGO_MAX = 50;
const DESCRIPCION_MAX = 1000;

const MENSAJES = {
	nombre: `El nombre del producto es obligatorio y no puede superar los ${NOMBRE_MAX} caracteres.`,
	codigo: `El código del producto es obligatorio y no puede superar los ${CODIGO_MAX} caracteres.`,
	descripcion: `La descripción debe ser texto de hasta ${DESCRIPCION_MAX} caracteres.`,
	precio: `El precio debe ser un número entre 0 y ${MAX_PRECIO} con hasta 2 decimales.`,
	stock: `El stock debe ser un entero entre 0 y ${MAX_STOCK}.`,
	stockMinimo: `El stock mínimo debe ser un entero entre 0 y ${MAX_STOCK}.`,
	categoriaId: "La categoría del producto debe ser un identificador válido.",
	activo: "El campo 'activo' debe ser booleano.",
};

export function validarCrearProducto(body) {
	const errores = [];
	const { nombre, descripcion, codigo, precio, stock, stockMinimo, categoriaId } = body ?? {};

	if (!esTexto(nombre, NOMBRE_MAX)) {
		errores.push(MENSAJES.nombre);
	}
	if (!esTexto(codigo, CODIGO_MAX)) {
		errores.push(MENSAJES.codigo);
	}
	if (!esTextoOpcional(descripcion, DESCRIPCION_MAX)) {
		errores.push(MENSAJES.descripcion);
	}
	if (!esDecimal(precio, MAX_PRECIO)) {
		errores.push(MENSAJES.precio);
	}
	if (stock !== undefined && !esEntero(stock, 0, MAX_STOCK)) {
		errores.push(MENSAJES.stock);
	}
	if (stockMinimo !== undefined && !esEntero(stockMinimo, 0, MAX_STOCK)) {
		errores.push(MENSAJES.stockMinimo);
	}
	if (!esEntero(categoriaId, 1)) {
		errores.push("La categoría del producto es obligatoria.");
	}

	return errores;
}

export function validarActualizarProducto(body) {
	const errores = [];
	const { nombre, descripcion, codigo, precio, stockMinimo, categoriaId, activo } = body ?? {};

	if ([nombre, descripcion, codigo, precio, stockMinimo, categoriaId, activo].every((campo) => campo === undefined)) {
		errores.push("Enviá al menos un campo para actualizar.");
	}
	if (nombre !== undefined && !esTexto(nombre, NOMBRE_MAX)) {
		errores.push(MENSAJES.nombre);
	}
	if (codigo !== undefined && !esTexto(codigo, CODIGO_MAX)) {
		errores.push(MENSAJES.codigo);
	}
	if (!esTextoOpcional(descripcion, DESCRIPCION_MAX)) {
		errores.push(MENSAJES.descripcion);
	}
	if (precio !== undefined && !esDecimal(precio, MAX_PRECIO)) {
		errores.push(MENSAJES.precio);
	}
	if (stockMinimo !== undefined && !esEntero(stockMinimo, 0, MAX_STOCK)) {
		errores.push(MENSAJES.stockMinimo);
	}
	if (categoriaId !== undefined && !esEntero(categoriaId, 1)) {
		errores.push(MENSAJES.categoriaId);
	}
	if (activo !== undefined && typeof activo !== "boolean") {
		errores.push(MENSAJES.activo);
	}

	return errores;
}
