import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import LoginPage from "../pages/auth/LoginPage.jsx";
import RegisterBusinessPage from "../pages/auth/RegisterBusinessPage.jsx";
import DashboardPage from "../pages/dashboard/DashboardPage.jsx";
import UsersPage from "../pages/usuarios/UsersPage.jsx";
import ProductsPage from "../pages/productos/ProductsPage.jsx";
import InventoryPage from "../pages/inventario/InventoryPage.jsx";
import ClientsPage from "../pages/clientes/ClientsPage.jsx";
import NewInvoicesPage from "../pages/facturas/NewInvoicesPage.jsx";
import InvoicesPage from "../pages/facturas/InvoicesPage.jsx";

function RutaPorDefecto() {
	const { estaAutenticado } = useAuth();
	return <Navigate to={estaAutenticado ? "/dashboard" : "/login"} replace />;
}

export default function AppRoutes() {
	return (
		<Routes>
			<Route path="/login" element={<LoginPage />} />
			<Route path="/registro-negocio" element={<RegisterBusinessPage />} />

			{/* Autenticadas: cualquier rol */}
			<Route element={<ProtectedRoute />}>
				<Route element={<DashboardLayout />}>
					<Route path="/dashboard" element={<DashboardPage />} />
					<Route path="/productos" element={<ProductsPage />} />
				</Route>
			</Route>

			{/* Autenticadas: ADMIN y VENDEDOR */}
			<Route element={<ProtectedRoute rolesPermitidos={["ADMIN", "VENDEDOR"]} />}>
				<Route element={<DashboardLayout />}>
					<Route path="/inventario" element={<InventoryPage />} />
					<Route path="/clientes" element={<ClientsPage />} />
					<Route path="/facturas/nueva" element={<NewInvoicesPage />} />
				</Route>
			</Route>

			{/* Autenticadas: ADMIN, VENDEDOR y CONTADOR */}
			<Route element={<ProtectedRoute rolesPermitidos={["ADMIN", "VENDEDOR", "CONTADOR"]} />}>
				<Route element={<DashboardLayout />}>
					<Route path="/facturas" element={<InvoicesPage />} />
				</Route>
			</Route>

			{/* Autenticadas: solo ADMIN */}
			<Route element={<ProtectedRoute rolesPermitidos={["ADMIN"]} />}>
				<Route element={<DashboardLayout />}>
					<Route path="/usuarios" element={<UsersPage />} />
				</Route>
			</Route>

			<Route path="*" element={<RutaPorDefecto />} />
		</Routes>
	);
}
