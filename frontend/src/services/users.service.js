import api from "../api/api.js";

export async function listarUsuarios() {
	const { data } = await api.get("/usuarios");
	return data.usuarios;
}

export async function crearUsuario(datos) {
	const { data } = await api.post("/usuarios", datos);
	return data.usuario;
}

// Solo PATCH: el backend acepta `rol` y/o `activo`, nunca reemplaza el recurso completo.
export async function actualizarUsuario(id, cambios) {
	const { data } = await api.patch(`/usuarios/${id}`, cambios);
	return data.usuario;
}
