export function formatearDinero(valor) {
	return `$${Number(valor).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatearCentavos(centavos) {
	return formatearDinero(centavos / 100);
}

// Los decimales del backend llegan como string ("12.5"): se parsean sin pasar por float.
export function aCentavos(valor) {
	const [entero, decimal = ""] = String(valor).split(".");
	return Number(entero) * 100 + Number(decimal.padEnd(2, "0").slice(0, 2));
}

// La tarifa llega como string en porcentaje ("8.25" -> 825 puntos base), con la misma escala que aCentavos.
export function aPuntosBase(tarifa) {
	return aCentavos(tarifa);
}

// Redondeo half-up a 2 decimales, igual que el backend.
export function calcularImpuestoCentavos(subtotalCentavos, puntosBase) {
	return Math.floor((subtotalCentavos * puntosBase + 5000) / 10000);
}
