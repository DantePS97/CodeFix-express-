import { resumenVentas } from "../services/facturas.service.js";
import { listarAlertasStock } from "../services/productos.service.js";

function formatearFecha(fecha) {
	const mes = String(fecha.getMonth() + 1).padStart(2, "0");
	const dia = String(fecha.getDate()).padStart(2, "0");
	return `${fecha.getFullYear()}-${mes}-${dia}`;
}

// Período = mes calendario en curso, en la hora local del servidor.
export async function indicadores(req, res, next) {
	try {
		const ahora = new Date();
		const desde = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
		const hastaExclusivo = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1);
		const ultimoDia = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);

		const [{ ventasPeriodo, facturasEmitidas }, productosEnAlerta] = await Promise.all([
			resumenVentas(req.tenantId, desde, hastaExclusivo),
			listarAlertasStock(req.tenantId),
		]);

		res.status(200).json({
			ventasPeriodo,
			facturasEmitidas,
			alertasStock: productosEnAlerta.length,
			periodo: { desde: formatearFecha(desde), hasta: formatearFecha(ultimoDia) },
		});
	} catch (error) {
		next(error);
	}
}
