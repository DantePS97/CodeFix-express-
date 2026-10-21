// Pesos colombianos (es-CO): "$ 2.936.920". Los montos enteros se muestran sin
// decimales; si el monto trae centavos se muestran los dos ("$ 12,50"), para
// que lo que ve el usuario nunca oculte un valor que el backend sí guarda.
const FORMATO_ENTERO = new Intl.NumberFormat("es-CO", {
	style: "currency",
	currency: "COP",
	minimumFractionDigits: 0,
	maximumFractionDigits: 0,
});
const FORMATO_CON_CENTAVOS = new Intl.NumberFormat("es-CO", {
	style: "currency",
	currency: "COP",
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
});

export function formatearDinero(valor) {
	const numero = Number(valor);
	const tieneCentavos = Math.round(numero * 100) % 100 !== 0;
	return (tieneCentavos ? FORMATO_CON_CENTAVOS : FORMATO_ENTERO).format(numero);
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
