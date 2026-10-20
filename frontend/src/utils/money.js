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

// Redondeo half-up a 2 decimales, igual que el backend (tarifa en porcentaje, ej. 19 o 19.5).
export function calcularImpuestoCentavos(subtotalCentavos, tarifa) {
	const centesimas = Math.round(tarifa * 100);
	return Math.floor((subtotalCentavos * centesimas + 5000) / 10000);
}
