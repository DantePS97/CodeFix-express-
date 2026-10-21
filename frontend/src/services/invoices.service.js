import api from "../api/api.js";

export async function listarFacturas(filtros = {}) {
	const params = Object.fromEntries(
		Object.entries(filtros).filter(([, valor]) => valor !== "" && valor !== null && valor !== undefined),
	);
	const { data } = await api.get("/facturas", { params });
	return data.facturas;
}

export async function obtenerFactura(id) {
	const { data } = await api.get(`/facturas/${id}`);
	return data.factura;
}

export async function crearFactura(datos) {
	const { data } = await api.post("/facturas", datos);
	return data.factura;
}

export async function anularFactura(id, motivo) {
	const { data } = await api.post(`/facturas/${id}/anular`, { motivo });
	return data.factura;
}
