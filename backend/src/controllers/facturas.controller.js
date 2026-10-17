
import * as facturasService from "../services/facturas.service.js";
import { validarCrearFactura } from "../validators/facturas.validator.js";

export async function crear(req, res, next) {
  try {
    const tenantId = req.user.tenantId;
    const usuarioId = req.user.id;

    const resultado = validarCrearFactura(req.body);

    if (!resultado.valido) {
      return res.status(400).json({
        message: "Datos de la factura inválidos.",
        errores: resultado.errores,
      });
    }

    const factura = await facturasService.crear(
      tenantId,
      usuarioId,
      resultado.datos
    );

    return res.status(201).json({
      message: "Factura creada correctamente.",
      data: factura,
    });
  } catch (error) {
    next(error);
  }
}

export async function listar(req, res, next) {
  try {
    const tenantId = req.user.tenantId;

    const filtros = {};

    if (req.query.estado) {
      filtros.estado = req.query.estado;
    }

    if (req.query.clienteId !== undefined) {
      filtros.clienteId = req.query.clienteId;
    }

    const facturas = await facturasService.listar(
      tenantId,
      filtros
    );

    return res.status(200).json({
      data: facturas,
    });
  } catch (error) {
    next(error);
  }
}

export async function obtener(req, res, next) {
  try {
    const tenantId = req.user.tenantId;
    const facturaId = req.params.id;

    const factura = await facturasService.obtenerPorId(
      tenantId,
      facturaId
    );

    return res.status(200).json({
      data: factura,
    });
  } catch (error) {
    next(error);
  }
}
