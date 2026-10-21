import { useAuth } from "../../context/AuthContext.jsx";
import { StatCard } from "../../components/Card/Card.jsx";
import AlertasStockWidget from "./AlertasStockWidget.jsx";
import IndicadoresResumen from "./IndicadoresResumen.jsx";

export default function DashboardPage() {
	const { usuario } = useAuth();

	return (
		<>
			<StatCard label="Bienvenido" value={usuario?.nombre} helper={`Rol: ${usuario?.rol}`} />
			{/* GET /api/productos/alertas-stock y /api/dashboard/indicadores son solo ADMIN en el backend (DDS 4.2) */}
			{usuario?.rol === "ADMIN" && (
				<>
					<IndicadoresResumen />
					<AlertasStockWidget />
				</>
			)}
		</>
	);
}
