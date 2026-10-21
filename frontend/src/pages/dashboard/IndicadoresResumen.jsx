import { useEffect, useState } from "react";
import { obtenerIndicadores } from "../../services/dashboard.service.js";
import { StatCard } from "../../components/Card/Card.jsx";
import { formatearDinero } from "../../utils/money.js";
import "./IndicadoresResumen.css";

function formatearFecha(fecha) {
	const [anio, mes, dia] = fecha.split("-");
	return `${dia}/${mes}/${anio}`;
}

export default function IndicadoresResumen() {
	const [indicadores, setIndicadores] = useState(null);
	const [error, setError] = useState("");

	useEffect(() => {
		obtenerIndicadores()
			.then(setIndicadores)
			.catch((err) => setError(err.response?.data?.error?.mensaje ?? "No se pudieron cargar los indicadores."));
	}, []);

	if (error) return <p className="form-error">{error}</p>;
	if (!indicadores) return null;

	const periodo = `Del ${formatearFecha(indicadores.periodo.desde)} al ${formatearFecha(indicadores.periodo.hasta)}`;

	return (
		<div className="indicadores-resumen">
			<StatCard label="Ventas del período" value={formatearDinero(indicadores.ventasPeriodo)} helper={periodo} />
			<StatCard label="Facturas emitidas" value={String(indicadores.facturasEmitidas)} helper={periodo} />
			<StatCard label="Alertas de stock" value={String(indicadores.alertasStock)} helper="Productos bajo el mínimo" />
		</div>
	);
}
