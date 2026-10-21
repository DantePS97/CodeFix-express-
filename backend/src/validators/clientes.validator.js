function validarCamposOpcionales({ identificacion, contacto }, errores) {
	if (identificacion !== undefined && identificacion !== null && typeof identificacion !== "string") {
		errores.push("La identificación debe ser texto.");
	} else if (typeof identificacion === "string" && identificacion.length > 30) {
		errores.push("La identificación no puede superar los 30 caracteres.");
	}
	if (contacto !== undefined && contacto !== null && typeof contacto !== "string") {
		errores.push("El contacto debe ser texto.");
	} else if (typeof contacto === "string" && contacto.length > 120) {
		errores.push("El contacto no puede superar los 120 caracteres.");
	}
}

export function validarCrearCliente(body) {
	const errores = [];
	const { nombre } = body ?? {};

	if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
		errores.push("El nombre del cliente es obligatorio.");
	} else if (nombre.trim().length > 150) {
		errores.push("El nombre del cliente no puede superar los 150 caracteres.");
	}
	validarCamposOpcionales(body ?? {}, errores);

	return errores;
}

export function validarActualizarCliente(body) {
	const errores = [];
	const { nombre, identificacion, contacto, activo } = body ?? {};

	if (nombre === undefined && identificacion === undefined && contacto === undefined && activo === undefined) {
		errores.push("Debes enviar al menos un campo para actualizar.");
	}
	if (nombre !== undefined) {
		if (typeof nombre !== "string" || !nombre.trim()) {
			errores.push("El nombre del cliente no puede estar vacío.");
		} else if (nombre.trim().length > 150) {
			errores.push("El nombre del cliente no puede superar los 150 caracteres.");
		}
	}
	if (activo !== undefined && typeof activo !== "boolean") {
		errores.push("El campo 'activo' debe ser booleano.");
	}
	validarCamposOpcionales(body ?? {}, errores);

	return errores;
}
