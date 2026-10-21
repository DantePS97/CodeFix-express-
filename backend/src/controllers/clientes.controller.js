import { validarCrearCliente, validarActualizarCliente } from "../validators/clientes.validator.js";
import { listar as listarClientes, crear as crearCliente, actualizar as actualizarCliente } from "../services/clientes.service.js";
import { ValidationError } from "../utils/errors.js";
import { leerIdRuta, leerTexto } from "../utils/query.js";

export async function listar(req, res, next) {
	try {
		const nombre = leerTexto(req.query.nombre, "nombre");
		const clientes = await listarClientes(req.tenantId, { nombre });
		res.status(200).json({ clientes });
	} catch (error) {
		next(error);
	}
}

export async function crear(req, res, next) {
	try {
		const errores = validarCrearCliente(req.body);
		if (errores.length > 0) {
			throw new ValidationError(errores.join(" "));
		}
		const cliente = await crearCliente(req.tenantId, req.body);
		res.status(201).json({ cliente });
	} catch (error) {
		next(error);
	}
}

export async function actualizar(req, res, next) {
	try {
		const errores = validarActualizarCliente(req.body);
		if (errores.length > 0) {
			throw new ValidationError(errores.join(" "));
		}
		const clienteId = leerIdRuta(req.params.id, "Cliente no encontrado.");
		const cliente = await actualizarCliente(req.tenantId, clienteId, req.body);
		res.status(200).json({ cliente });
	} catch (error) {
		next(error);
	}
}
