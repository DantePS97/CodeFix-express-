import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useInventory } from "../../hooks/useInventory.js";
import { useProducts } from "../../hooks/useProducts.js";
import Card from "../../components/Card/Card.jsx";
import PageHeader from "../../components/PageHeader/PageHeader.jsx";
import Table from "../../components/Table/Table.jsx";
import Badge from "../../components/Badge/Badge.jsx";
import Modal from "../../components/Modal/Modal.jsx";
import Select from "../../components/Select/Select.jsx";
import Button from "../../components/Button/Button.jsx";
import Input from "../../components/Input/Input.jsx";
import "./InventoryPage.css";

const TIPOS_ADMIN = [
	{ value: "ENTRADA", label: "Entrada" },
	{ value: "SALIDA", label: "Salida" },
	{ value: "AJUSTE", label: "Ajuste" },
];
const TIPOS_VENDEDOR = [{ value: "SALIDA", label: "Salida" }];

const PILL_TIPO = {
	ENTRADA: { variant: "success", label: "Entrada" },
	SALIDA: { variant: "danger", label: "Salida" },
	AJUSTE: { variant: "info", label: "Ajuste" },
};

export default function InventoryPage() {
	const { usuario } = useAuth();
	// VENDEDOR no tiene permiso para GET /inventario/movimientos (DDS 4.2) —
	// evitamos el 403 automático no cargando el historial para ese rol.
	const puedeVerHistorial = usuario?.rol !== "VENDEDOR";
	const { movimientos, cargando, error, registrar } = useInventory({ cargarAlInicio: puedeVerHistorial });
	const { productos } = useProducts();

	const tiposDisponibles = usuario?.rol === "VENDEDOR" ? TIPOS_VENDEDOR : TIPOS_ADMIN;

	const [modalAbierto, setModalAbierto] = useState(false);
	const [form, setForm] = useState({ productoId: "", tipo: tiposDisponibles[0].value, cantidad: "", motivo: "" });
	const [errorForm, setErrorForm] = useState("");

	function abrirModal() {
		setForm({
			productoId: productos[0] ? String(productos[0].id) : "",
			tipo: tiposDisponibles[0].value,
			cantidad: "",
			motivo: "",
		});
		setErrorForm("");
		setModalAbierto(true);
	}

	function actualizarCampo(campo) {
		return (evento) => setForm((prev) => ({ ...prev, [campo]: evento.target.value }));
	}

	async function manejarGuardar(evento) {
		evento.preventDefault();
		setErrorForm("");
		if (form.cantidad === "") {
			setErrorForm("Ingresa la cantidad.");
			return;
		}
		try {
			await registrar({
				productoId: Number(form.productoId),
				tipo: form.tipo,
				cantidad: Number(form.cantidad),
				motivo: form.tipo === "AJUSTE" ? form.motivo : undefined,
			});
			setModalAbierto(false);
		} catch (err) {
			setErrorForm(err.response?.data?.error?.mensaje ?? "No se pudo registrar el movimiento.");
		}
	}

	const opcionesProductos = productos.map((p) => ({ value: p.id, label: p.nombre }));

	return (
		<Card>
			<PageHeader title="Inventario">
				<Button onClick={abrirModal}>+ Nuevo movimiento</Button>
			</PageHeader>

			{puedeVerHistorial ? (
				<>
					{error && <p className="form-error">{error}</p>}
					{cargando ? (
						<p className="module-empty">Cargando...</p>
					) : (
						<Table>
							<thead>
								<tr>
									<th>Producto</th>
									<th>Tipo</th>
									<th className="cell-number">Cantidad</th>
									<th className="cell-number">Stock anterior</th>
									<th className="cell-number">Stock nuevo</th>
									<th>Motivo</th>
									<th>Fecha</th>
								</tr>
							</thead>
							<tbody>
								{movimientos.map((m) => (
									<tr key={m.id}>
										<td>{m.producto?.nombre ?? productos.find((p) => p.id === m.productoId)?.nombre ?? m.productoId}</td>
										<td>
											<Badge variant={PILL_TIPO[m.tipo]?.variant ?? "neutral"}>{PILL_TIPO[m.tipo]?.label ?? m.tipo}</Badge>
										</td>
										<td className="cell-number">{m.cantidad}</td>
										<td className="cell-number">{m.stockAnterior}</td>
										<td className="cell-number">{m.stockNuevo}</td>
										<td>{m.motivo || "—"}</td>
										<td className="cell-date">
											{new Date(m.fechaMovimiento).toLocaleString("es-CO", {
												day: "2-digit",
												month: "2-digit",
												year: "numeric",
												hour: "2-digit",
												minute: "2-digit",
											})}
										</td>
									</tr>
								))}
							</tbody>
						</Table>
					)}
				</>
			) : (
				<p className="module-empty">Como VENDEDOR puedes registrar salidas, pero no ver el historial completo.</p>
			)}

			<Modal open={modalAbierto} onClose={() => setModalAbierto(false)} title="Nuevo movimiento">
				<form className="inventory-form" onSubmit={manejarGuardar}>
					<Select
						id="productoId"
						label="Producto"
						value={form.productoId}
						onChange={actualizarCampo("productoId")}
						options={opcionesProductos}
					/>
					<Select id="tipo" label="Tipo" value={form.tipo} onChange={actualizarCampo("tipo")} options={tiposDisponibles} />
					<Input
						id="cantidad"
						label={form.tipo === "AJUSTE" ? "Stock resultante (0 si no quedan unidades)" : "Cantidad"}
						type="number"
						min={form.tipo === "AJUSTE" ? "0" : "1"}
						step="1"
						value={form.cantidad}
						onChange={actualizarCampo("cantidad")}
					/>
					{form.tipo === "AJUSTE" && (
						<Input id="motivo" label="Motivo" value={form.motivo} onChange={actualizarCampo("motivo")} />
					)}
					{errorForm && <p className="form-error">{errorForm}</p>}
					<Button type="submit">Guardar</Button>
				</form>
			</Modal>
		</Card>
	);
}
