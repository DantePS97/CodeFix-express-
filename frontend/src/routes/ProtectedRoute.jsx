import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Esta protección es solo de experiencia de usuario: el control de acceso
// real ocurre siempre en el backend (RF-020, DDS 6.1).
export default function ProtectedRoute({ rolesPermitidos }) {
	const { usuario, estaAutenticado, cierreVoluntario } = useAuth();
	const location = useLocation();

	if (!estaAutenticado) {
		// Se recuerda la ruta pedida para volver a ella tras el login, salvo que la
		// persona haya cerrado sesión a propósito: quien entre después no debe caer
		// en la última pantalla de la sesión anterior.
		return <Navigate to="/login" replace state={cierreVoluntario ? null : { from: location }} />;
	}

	if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
		return <Navigate to="/dashboard" replace />;
	}

	return <Outlet />;
}
