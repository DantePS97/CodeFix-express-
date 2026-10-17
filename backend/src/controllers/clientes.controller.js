export async function listar(req, res, next) {
  try {
    const tenantId = req.usuario.tenantId;

    const filtros = {
      nombre: req.query.nombre,
      identificacion: req.query.identificacion,
    };

    const clientes = await clientesService.listar(tenantId, filtros);

    return res.status(200).json({
      data: clientes,
    });
  } catch (error) {
    next(error);
  }
}