import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useProducts } from "../../hooks/useProducts.js";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";
import Card from "../../components/Card/Card.jsx";
import PageHeader from "../../components/PageHeader/PageHeader.jsx";
import Table from "../../components/Table/Table.jsx";
import Badge from "../../components/Badge/Badge.jsx";
import Modal from "../../components/Modal/Modal.jsx";
import Select from "../../components/Select/Select.jsx";
import Button, { IconButton } from "../../components/Button/Button.jsx";
import Input from "../../components/Input/Input.jsx";
import { formatearDinero } from "../../utils/money.js";
import "./ProductsPage.css";

const CAMPOS_INICIALES = { nombre: "", codigo: "", precio: "", categoriaId: "", stock: "", stockMinimo: "" };

export default function ProductsPage() {
	const { usuario } = useAuth();
	const [busqueda, setBusqueda] = useState("");
	const nombre = useDebouncedValue(busqueda.trim(), 300);
	const { productos, categorias, cargando, error, crear, actualizar } = useProducts({ nombre, incluirInactivos: true });
	const [modalAbierto, setModalAbierto] = useState(false);
	const [productoEditando, setProductoEditando] = useState(null);
	const [form, setForm] = useState(CAMPOS_INICIALES);
	const [errorForm, setErrorForm] = useState("");

	const puedeEditar = usuario?.rol === "ADMIN";

	function abrirCrear() {
		setProductoEditando(null);
		// Preselecciona la primera categoría: un <select> sin ninguna <option>
		// que matchee el value queda vacío en el estado de React aunque el
		// navegador muestre visualmente una opción por defecto (bug real
		// encontrado probando en el navegador, no a simple vista).
		setForm({ ...CAMPOS_INICIALES, categoriaId: categorias[0] ? String(categorias[0].id) : "" });
		setErrorForm("");
		setModalAbierto(true);
	}

	function abrirEditar(producto) {
		setProductoEditando(producto);
		setForm({
			nombre: producto.nombre,
			codigo: producto.codigo,
			precio: String(producto.precio),
			categoriaId: String(producto.categoriaId),
			stock: String(producto.stock),
			stockMinimo: String(producto.stockMinimo),
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

		try {
			if (productoEditando) {
				await actualizar(productoEditando.id, {
					nombre: form.nombre,
					codigo: form.codigo,
					precio: Number(form.precio),
					categoriaId: Number(form.categoriaId),
					stockMinimo: Number(form.stockMinimo),
				});
			} else {
				await crear({
					nombre: form.nombre,
					codigo: form.codigo,
					precio: Number(form.precio),
					categoriaId: Number(form.categoriaId),
					stock: form.stock === "" ? 0 : Number(form.stock),
					stockMinimo: form.stockMinimo === "" ? 5 : Number(form.stockMinimo),
				});
			}
			setModalAbierto(false);
		} catch (err) {
			setErrorForm(err.response?.data?.error?.mensaje ?? "No se pudo guardar el producto.");
		}
	}

	async function alternarActivo(producto) {
		await actualizar(producto.id, { activo: !producto.activo });
	}

	const opcionesCategorias = categorias.map((c) => ({ value: c.id, label: c.nombre }));

	return (
		<Card>
			<PageHeader title="Productos">{puedeEditar && <Button onClick={abrirCrear}>+ Nuevo producto</Button>}</PageHeader>

			<div className="module-toolbar">
				<div className="products-search">
					<Input
						id="busquedaProductos"
						label="Buscar"
						hideLabel
						icon="search"
						placeholder="Buscar por nombre del producto"
						value={busqueda}
						onChange={(evento) => setBusqueda(evento.target.value)}
					/>
				</div>
			</div>

			{error && <p className="form-error">{error}</p>}

			{cargando ? (
				<p className="module-empty">Cargando...</p>
			) : productos.length === 0 ? (
				<p className="module-empty">{nombre ? "No se encontraron productos con esa búsqueda." : "No hay productos registrados."}</p>
			) : (
				<Table>
					<thead>
						<tr>
							<th>Nombre</th>
							<th>Código</th>
							<th>Categoría</th>
							<th className="cell-number">Precio</th>
							<th className="cell-number">Stock</th>
							<th>Estado</th>
							{puedeEditar && <th>Acciones</th>}
						</tr>
					</thead>
					<tbody>
						{productos.map((p) => (
							<tr key={p.id}>
								<td>{p.nombre}</td>
								<td>{p.codigo}</td>
								<td>{categorias.find((c) => c.id === p.categoriaId)?.nombre ?? "—"}</td>
								<td className="cell-number">{formatearDinero(p.precio)}</td>
								<td className="cell-number">{p.stock}</td>
								<td>
									<Badge variant={p.activo ? "success" : "danger"}>{p.activo ? "Activo" : "Inactivo"}</Badge>
								</td>
								{puedeEditar && (
									<td>
										<div className="table-actions">
											<IconButton icon="pencil" label={`Editar ${p.nombre}`} onClick={() => abrirEditar(p)} />
											<IconButton
												icon="power"
												label={`${p.activo ? "Desactivar" : "Activar"} ${p.nombre}`}
												variant={p.activo ? "danger" : "neutral"}
												onClick={() => alternarActivo(p)}
											/>
										</div>
									</td>
								)}
							</tr>
						))}
					</tbody>
				</Table>
			)}

			<Modal
				open={modalAbierto}
				onClose={() => setModalAbierto(false)}
				title={productoEditando ? "Editar producto" : "Nuevo producto"}
			>
				<form className="products-form" onSubmit={manejarGuardar}>
					<Input id="nombre" label="Nombre" value={form.nombre} onChange={actualizarCampo("nombre")} required />
					<Input id="codigo" label="Código" value={form.codigo} onChange={actualizarCampo("codigo")} required />
					<Select
						id="categoriaId"
						label="Categoría"
						value={form.categoriaId}
						onChange={actualizarCampo("categoriaId")}
						options={opcionesCategorias}
					/>
					<Input
						id="precio"
						label="Precio"
						type="number"
						min="0"
						step="0.01"
						value={form.precio}
						onChange={actualizarCampo("precio")}
						required
					/>
					<Input
						id="stock"
						label={productoEditando ? "Stock actual (se cambia desde Inventario)" : "Stock inicial"}
						type="number"
						min="0"
						step="1"
						value={form.stock}
						onChange={actualizarCampo("stock")}
						disabled={Boolean(productoEditando)}
					/>
					<Input
						id="stockMinimo"
						label="Stock mínimo"
						type="number"
						min="0"
						step="1"
						value={form.stockMinimo}
						onChange={actualizarCampo("stockMinimo")}
						required={Boolean(productoEditando)}
					/>
					{errorForm && <p className="form-error">{errorForm}</p>}
					<Button type="submit">Guardar</Button>
				</form>
			</Modal>
		</Card>
	);
}
