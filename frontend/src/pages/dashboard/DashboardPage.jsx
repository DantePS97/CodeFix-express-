import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import Card from "../../components/Card/Card.jsx";
import Icon from "../../components/Icon/Icon.jsx";
import { menuParaRol } from "../../layouts/navigation.js";
import AlertasStockWidget from "./AlertasStockWidget.jsx";
import IndicadoresResumen from "./IndicadoresResumen.jsx";
import "./DashboardPage.css";

const SUBTITULO_POR_ROL = {
	ADMIN: "Aquí tienes un resumen general del negocio.",
	VENDEDOR: "¡Listo para vender hoy!",
	CONTADOR: "Aquí tienes un resumen financiero del negocio.",
};

export default function DashboardPage() {
	const { usuario } = useAuth();

	// Accesos directos: los mismos módulos del menú del rol, sin "Inicio".
	const accesos = menuParaRol(usuario?.rol).filter((item) => item.to !== "/dashboard");

	return (
		<div className="dashboard-page">
			<header className="dashboard-heading">
				<h1>Hola, {usuario?.nombre}</h1>
				<p>{SUBTITULO_POR_ROL[usuario?.rol] ?? ""}</p>
			</header>

			{/* GET /api/productos/alertas-stock y /api/dashboard/indicadores son solo ADMIN en el backend (DDS 4.2) */}
			{usuario?.rol === "ADMIN" && (
				<>
					<IndicadoresResumen />
					<AlertasStockWidget />
				</>
			)}

			<Card>
				<h2 className="dashboard-section-title">Accesos rápidos</h2>
				<ul className="dashboard-shortcuts">
					{accesos.map((item) => (
						<li key={item.to}>
							<Link to={item.to} className="dashboard-shortcut">
								<span className="dashboard-shortcut-icon">
									<Icon name={item.icon} size={22} />
								</span>
								<span>{item.label}</span>
							</Link>
						</li>
					))}
				</ul>
			</Card>
		</div>
	);
}
