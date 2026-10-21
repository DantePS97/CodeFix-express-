import { useCallback, useEffect, useRef, useState } from "react";
import {
  listarClientes,
  crearCliente,
  actualizarCliente,
} from "../services/clients.service";

export const useClients = ({ nombre = "" } = {}) => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const ultimaPeticion = useRef(0);

  const cargarClientes = useCallback(
    async (filtros = nombre ? { nombre } : {}) => {
      const peticion = ++ultimaPeticion.current;
      try {
        setLoading(true);
        setError(null);

        const data = await listarClientes(filtros);
        // Una búsqueda más nueva ya está en vuelo: esta respuesta quedó vieja.
        if (peticion !== ultimaPeticion.current) return;
        setClientes(data);
      } catch (err) {
        if (peticion !== ultimaPeticion.current) return;
        setError(err);
      } finally {
        if (peticion === ultimaPeticion.current) setLoading(false);
      }
    },
    [nombre],
  );

  const crear = async (datos) => {
    await crearCliente(datos);
    await cargarClientes();
  };

  const actualizar = async (id, cambios) => {
    await actualizarCliente(id, cambios);
    await cargarClientes();
  };

  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  return {
    clientes,
    loading,
    error,
    cargarClientes,
    crear,
    actualizar,
  };
};