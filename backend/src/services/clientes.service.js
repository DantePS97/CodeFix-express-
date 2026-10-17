export async function listar(tenantId, filtros = {}) {
  const where = {
    tenantId,
  };

  if (filtros.nombre?.trim()) {
    where.nombre = {
      contains: filtros.nombre.trim(),
    };
  }

  if (filtros.identificacion?.trim()) {
    where.identificacion = {
      contains: filtros.identificacion.trim(),
    };
  }

  return prisma.cliente.findMany({
    where,
    orderBy: {
      nombre: "asc",
    },
  });
}