import { useCallback, useEffect, useRef, useState } from "react";
import {
	listarProductos,
	crearProducto,
	actualizarProducto,
	listarCategorias,
	crearCategoria,
} from "../services/products.service.js";

// Estado local por página, sin store global (DDS 6.2): cada mutación
// refresca la lista consultando de nuevo al backend.
export function useProducts({ nombre = "" } = {}) {
	const [productos, setProductos] = useState([]);
	const [categorias, setCategorias] = useState([]);
	const [cargando, setCargando] = useState(true);
	const [error, setError] = useState("");
	const ultimaPeticion = useRef(0);

	const refrescar = useCallback(async () => {
		const peticion = ++ultimaPeticion.current;
		setCargando(true);
		setError("");
		try {
			const [listaProductos, listaCategorias] = await Promise.all([
				listarProductos(nombre ? { nombre } : {}),
				listarCategorias(),
			]);
			// Una búsqueda más nueva ya está en vuelo: esta respuesta quedó vieja.
			if (peticion !== ultimaPeticion.current) return;
			setProductos(listaProductos);
			setCategorias(listaCategorias);
		} catch (err) {
			if (peticion !== ultimaPeticion.current) return;
			setError(err.response?.data?.error?.mensaje ?? "No se pudieron cargar los productos.");
		} finally {
			if (peticion === ultimaPeticion.current) setCargando(false);
		}
	}, [nombre]);

	useEffect(() => {
		refrescar();
	}, [refrescar]);

	async function crear(datos) {
		await crearProducto(datos);
		await refrescar();
	}

	async function actualizar(id, cambios) {
		await actualizarProducto(id, cambios);
		await refrescar();
	}

	async function crearNuevaCategoria(datos) {
		await crearCategoria(datos);
		await refrescar();
	}

	return { productos, categorias, cargando, error, crear, actualizar, crearNuevaCategoria };
}
