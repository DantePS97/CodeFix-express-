export async function anular(req, res, next) {
  try {
    const { motivo } = req.body;

    // Validar que el motivo sea obligatorio
    if (typeof motivo !== "string" || motivo.trim().length === 0) {
      return res.status(400).json({
        message: "El motivo de anulación es obligatorio.",
      });
    }

    const tenantId = req.user.tenantId;
    const facturaId = req.params.id;

    const factura = await facturasService.anular(
      tenantId,
      facturaId,
      motivo.trim()
    );

    return res.status(200).json({
      message: "Factura anulada correctamente.",
      data: factura,
    });
  } catch (error) {
    next(error);
  }
}
export async function listar(req, res, next) {
  try {
    const tenantId = req.user.tenantId;

    const filtros = {
      clienteId: req.query.clienteId,
      estado: req.query.estado,
      desde: req.query.desde,
      hasta: req.query.hasta,
    };

    const facturas = await facturasService.listar(tenantId, filtros);

    return res.status(200).json({
      data: facturas,
    });
  } catch (error) {
    next(error);
  }
}