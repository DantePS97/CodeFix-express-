import { validarCrearFactura } from "../validators/facturas.validator.js";
import { crear as crearFactura, listar as listarFacturas, obtenerPorId } from "../services/facturas.service.js";
import { NotFoundError, ValidationError } from "../utils/errors.js";

export async function crear(req, res, next) {
	try {
		const errores = validarCrearFactura(req.body);
		if (errores.length > 0) {
			throw new ValidationError(errores.join(" "));
		}
		const factura = await crearFactura(req.tenantId, req.user.id, req.body);
		res.status(201).json({ factura });
	} catch (error) {
		next(error);
	}
}

export async function listar(req, res, next) {
	try {
		const facturas = await listarFacturas(req.tenantId);
		res.status(200).json({ facturas });
	} catch (error) {
		next(error);
	}
}

export async function obtener(req, res, next) {
	try {
		const facturaId = Number(req.params.id);
		if (!Number.isInteger(facturaId)) {
			throw new NotFoundError("Factura no encontrada.");
		}
		const factura = await obtenerPorId(req.tenantId, facturaId);
		res.status(200).json({ factura });
	} catch (error) {
		next(error);
	}
}
