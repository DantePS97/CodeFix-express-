// Etiquetas legibles de los roles del sistema (el backend usa los códigos).
export const ETIQUETA_ROL = {
	ADMIN: "Administrador",
	VENDEDOR: "Vendedor",
	CONTADOR: "Contador",
};

export function etiquetaRol(rol) {
	return ETIQUETA_ROL[rol] ?? rol ?? "";
}

// "Ana María López" -> "AM"; "admin" -> "A".
export function iniciales(nombre) {
	const partes = String(nombre ?? "")
		.trim()
		.split(/\s+/)
		.filter(Boolean);
	if (partes.length === 0) return "?";
	return partes
		.slice(0, 2)
		.map((parte) => parte[0].toUpperCase())
		.join("");
}
