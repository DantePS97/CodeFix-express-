import { useEffect, useState } from "react";
import { listarAlertasStock } from "../../services/inventory.service.js";
import Card from "../../components/Card/Card.jsx";
import Badge from "../../components/Badge/Badge.jsx";
import "./AlertasStockWidget.css";

export default function AlertasStockWidget() {
	const [productos, setProductos] = useState([]);
	const [cargando, setCargando] = useState(true);

	useEffect(() => {
		listarAlertasStock()
			.then(setProductos)
			.finally(() => setCargando(false));
	}, []);

	if (cargando) return null;

	return (
		<Card>
			<h2 className="stock-alerts-title">Alertas de stock</h2>
			{productos.length === 0 ? (
				<p className="text-muted">No hay productos con stock bajo.</p>
			) : (
				<ul className="stock-alerts-list">
					{productos.map((p) => (
						<li key={p.id} className="stock-alerts-item">
							<span className="stock-alerts-name">{p.nombre}</span>
							<span className="stock-alerts-stock">Stock {p.stock}</span>
							<Badge variant="warning">Bajo mínimo ({p.stockMinimo})</Badge>
						</li>
					))}
				</ul>
			)}
		</Card>
	);
}
