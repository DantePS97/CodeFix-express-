const cargarProductos = useCallback(
  async (filtros = {}) => {
    try {
      setLoading(true);

      const data =
        await listarProductos(filtros);

      setProductos(data);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  },
  []
);


return {
  productos,
  loading,
  error,
  recargar: cargarProductos,
};