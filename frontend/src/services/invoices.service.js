import api from "../api/api.js";

export async function listarFacturas(filtros = {}) {
	const { data } = await api.get("/facturas", { params: filtros });
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
