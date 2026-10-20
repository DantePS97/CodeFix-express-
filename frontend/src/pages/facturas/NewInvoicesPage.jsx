import { useEffect, useMemo, useState } from "react";
import { useInvoices } from "../../hooks/useInvoices";
import { useClients } from "../../hooks/useClients";
import { useProducts } from "../../hooks/useProducts";

import Card from "../../components/Card/Card";
import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";
import Select from "../../components/Select/Select";

import { aCentavos, calcularImpuestoCentavos, formatearCentavos, formatearDinero } from "../../utils/money";

import "./NewInvoicesPage.css";

/* El backend no expone Negocio.tarifaIvaDefault: la vista previa usa esta tarifa estimada */
const TARIFA_IVA_ESTIMADA = 19;

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

	/* Valor informativo solamente */
	const impuesto = useMemo(() => {
		return calcularImpuestoCentavos(subtotal, TARIFA_IVA_ESTIMADA);
	}, [subtotal]);

	/* Valor informativo solamente */
	const total = subtotal + impuesto;

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
			<div className="page-header">
				<h1>Nueva factura</h1>
			</div>

			<Card>
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
				<h2>Carrito</h2>

				<table className="invoice-table">
					<thead>
						<tr>
							<th>Producto</th>
							<th>Cantidad</th>
							<th>Precio Unitario</th>
							<th>Subtotal</th>
							<th></th>
						</tr>
					</thead>

					<tbody>
						{carrito.map((item, index) => (
							<tr key={`${item.productoId}-${index}`}>
								<td>{item.nombre}</td>
								<td>{item.cantidad}</td>
								<td>
									{formatearCentavos(item.precioCentavos)}
								</td>
								<td>
									{formatearCentavos(
										item.cantidad *
										item.precioCentavos
									)}
								</td>
								<td>
									<Button
										variant="danger"
										onClick={() =>
											eliminarProducto(index)
										}
									>
										Quitar
									</Button>
								</td>
							</tr>
						))}
					</tbody>
				</table>

				{carrito.length === 0 && (
					<p>No hay productos agregados.</p>
				)}
			</Card>

			<Card>
				<div className="invoice-summary">
					<div>
						<span>Subtotal:</span>
						<strong>
							{formatearCentavos(subtotal)}
						</strong>
					</div>

					<div>
						<span>Impuesto (IVA estimado {TARIFA_IVA_ESTIMADA}%):</span>
						<strong>
							{formatearCentavos(impuesto)}
						</strong>
					</div>

					<div className="invoice-total">
						<span>Total estimado:</span>
						<strong>
							{formatearCentavos(total)}
						</strong>
					</div>
				</div>

				<p className="text-muted invoice-note">
					Valores estimados: el IVA y el total reales los calcula el servidor al confirmar la factura.
				</p>

				{errorFactura && (
					<p className="form-error invoice-note">{errorFactura}</p>
				)}

				<Button
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
	);
}