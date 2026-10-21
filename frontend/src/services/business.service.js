import api from "../api/api.js";

export async function obtenerNegocioActual() {
	const { data } = await api.get("/negocios/actual");
	return data.negocio;
}
