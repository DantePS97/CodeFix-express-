import { useEffect, useMemo, useState } from "react";
import { useInvoices } from "../../hooks/useInvoices";
import { useClients } from "../../hooks/useClients";
import { useProducts } from "../../hooks/useProducts";
import { obtenerNegocioActual } from "../../services/business.service";

import Card from "../../components/Card/Card";
import PageHeader from "../../components/PageHeader/PageHeader";
import Table from "../../components/Table/Table";
import Button, { IconButton } from "../../components/Button/Button";
import Input from "../../components/Input/Input";
import Select from "../../components/Select/Select";

import { aCentavos, aPuntosBase, calcularImpuestoCentavos, formatearCentavos, formatearDinero } from "../../utils/money";

import "./NewInvoicesPage.css";

export default function NewInvoicesPage() {
	const { crearFactura } = useInvoices();
	const { clientes, loading: loadingClientes } = useClients();
	const { productos, cargando: loadingProductos } = useProducts();

	const [clienteId, setClienteId] = useState("");
	const [productoId, setProductoId] = useState("");
	const [cantidad, setCantidad] = useState(1);

	const [carrito, setCarrito] = useState([]);
	const [facturaEmitida, setFacturaEmitida] = useState(null);
	const [errorFactura, setErrorFactura] = useState("");
	const [guardando, setGuardando] = useState(false);

	/* Porcentaje como string ("19", "8.25"); null si todavía no se cargó o falló */
	const [tarifaIva, setTarifaIva] = useState(null);
	const [cargandoTarifa, setCargandoTarifa] = useState(true);

	useEffect(() => {
		let cancelado = false;

		obtenerNegocioActual()
			.then((negocio) => {
				if (!cancelado) setTarifaIva(negocio.tarifaIvaDefault);
			})
			.catch(() => {})
			.finally(() => {
				if (!cancelado) setCargandoTarifa(false);
			});

		return () => {
			cancelado = true;
		};
	}, []);

	/* El backend rechaza facturar a clientes inactivos */
	const clientesActivos = useMemo(
		() => clientes.filter((cliente) => cliente.activo),
		[clientes]
	);

	/* Preselección del primer cliente */
	useEffect(() => {
		if (!clienteId && clientesActivos.length > 0) {
			setClienteId(String(clientesActivos[0].id));
		}
	}, [clientesActivos, clienteId]);

	/* Preselección del primer producto */
	useEffect(() => {
		if (!productoId && productos.length > 0) {
			setProductoId(String(productos[0].id));
		}
	}, [productos, productoId]);

	const opcionesClientes = clientesActivos.map((cliente) => ({
		value: String(cliente.id),
		label: cliente.nombre,
	}));

	const opcionesProductos = productos.map((producto) => ({
		value: String(producto.id),
		label: producto.nombre,
	}));

	const agregarProducto = () => {
		const productoSeleccionado = productos.find(
			(producto) =>
				String(producto.id) === String(productoId)
		);

		if (!productoSeleccionado) {
			return;
		}

		setErrorFactura("");

		/* El backend rechaza líneas con el mismo producto repetido */
		setCarrito((prev) => {
			const existente = prev.find(
				(item) => item.productoId === productoSeleccionado.id
			);

			if (existente) {
				return prev.map((item) =>
					item === existente
						? { ...item, cantidad: item.cantidad + Number(cantidad) }
						: item
				);
			}

			return [
				...prev,
				{
					productoId: productoSeleccionado.id,
					nombre: productoSeleccionado.nombre,
					cantidad: Number(cantidad),
					precioCentavos: aCentavos(productoSeleccionado.precio),
				},
			];
		});

		setCantidad(1);
	};

	const eliminarProducto = (index) => {
		setCarrito((prev) =>
			prev.filter((_, i) => i !== index)
		);
	};

	const subtotal = useMemo(() => {
		return carrito.reduce(
			(acc, item) =>
				acc +
				item.cantidad * item.precioCentavos,
			0
		);
	}, [carrito]);

	const puntosBaseIva = useMemo(() => {
		return /^\d+(\.\d{1,2})?$/.test(String(tarifaIva)) ? aPuntosBase(tarifaIva) : null;
	}, [tarifaIva]);

	/* Sin tarifa real no se muestra IVA ni total: el servidor los calcula al confirmar */
	const impuesto = puntosBaseIva === null ? null : calcularImpuestoCentavos(subtotal, puntosBaseIva);
	const total = impuesto === null ? null : subtotal + impuesto;

	const confirmarFactura = async () => {
		if (!clienteId || carrito.length === 0) {
			return;
		}

		try {
			setGuardando(true);
			setErrorFactura("");
			setFacturaEmitida(null);

			const payload = {
				clienteId: Number(clienteId),
				lineas: carrito.map((item) => ({
					productoId: item.productoId,
					cantidad: item.cantidad,
				})),
			};

			const factura = await crearFactura(payload);

			setFacturaEmitida(factura);
			setCarrito([]);
		} catch (error) {
			setErrorFactura(
				error.response?.data?.error?.mensaje ??
				"No se pudo generar la factura."
			);
		} finally {
			setGuardando(false);
		}
	};

	return (
		<div className="new-invoice-page">
			<PageHeader title="Nueva factura" />

			<div className="new-invoice-grid">
				<Card>
					<h2 className="new-invoice-card-title">Datos de la venta</h2>

					<div className="invoice-form">
						<Select
							label="Cliente"
							value={clienteId}
							onChange={(e) =>
								setClienteId(e.target.value)
							}
							options={opcionesClientes}
							disabled={loadingClientes}
						/>

						<div className="invoice-product-row">
							<Select
								label="Producto"
								value={productoId}
								onChange={(e) =>
									setProductoId(e.target.value)
								}
								options={opcionesProductos}
								disabled={loadingProductos}
							/>

							<Input
								label="Cantidad"
								type="number"
								min="1"
								value={cantidad}
								onChange={(e) =>
									setCantidad(
										Number(e.target.value)
									)
								}
							/>

							<Button onClick={agregarProducto}>
								Agregar
							</Button>
						</div>
					</div>
				</Card>

				<Card>
					<h2 className="new-invoice-card-title">Carrito</h2>

					<Table>
						<thead>
							<tr>
								<th>Producto</th>
								<th className="cell-number">Cantidad</th>
								<th className="cell-number">Precio Unitario</th>
								<th className="cell-number">Subtotal</th>
								<th>Acciones</th>
							</tr>
						</thead>

						<tbody>
							{carrito.map((item, index) => (
								<tr key={`${item.productoId}-${index}`}>
									<td>{item.nombre}</td>
									<td className="cell-number">{item.cantidad}</td>
									<td className="cell-number">
										{formatearCentavos(item.precioCentavos)}
									</td>
									<td className="cell-number">
										{formatearCentavos(
											item.cantidad *
											item.precioCentavos
										)}
									</td>
									<td>
										<div className="table-actions">
											<IconButton
												icon="trash"
												label={`Quitar ${item.nombre}`}
												variant="danger"
												onClick={() =>
													eliminarProducto(index)
												}
											/>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</Table>

					{carrito.length === 0 && (
						<p className="module-empty">No hay productos agregados.</p>
					)}

					<div className="invoice-summary">
						<div>
							<span>Subtotal:</span>
							<strong>
								{formatearCentavos(subtotal)}
							</strong>
						</div>

						{impuesto !== null && (
							<>
								<div>
									<span>Impuesto (IVA {Number(tarifaIva)}%):</span>
									<strong>
										{formatearCentavos(impuesto)}
									</strong>
								</div>

								<div className="invoice-total">
									<span>Total:</span>
									<strong>
										{formatearCentavos(total)}
									</strong>
								</div>
							</>
						)}
					</div>

					{!cargandoTarifa && impuesto === null && (
						<p className="text-muted invoice-note">
							No se pudo cargar la tarifa de IVA: el servidor calculará el IVA y el total al confirmar la factura.
						</p>
					)}

					{errorFactura && (
						<p className="form-error invoice-note">{errorFactura}</p>
					)}

					<Button
						variant="success"
						className="btn-block"
						onClick={confirmarFactura}
						disabled={
							guardando || carrito.length === 0
						}
					>
						{guardando
							? "Generando..."
							: "Confirmar factura"}
					</Button>

					{facturaEmitida && (
						<div className="invoice-success">
							Factura generada correctamente.
							<br />
							<strong>
								Número: #{facturaEmitida.numero}
							</strong>
							<br />
							Subtotal: {formatearDinero(facturaEmitida.subtotal)}
							<br />
							IVA: {formatearDinero(facturaEmitida.impuesto)}
							<br />
							Total: {formatearDinero(facturaEmitida.total)}
						</div>
					)}
				</Card>
			</div>
		</div>
	);
}
