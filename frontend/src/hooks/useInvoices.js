import { useCallback, useEffect, useState } from "react";
import { listarFacturas, crearFactura as crearFacturaService } from "../services/invoices.service.js";

export const useInvoices = () => {
	const [facturas, setFacturas] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const cargarFacturas = useCallback(async (filtros = {}) => {
		try {
			setLoading(true);
			setError(null);

			const data = await listarFacturas(filtros);
			setFacturas(data);
		} catch (err) {
			setError(err);
		} finally {
			setLoading(false);
		}
	}, []);

	const crearFactura = async (datos) => {
		const factura = await crearFacturaService(datos);
		await cargarFacturas();
		return factura;
	};

	useEffect(() => {
		cargarFacturas();
	}, [cargarFacturas]);

	return {
		facturas,
		loading,
		error,
		cargarFacturas,
		crearFactura,
	};
};
