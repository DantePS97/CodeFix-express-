import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/Button/Button.jsx";
import Input from "../../components/Input/Input.jsx";
import Logo from "../../components/Logo/Logo.jsx";
import { login } from "../../services/auth.service.js";
import { useAuth } from "../../context/AuthContext.jsx";
import "./Auth.css";

// ProtectedRoute guarda en `location.state.from` la ruta que se pidió antes de
// mandar al login. Solo se acepta una ruta interna que no sea del flujo público.
function destinoPostLogin(from) {
	const ruta = from?.pathname;
	if (typeof ruta !== "string" || !ruta.startsWith("/") || ruta === "/login" || ruta === "/registro-negocio") {
		return "/dashboard";
	}
	return `${ruta}${from.search ?? ""}${from.hash ?? ""}`;
}

export default function LoginPage() {
	const { estaAutenticado, login: iniciarSesionEnContexto } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const destino = destinoPostLogin(location.state?.from);
	const [correo, setCorreo] = useState("");
	const [contrasena, setContrasena] = useState("");
	const [error, setError] = useState("");
	const [cargando, setCargando] = useState(false);

	async function manejarEnvio(evento) {
		evento.preventDefault();
		setError("");

		if (!correo.trim() || !contrasena.trim()) {
			setError("Completa correo y contraseña.");
			return;
		}

		setCargando(true);
		try {
			const data = await login({ correo, contrasena });
			iniciarSesionEnContexto(data);
			navigate(destino, { replace: true });
		} catch (err) {
			const mensaje =
				err.response?.data?.error?.mensaje ?? "No se pudo iniciar sesión.";
			setError(mensaje);
		} finally {
			setCargando(false);
		}
	}

	if (estaAutenticado) {
		return <Navigate to={destino} replace />;
	}

	return (
		<div className="auth-page">
			<form className="auth-form" onSubmit={manejarEnvio}>
				<div className="auth-brand">
					<Logo variant="light" layout="stacked" size={56} />
				</div>

				<div className="auth-heading">
					<h1>Bienvenido</h1>
					<p>Inicia sesión para continuar</p>
				</div>

				<Input
					id="correo"
					label="Correo"
					hideLabel
					icon="user"
					placeholder="Correo electrónico"
					type="email"
					value={correo}
					onChange={(evento) => setCorreo(evento.target.value)}
					autoComplete="email"
				/>
				<Input
					id="contrasena"
					label="Contraseña"
					hideLabel
					icon="lock"
					placeholder="Contraseña"
					type="password"
					value={contrasena}
					onChange={(evento) => setContrasena(evento.target.value)}
					autoComplete="current-password"
				/>

				{error && <p className="form-error">{error}</p>}

				<Button type="submit" className="btn-block" disabled={cargando}>
					{cargando ? "Ingresando..." : "Ingresar"}
				</Button>

				<p className="auth-switch">
					¿Aún no tienes un negocio registrado?{" "}
					<Link to="/registro-negocio">Regístralo</Link>
				</p>
			</form>
		</div>
	);
}
