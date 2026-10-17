export async function anular(tenantId, facturaId, motivo) {
  // 1. Buscar la factura dentro del negocio correspondiente
  const facturaExistente = await prisma.factura.findFirst({
    where: {
      id: Number(facturaId),
      tenantId,
    },
    include: {
      detalles: true,
    },
  });

  if (!facturaExistente) {
    throw new NotFoundError("La factura no existe.");
  }

  // 2. Validar que la factura se encuentre emitida
  if (facturaExistente.estado !== "EMITIDA") {
    throw new ConflictError(
      "No se puede anular una factura que ya fue anulada.",
      "TRANSICION_INVALIDA"
    );
  }

  // 3. Anular y devolver el inventario en una sola transacción
  return await prisma.$transaction(async (tx) => {
    // Comprobar nuevamente el estado para evitar una doble anulación
    const factura = await tx.factura.findFirst({
      where: {
        id: facturaExistente.id,
        tenantId,
      },
      include: {
        detalles: true,
      },
    });

    if (!factura) {
      throw new NotFoundError("La factura no existe.");
    }

    if (factura.estado !== "EMITIDA") {
      throw new ConflictError(
        "No se puede anular una factura que ya fue anulada.",
        "TRANSICION_INVALIDA"
      );
    }

    // Cambiar el estado y guardar el motivo
    const facturaAnulada = await tx.factura.update({
      where: {
        id: factura.id,
      },
      data: {
        estado: "ANULADA",
        motivoAnulacion: motivo?.trim() || null,
      },
    });

    // Devolver al inventario los productos facturados
    for (const detalle of factura.detalles) {
      const producto = await tx.producto.findFirst({
        where: {
          id: detalle.productoId,
          tenantId,
        },
      });

      if (!producto) {
        throw new NotFoundError(
          `No se encontró el producto con ID ${detalle.productoId}.`
        );
      }

      const cantidadDevuelta = detalle.cantidad;
      const stockAnterior = producto.stockActual;
      const stockPosterior = stockAnterior + cantidadDevuelta;

      // Incrementar las existencias
      await tx.producto.update({
        where: {
          id: producto.id,
        },
        data: {
          stockActual: {
            increment: cantidadDevuelta,
          },
        },
      });

      // Registrar el movimiento de entrada
      await tx.movimientoInventario.create({
        data: {
          tenantId,
          productoId: producto.id,
          tipo: "ENTRADA",
          cantidad: cantidadDevuelta,
          stockAnterior,
          stockPosterior,
          referenciaFacturaId: factura.id,
          usuarioId: factura.usuarioId,
          fecha: new Date(),
        },
      });
    }

    return facturaAnulada;
  });
}