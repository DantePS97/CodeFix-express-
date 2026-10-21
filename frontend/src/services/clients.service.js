import api from "../api/api.js";

export async function listarClientes(filtros = {}) {
	const { data } = await api.get("/clientes", { params: filtros });
	return data.clientes;
}

export async function crearCliente(datos) {
	const { data } = await api.post("/clientes", datos);
	return data.cliente;
}

export async function actualizarCliente(id, cambios) {
	const { data } = await api.patch(`/clientes/${id}`, cambios);
	return data.cliente;
}
