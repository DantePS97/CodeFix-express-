import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import Button from "../../components/Button/Button.jsx";
import Input from "../../components/Input/Input.jsx";
import Logo from "../../components/Logo/Logo.jsx";
import { registrarNegocio } from "../../services/auth.service.js";
import { useAuth } from "../../context/AuthContext.jsx";
import "./Auth.css";

const CAMPOS_INICIALES = {
	nombre: "",
	nit: "",
	adminNombre: "",
	adminCorreo: "",
	adminContrasena: "",
};

export default function RegisterBusinessPage() {
	const { estaAutenticado } = useAuth();
	const [form, setForm] = useState(CAMPOS_INICIALES);
	const [error, setError] = useState("");
	const [cargando, setCargando] = useState(false);
	const [registroExitoso, setRegistroExitoso] = useState(false);

	function actualizarCampo(campo) {
		return (evento) =>
			setForm((prev) => ({ ...prev, [campo]: evento.target.value }));
	}

	async function manejarEnvio(evento) {
		evento.preventDefault();
		setError("");

		const faltaAlgunCampo = Object.values(form).some((valor) => !valor.trim());
		if (faltaAlgunCampo) {
			setError("Completa todos los campos.");
			return;
		}

		setCargando(true);
		try {
			await registrarNegocio(form);
			setRegistroExitoso(true);
		} catch (err) {
			const mensaje =
				err.response?.data?.error?.mensaje ??
				"No se pudo registrar el negocio.";
			setError(mensaje);
		} finally {
			setCargando(false);
		}
	}

	if (estaAutenticado) {
		return <Navigate to="/dashboard" replace />;
	}

	if (registroExitoso) {
		return (
			<div className="auth-page">
				<div className="auth-form auth-success">
					<div className="auth-brand">
						<Logo variant="light" layout="stacked" size={48} />
					</div>
					<h1>¡Negocio registrado!</h1>
					<p>
						Ya puedes iniciar sesión con el correo y la contraseña del
						administrador.
					</p>
					<Link to="/login">Ir a iniciar sesión</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="auth-page">
			<form className="auth-form" onSubmit={manejarEnvio}>
				<div className="auth-brand">
					<Logo variant="light" layout="stacked" size={48} />
				</div>

				<div className="auth-heading">
					<h1>Registrar negocio</h1>
					<p>Crea tu negocio y su cuenta de administrador</p>
				</div>

				<Input
					id="nombre"
					label="Nombre del negocio"
					icon="home"
					value={form.nombre}
					onChange={actualizarCampo("nombre")}
				/>
				<Input
					id="nit"
					label="NIT"
					icon="invoice"
					value={form.nit}
					onChange={actualizarCampo("nit")}
				/>
				<Input
					id="adminNombre"
					label="Nombre del administrador"
					icon="user"
					value={form.adminNombre}
					onChange={actualizarCampo("adminNombre")}
				/>
				<Input
					id="adminCorreo"
					label="Correo del administrador"
					icon="mail"
					type="email"
					value={form.adminCorreo}
					onChange={actualizarCampo("adminCorreo")}
					autoComplete="email"
				/>
				<Input
					id="adminContrasena"
					label="Contraseña"
					icon="lock"
					type="password"
					value={form.adminContrasena}
					onChange={actualizarCampo("adminContrasena")}
					autoComplete="new-password"
				/>

				{error && <p className="form-error">{error}</p>}

				<Button type="submit" className="btn-block" disabled={cargando}>
					{cargando ? "Registrando..." : "Registrar negocio"}
				</Button>

				<p className="auth-switch">
					¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
				</p>
			</form>
		</div>
	);
}
