export async function listar(req, res, next) {
  try {
    const tenantId = req.user.tenantId;

    const filtros = {
      nombre: req.query.nombre,
      categoriaId: req.query.categoriaId,
    };

    const productos = await productosService.listar(tenantId, filtros);

    return res.status(200).json({
      data: productos,
    });
  } catch (error) {
    next(error);
  }
}