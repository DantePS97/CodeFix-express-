import { useCallback, useEffect, useRef, useState } from "react";
import { listarUsuarios, crearUsuario, actualizarUsuario } from "../services/users.service.js";

// Estado local por página, sin store global (DDS 6.2): cada mutación
// refresca la lista consultando de nuevo al backend. Las mutaciones lanzan el
// error original para que el formulario muestre el `mensaje` del backend.
export function useUsers() {
	const [usuarios, setUsuarios] = useState([]);
	const [cargando, setCargando] = useState(true);
	const [error, setError] = useState("");
	const ultimaPeticion = useRef(0);

	const refrescar = useCallback(async () => {
		const peticion = ++ultimaPeticion.current;
		setCargando(true);
		setError("");
		try {
			const lista = await listarUsuarios();
			// Una carga más nueva ya está en vuelo: esta respuesta quedó vieja.
			if (peticion !== ultimaPeticion.current) return;
			setUsuarios(lista);
		} catch (err) {
			if (peticion !== ultimaPeticion.current) return;
			setError(err.response?.data?.error?.mensaje ?? "No se pudieron cargar los usuarios.");
		} finally {
			if (peticion === ultimaPeticion.current) setCargando(false);
		}
	}, []);

	useEffect(() => {
		refrescar();
	}, [refrescar]);

	async function crear(datos) {
		await crearUsuario(datos);
		await refrescar();
	}

	async function actualizar(id, cambios) {
		await actualizarUsuario(id, cambios);
		await refrescar();
	}

	return { usuarios, cargando, error, refrescar, crear, actualizar };
}
