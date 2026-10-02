import { useCallback, useEffect, useState } from "react";
import {
  listarFacturas,
  crearFactura,
} from "../services/invoices.service";

export default function useInvoices(filtrosIniciales = {}) {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargarFacturas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await listarFacturas(filtrosIniciales);

      setFacturas(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Error al cargar facturas"
      );
    } finally {
      setLoading(false);
    }
  }, [filtrosIniciales]);

  const crear = async (datos) => {
    try {
      setError(null);

      const facturaCreada = await crearFactura(datos);

      await cargarFacturas();

      return facturaCreada;
    } catch (err) {
      const mensaje =
        err.response?.data?.message ||
        "Error al crear factura";

      setError(mensaje);
      throw err;
    }
  };

  useEffect(() => {
    cargarFacturas();
  }, [cargarFacturas]);

  return {
    facturas,
    loading,
    error,
    crear,
    recargar: cargarFacturas,
  };
}