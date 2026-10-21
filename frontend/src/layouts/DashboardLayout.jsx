import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Button from "../components/Button/Button.jsx";
import Icon from "../components/Icon/Icon.jsx";
import Logo from "../components/Logo/Logo.jsx";
import Modal from "../components/Modal/Modal.jsx";
import { etiquetaRol, iniciales } from "../utils/roles.js";
import { menuParaRol, tituloDeRuta } from "./navigation.js";
import "./DashboardLayout.css";

function itemClase({ isActive }) {
	return `app-sidebar-item${isActive ? " is-active" : ""}`;
}

export default function DashboardLayout() {
	const { usuario, logout } = useAuth();
	const { pathname } = useLocation();
	const [confirmandoSalida, setConfirmandoSalida] = useState(false);

	const menu = menuParaRol(usuario?.rol);

	return (
		<div className="app-layout">
			<aside className="app-sidebar">
				<Link to="/dashboard" className="app-sidebar-logo" aria-label="CodeFix Express, ir al inicio">
					<Logo variant="light" size={34} />
				</Link>

				<nav className="app-sidebar-nav" aria-label="Principal">
					{menu.map((item) => (
						<NavLink key={item.to} to={item.to} end={item.end} className={itemClase} title={item.label}>
							<Icon name={item.icon} size={20} />
							<span className="app-sidebar-label">{item.label}</span>
						</NavLink>
					))}
				</nav>
			</aside>

			<div className="app-main">
				<header className="app-topbar">
					<span className="app-topbar-title">{tituloDeRuta(pathname)}</span>

					<div className="app-topbar-actions">
						<Link to="/perfil" className="app-user-chip" title="Ver mi perfil">
							<span className="app-avatar" aria-hidden="true">
								{iniciales(usuario?.nombre)}
							</span>
							<span className="app-user-info">
								<span className="app-user-name">{usuario?.nombre}</span>
								<span className="app-user-role">{etiquetaRol(usuario?.rol)}</span>
							</span>
						</Link>

						<Button variant="secondary" className="app-logout-button" onClick={() => setConfirmandoSalida(true)} title="Cerrar sesión">
							<Icon name="logout" size={18} />
							<span className="app-logout-label">Cerrar sesión</span>
						</Button>
					</div>
				</header>

				<main className="app-content">
					<Outlet />
				</main>
			</div>

			<Modal open={confirmandoSalida} onClose={() => setConfirmandoSalida(false)} title="¿Cerrar sesión?" className="modal-confirm">
				<span className="modal-confirm-icon">
					<Icon name="logout" size={28} />
				</span>
				<p className="modal-confirm-text">¿Estás seguro de que deseas salir del sistema?</p>
				<div className="modal-confirm-actions">
					<Button variant="secondary" onClick={() => setConfirmandoSalida(false)} autoFocus>
						Cancelar
					</Button>
					<Button onClick={logout}>Cerrar sesión</Button>
				</div>
			</Modal>
		</div>
	);
}
