import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useInvoices } from "../../hooks/useInvoices.js";
import { listarClientes } from "../../services/clients.service.js";
import { anularFactura, obtenerFactura } from "../../services/invoices.service.js";
import { formatearDinero } from "../../utils/money.js";
import Card from "../../components/Card/Card.jsx";
import Table from "../../components/Table/Table.jsx";
import Badge from "../../components/Badge/Badge.jsx";
import Modal from "../../components/Modal/Modal.jsx";
import Select from "../../components/Select/Select.jsx";
import Button from "../../components/Button/Button.jsx";
import Input from "../../components/Input/Input.jsx";
import "./InvoicesPage.css";

const FILTROS_INICIALES = { clienteId: "", estado: "", desde: "", hasta: "" };
const OPCIONES_ESTADO = [
	{ value: "", label: "Todos" },
	{ value: "EMITIDA", label: "Emitida" },
	{ value: "ANULADA", label: "Anulada" },
];
const MOTIVO_MAX = 255;

function mensajeDe(err, porDefecto) {
	return err?.response?.data?.error?.mensaje ?? porDefecto;
}

export default function InvoicesPage() {
	const { usuario } = useAuth();
	const { facturas, loading, error, cargarFacturas } = useInvoices();

	// CONTADOR no puede listar clientes (403): no se consulta ni se muestra el filtro.
	const puedeFiltrarCliente = ["ADMIN", "VENDEDOR"].includes(usuario?.rol);
	const puedeAnular = usuario?.rol === "ADMIN";

	const [clientes, setClientes] = useState([]);
	const [filtros, setFiltros] = useState(FILTROS_INICIALES);
	const [aplicados, setAplicados] = useState(FILTROS_INICIALES);
	const [seleccionada, setSeleccionada] = useState(null);
	const [errorDetalle, setErrorDetalle] = useState("");
	const [anulando, setAnulando] = useState(false);
	const [motivo, setMotivo] = useState("");
	const [errorAnular, setErrorAnular] = useState("");
	const [guardando, setGuardando] = useState(false);

	useEffect(() => {
		if (!puedeFiltrarCliente) return;
		listarClientes()
			.then(setClientes)
			.catch(() => setClientes([]));
	}, [puedeFiltrarCliente]);

	function actualizarFiltro(campo) {
		return (evento) => setFiltros((prev) => ({ ...prev, [campo]: evento.target.value }));
	}

	function aplicarFiltros(evento) {
		evento.preventDefault();
		setAplicados(filtros);
		cargarFacturas(filtros);
	}

	function limpiarFiltros() {
		setFiltros(FILTROS_INICIALES);
		setAplicados(FILTROS_INICIALES);
		cargarFacturas(FILTROS_INICIALES);
	}

	async function abrirDetalle(factura) {
		setSeleccionada(factura);
		setErrorDetalle("");
		setAnulando(false);
		setMotivo("");
		setErrorAnular("");
		try {
			const detalle = await obtenerFactura(factura.id);
			setSeleccionada((prev) => (prev?.id === detalle.id ? detalle : prev));
		} catch (err) {
			setErrorDetalle(mensajeDe(err, "No se pudo cargar el detalle de la factura."));
		}
	}

	function cerrarDetalle() {
		setSeleccionada(null);
		setAnulando(false);
	}

	async function manejarAnular(evento) {
		evento.preventDefault();
		const motivoLimpio = motivo.trim();
		if (!motivoLimpio) {
			setErrorAnular("El motivo de anulación es obligatorio.");
			return;
		}
		if (motivoLimpio.length > MOTIVO_MAX) {
			setErrorAnular(`El motivo no puede superar los ${MOTIVO_MAX} caracteres.`);
			return;
		}

		setGuardando(true);
		setErrorAnular("");
		try {
			const anulada = await anularFactura(seleccionada.id, motivoLimpio);
			setSeleccionada(anulada);
			setAnulando(false);
			setMotivo("");
			await cargarFacturas(aplicados);
		} catch (err) {
			setErrorAnular(mensajeDe(err, "No se pudo anular la factura."));
			if (err.response?.status === 409) {
				// Otra sesión ya la anuló: se sincroniza para que el detalle refleje el estado real.
				setAnulando(false);
				await obtenerFactura(seleccionada.id).then(setSeleccionada, () => {});
				await cargarFacturas(aplicados);
			}
		} finally {
			setGuardando(false);
		}
	}

	const opcionesClientes = [
		{ value: "", label: "Todos" },
		...clientes.map((c) => ({ value: String(c.id), label: c.nombre })),
	];

	return (
		<div className="invoices-page">
			<h1>Facturas</h1>

			<Card>
				<form className="invoices-filters" onSubmit={aplicarFiltros}>
					<div className="invoices-filters-grid">
						<Select
							id="filtroEstado"
							label="Estado"
							value={filtros.estado}
							onChange={actualizarFiltro("estado")}
							options={OPCIONES_ESTADO}
						/>
						{puedeFiltrarCliente && (
							<Select
								id="filtroCliente"
								label="Cliente"
								value={filtros.clienteId}
								onChange={actualizarFiltro("clienteId")}
								options={opcionesClientes}
							/>
						)}
						<Input id="filtroDesde" label="Desde" type="date" value={filtros.desde} onChange={actualizarFiltro("desde")} />
						<Input id="filtroHasta" label="Hasta" type="date" value={filtros.hasta} onChange={actualizarFiltro("hasta")} />
					</div>
					<div className="invoices-filters-actions">
						<Button type="submit">Aplicar</Button>
						<Button variant="secondary" onClick={limpiarFiltros}>
							Limpiar
						</Button>
					</div>
				</form>
			</Card>

			{error && <p className="form-error">{mensajeDe(error, "No se pudieron cargar las facturas.")}</p>}

			{loading ? (
				<p>Cargando...</p>
			) : facturas.length === 0 ? (
				<p>No hay facturas para los filtros seleccionados.</p>
			) : (
				<Table>
					<thead>
						<tr>
							<th>Número</th>
							<th>Cliente</th>
							<th>Fecha</th>
							<th>Total</th>
							<th>Estado</th>
						</tr>
					</thead>
					<tbody>
						{facturas.map((f) => (
							<tr
								key={f.id}
								className="invoices-row"
								tabIndex={0}
								onClick={() => abrirDetalle(f)}
								onKeyDown={(evento) => {
									if (evento.key === "Enter") abrirDetalle(f);
								}}
							>
								<td>#{f.numero}</td>
								<td>{f.cliente?.nombre ?? "—"}</td>
								<td>{new Date(f.createdAt).toLocaleDateString()}</td>
								<td>{formatearDinero(f.total)}</td>
								<td>
									<Badge variant={f.estado === "EMITIDA" ? "success" : "neutral"}>
										{f.estado === "EMITIDA" ? "Emitida" : "Anulada"}
									</Badge>
								</td>
							</tr>
						))}
					</tbody>
				</Table>
			)}

			<Modal open={Boolean(seleccionada)} onClose={cerrarDetalle} title={seleccionada ? `Factura #${seleccionada.numero}` : ""}>
				{seleccionada && (
					<div className="invoice-detail">
						<div className="invoice-detail-info">
							<div className="invoice-detail-field">
								<span>Cliente</span>
								<strong>{seleccionada.cliente?.nombre ?? "—"}</strong>
							</div>
							<div className="invoice-detail-field">
								<span>Fecha</span>
								<strong>{new Date(seleccionada.createdAt).toLocaleString()}</strong>
							</div>
							<div className="invoice-detail-field">
								<span>Estado</span>
								<Badge variant={seleccionada.estado === "EMITIDA" ? "success" : "neutral"}>
									{seleccionada.estado === "EMITIDA" ? "Emitida" : "Anulada"}
								</Badge>
							</div>
							{seleccionada.estado === "ANULADA" && (
								<div className="invoice-detail-field">
									<span>Motivo de anulación</span>
									<strong>{seleccionada.motivoAnulacion}</strong>
								</div>
							)}
						</div>

						{errorDetalle && <p className="form-error">{errorDetalle}</p>}

						{seleccionada.detalles ? (
							<Table>
								<thead>
									<tr>
										<th>Producto</th>
										<th>Cant.</th>
										<th>Precio</th>
										<th>Subtotal</th>
									</tr>
								</thead>
								<tbody>
									{seleccionada.detalles.map((d) => (
										<tr key={d.id}>
											<td>{d.producto?.nombre ?? d.productoId}</td>
											<td>{d.cantidad}</td>
											<td>{formatearDinero(d.precioUnitario)}</td>
											<td>{formatearDinero(d.subtotalLinea)}</td>
										</tr>
									))}
								</tbody>
							</Table>
						) : (
							!errorDetalle && <p>Cargando detalle...</p>
						)}

						<div className="invoice-detail-totals">
							<div>
								<span>Subtotal</span>
								<strong>{formatearDinero(seleccionada.subtotal)}</strong>
							</div>
							<div>
								<span>IVA</span>
								<strong>{formatearDinero(seleccionada.impuesto)}</strong>
							</div>
							<div className="invoice-detail-grand-total">
								<span>Total</span>
								<strong>{formatearDinero(seleccionada.total)}</strong>
							</div>
						</div>

						{errorAnular && <p className="form-error">{errorAnular}</p>}

						{anulando && seleccionada.estado === "EMITIDA" ? (
							<form className="invoice-annul-form" onSubmit={manejarAnular}>
								<Input
									id="motivoAnulacion"
									label="Motivo de anulación"
									value={motivo}
									maxLength={MOTIVO_MAX}
									onChange={(evento) => setMotivo(evento.target.value)}
								/>
								<div className="invoice-detail-actions">
									<Button
										variant="secondary"
										disabled={guardando}
										onClick={() => {
											setAnulando(false);
											setErrorAnular("");
										}}
									>
										Cancelar
									</Button>
									<Button type="submit" variant="danger" disabled={guardando}>
										{guardando ? "Anulando..." : "Confirmar anulación"}
									</Button>
								</div>
							</form>
						) : (
							<div className="invoice-detail-actions">
								<Button variant="secondary" onClick={cerrarDetalle}>
									Cerrar
								</Button>
								{puedeAnular && seleccionada.estado === "EMITIDA" && (
									<Button
										variant="danger"
										onClick={() => {
											setAnulando(true);
											setErrorAnular("");
										}}
									>
										Anular
									</Button>
								)}
							</div>
						)}
					</div>
				)}
			</Modal>
		</div>
	);
}
