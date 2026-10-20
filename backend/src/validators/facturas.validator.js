export function validarCrearFactura(body) {
	const errores = [];
	const { clienteId, lineas } = body ?? {};

	if (!Number.isInteger(clienteId) || clienteId <= 0) {
		errores.push("El cliente es obligatorio.");
	}

	if (!Array.isArray(lineas) || lineas.length === 0) {
		errores.push("La factura debe tener al menos una línea.");
		return errores;
	}

	const productosVistos = new Set();
	lineas.forEach((linea, i) => {
		const numeroLinea = i + 1;
		const { productoId, cantidad } = linea ?? {};

		if (!Number.isInteger(productoId) || productoId <= 0) {
			errores.push(`Línea ${numeroLinea}: el producto es obligatorio.`);
		} else if (productosVistos.has(productoId)) {
			errores.push(`Línea ${numeroLinea}: el producto ${productoId} está repetido; agrupá la cantidad en una sola línea.`);
		} else {
			productosVistos.add(productoId);
		}

		if (!Number.isInteger(cantidad) || cantidad <= 0) {
			errores.push(`Línea ${numeroLinea}: la cantidad debe ser un entero mayor a 0.`);
		}
	});

	return errores;
}
