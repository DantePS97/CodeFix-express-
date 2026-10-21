import api from "../api/api.js";

export async function obtenerIndicadores() {
	const { data } = await api.get("/dashboard/indicadores");
	return data;
}
