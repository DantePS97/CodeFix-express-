export async function listar(tenantId, filtros = {}) {
  const where = {
    tenantId,
  };

  if (filtros.nombre?.trim()) {
    where.nombre = {
      contains: filtros.nombre.trim(),
    };
  }

  if (filtros.categoriaId !== undefined && filtros.categoriaId !== "") {
    const categoriaId = Number(filtros.categoriaId);

    if (!Number.isInteger(categoriaId) || categoriaId <= 0) {
      throw new Error("El categoriaId debe ser un entero positivo.");
    }

    where.categoriaId = categoriaId;
  }

  return prisma.producto.findMany({
    where,
    include: {
      categoria: true,
    },
    orderBy: {
      nombre: "asc",
    },
  });
}