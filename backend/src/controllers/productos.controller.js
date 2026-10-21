import { validarCrearProducto, validarActualizarProducto } from "../validators/productos.validator.js";
import { listar as listarProductos, crear as crearProducto, actualizar as actualizarProducto, listarAlertasStock } from "../services/productos.service.js";
import { ValidationError } from "../utils/errors.js";
import { leerBooleano, leerEnteroPositivo, leerTexto } from "../utils/query.js";

export async function listar(req, res, next) {
	try {
		const nombre = leerTexto(req.query.nombre, "nombre");
		const categoriaId = leerEnteroPositivo(req.query.categoriaId, "categoriaId");
		const incluirInactivos = leerBooleano(req.query.incluirInactivos, "incluirInactivos");
		const productos = await listarProductos(req.tenantId, { nombre, categoriaId, incluirInactivos });
		res.status(200).json({ productos });
	} catch (error) {
		next(error);
	}
}

export async function crear(req, res, next) {
	try {
		const errores = validarCrearProducto(req.body);
		if (errores.length > 0) {
			throw new ValidationError(errores.join(" "));
		}
		const producto = await crearProducto(req.tenantId, req.body);
		res.status(201).json({ producto });
	} catch (error) {
		next(error);
	}
}

export async function actualizar(req, res, next) {
	try {
		const errores = validarActualizarProducto(req.body);
		if (errores.length > 0) {
			throw new ValidationError(errores.join(" "));
		}
		const productoId = Number(req.params.id);
		const producto = await actualizarProducto(req.tenantId, productoId, req.body);
		res.status(200).json({ producto });
	} catch (error) {
		next(error);
	}
}

// Usado por la ruta GET /api/productos/alertas-stock (tarjeta [Sprint 2 - 05], RF-008).
export async function alertasStock(req, res, next) {
	try {
		const productos = await listarAlertasStock(req.tenantId);
		res.status(200).json({ productos });
	} catch (error) {
		next(error);
	}
}
