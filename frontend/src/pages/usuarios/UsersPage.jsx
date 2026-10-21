import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useUsers } from "../../hooks/useUsers.js";
import Card from "../../components/Card/Card.jsx";
import Table from "../../components/Table/Table.jsx";
import Badge from "../../components/Badge/Badge.jsx";
import Modal from "../../components/Modal/Modal.jsx";
import Select from "../../components/Select/Select.jsx";
import PageHeader from "../../components/PageHeader/PageHeader.jsx";
import Button, { IconButton } from "../../components/Button/Button.jsx";
import Input from "../../components/Input/Input.jsx";
import "./UsersPage.css";

const ROLES = [
	{ value: "ADMIN", label: "Administrador" },
	{ value: "VENDEDOR", label: "Vendedor" },
	{ value: "CONTADOR", label: "Contador" },
];
const ETIQUETA_ROL = Object.fromEntries(ROLES.map((r) => [r.value, r.label]));

// Mínimo privilegio: el rol que se preselecciona al crear es el de menor alcance operativo.
const FORM_INICIAL = { nombre: "", correo: "", contrasena: "", rol: "VENDEDOR" };

const AVISO_PROPIA_CUENTA = "No puedes cambiar tu propio rol ni desactivar tu propia cuenta.";

export default function UsersPage() {
	const { usuario: sesion } = useAuth();
	const { usuarios, cargando, error, refrescar, crear, actualizar } = useUsers();

	const [crearAbierto, setCrearAbierto] = useState(false);
	const [form, setForm] = useState(FORM_INICIAL);
	const [errorForm, setErrorForm] = useState("");
	const [guardando, setGuardando] = useState(false);

	const [editando, setEditando] = useState(null);
	const [rolNuevo, setRolNuevo] = useState("");
	const [errorRol, setErrorRol] = useState("");

	const [procesandoId, setProcesandoId] = useState(null);
	const [errorAccion, setErrorAccion] = useState("");
	const [aviso, setAviso] = useState("");

	function abrirCrear() {
		setForm(FORM_INICIAL);
		setErrorForm("");
		setAviso("");
		setErrorAccion("");
		setCrearAbierto(true);
	}

	function actualizarCampo(campo) {
		return (evento) => setForm((prev) => ({ ...prev, [campo]: evento.target.value }));
	}

	async function manejarCrear(evento) {
		evento.preventDefault();
		if (guardando) return;
		setErrorForm("");
		setGuardando(true);
		try {
			await crear({
				nombre: form.nombre.trim(),
				correo: form.correo.trim(),
				contrasena: form.contrasena,
				rol: form.rol,
			});
			setCrearAbierto(false);
			setAviso(`Usuario ${form.nombre.trim()} creado correctamente.`);
		} catch (err) {
			setErrorForm(err.response?.data?.error?.mensaje ?? "No se pudo crear el usuario.");
		} finally {
			setGuardando(false);
		}
	}

	function abrirCambioRol(u) {
		setEditando(u);
		// Se preselecciona el rol vigente: un <select> sin valor que coincida con una opción queda vacío en React.
		setRolNuevo(u.rol);
		setErrorRol("");
		setAviso("");
		setErrorAccion("");
	}

	function cerrarCambioRol() {
		setEditando(null);
		setErrorRol("");
	}

	async function manejarCambioRol(evento) {
		evento.preventDefault();
		if (guardando || !editando) return;
		setErrorRol("");
		setGuardando(true);
		try {
			await actualizar(editando.id, { rol: rolNuevo });
			setAviso(`Rol de ${editando.nombre} actualizado a ${ETIQUETA_ROL[rolNuevo]}.`);
			setEditando(null);
		} catch (err) {
			setErrorRol(err.response?.data?.error?.mensaje ?? "No se pudo cambiar el rol.");
		} finally {
			setGuardando(false);
		}
	}

	async function alternarActivo(u) {
		setAviso("");
		setErrorAccion("");
		setProcesandoId(u.id);
		try {
			await actualizar(u.id, { activo: !u.activo });
			setAviso(`Usuario ${u.nombre} ${u.activo ? "desactivado" : "activado"} correctamente.`);
		} catch (err) {
			setErrorAccion(err.response?.data?.error?.mensaje ?? "No se pudo actualizar el estado del usuario.");
		} finally {
			setProcesandoId(null);
		}
	}

	return (
		<Card>
			<PageHeader title="Usuarios">
				<Button onClick={abrirCrear}>+ Nuevo usuario</Button>
			</PageHeader>

			{aviso && (
				<p className="users-alert users-alert-success" role="status">
					{aviso}
				</p>
			)}
			{errorAccion && (
				<p className="users-alert users-alert-error" role="alert">
					{errorAccion}
				</p>
			)}
			{error && (
				<p className="users-alert users-alert-error" role="alert">
					{error}{" "}
					<button type="button" className="users-link-button" onClick={refrescar}>
						Reintentar
					</button>
				</p>
			)}

			{cargando && usuarios.length === 0 ? (
				<p className="text-muted">Cargando usuarios...</p>
			) : usuarios.length === 0 ? (
				!error && <p className="text-muted">Aún no hay usuarios registrados en este negocio.</p>
			) : (
				<Table>
					<thead>
						<tr>
							<th>Nombre</th>
							<th>Correo</th>
							<th>Rol</th>
							<th>Estado</th>
							<th>Acciones</th>
						</tr>
					</thead>
					<tbody>
						{usuarios.map((u) => {
							const esPropio = u.id === sesion?.id;
							const ocupado = procesandoId === u.id;
							return (
								<tr key={u.id}>
									<td>
										{u.nombre}
										{esPropio && (
											<span className="users-self">
												<Badge variant="info">Tú</Badge>
											</span>
										)}
									</td>
									<td>{u.correo}</td>
									<td>
										<Badge variant="neutral">{ETIQUETA_ROL[u.rol] ?? u.rol}</Badge>
									</td>
									<td>
										<Badge variant={u.activo ? "success" : "danger"}>{u.activo ? "Activo" : "Inactivo"}</Badge>
									</td>
									<td>
										<div className="table-actions">
											<span title={esPropio ? AVISO_PROPIA_CUENTA : undefined}>
												<IconButton
													icon="pencil"
													label={`Cambiar rol de ${u.nombre}`}
													onClick={() => abrirCambioRol(u)}
													disabled={esPropio || ocupado}
												/>
											</span>
											<span title={esPropio ? AVISO_PROPIA_CUENTA : undefined}>
												<IconButton
													icon="power"
													label={`${u.activo ? "Desactivar" : "Activar"} a ${u.nombre}`}
													variant={u.activo ? "danger" : "neutral"}
													onClick={() => alternarActivo(u)}
													disabled={esPropio || ocupado}
												/>
											</span>
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</Table>
			)}

			<Modal open={crearAbierto} onClose={() => setCrearAbierto(false)} title="Nuevo usuario">
				<form className="users-form" onSubmit={manejarCrear} noValidate>
					<Input id="nombreUsuario" label="Nombre" value={form.nombre} onChange={actualizarCampo("nombre")} autoComplete="off" />
					<Input
						id="correoUsuario"
						label="Correo"
						type="email"
						value={form.correo}
						onChange={actualizarCampo("correo")}
						autoComplete="off"
					/>
					<div className="users-field">
						<Input
							id="contrasenaUsuario"
							label="Contraseña"
							type="password"
							value={form.contrasena}
							onChange={actualizarCampo("contrasena")}
							autoComplete="new-password"
						/>
						<span className="text-muted">Mínimo 8 caracteres.</span>
					</div>
					<Select id="rolUsuario" label="Rol" value={form.rol} onChange={actualizarCampo("rol")} options={ROLES} />
					{errorForm && (
						<p className="form-error" role="alert">
							{errorForm}
						</p>
					)}
					<div className="users-form-actions">
						<Button type="button" variant="secondary" onClick={() => setCrearAbierto(false)}>
							Cancelar
						</Button>
						<Button type="submit" disabled={guardando}>
							{guardando ? "Guardando..." : "Crear usuario"}
						</Button>
					</div>
				</form>
			</Modal>

			<Modal open={Boolean(editando)} onClose={cerrarCambioRol} title="Cambiar rol">
				{editando && (
					<form className="users-form" onSubmit={manejarCambioRol}>
						<p className="users-form-resumen">
							<strong>{editando.nombre}</strong>
							<br />
							<span className="text-muted">{editando.correo}</span>
						</p>
						<Select id="rolNuevo" label="Rol" value={rolNuevo} onChange={(evento) => setRolNuevo(evento.target.value)} options={ROLES} />
						{errorRol && (
							<p className="form-error" role="alert">
								{errorRol}
							</p>
						)}
						<div className="users-form-actions">
							<Button type="button" variant="secondary" onClick={cerrarCambioRol}>
								Cancelar
							</Button>
							<Button type="submit" disabled={guardando || rolNuevo === editando.rol}>
								{guardando ? "Guardando..." : "Guardar"}
							</Button>
						</div>
					</form>
				)}
			</Modal>
		</Card>
	);
}
