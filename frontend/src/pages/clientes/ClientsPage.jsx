import { useEffect, useState } from "react";
import { useClients } from "../../hooks/useClients";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

import Table from "../../components/Table/Table";
import Card from "../../components/Card/Card";
import PageHeader from "../../components/PageHeader/PageHeader";
import Modal from "../../components/Modal/Modal";
import Button, { IconButton } from "../../components/Button/Button";
import Input from "../../components/Input/Input";
import Badge from "../../components/Badge/Badge";

import "./ClientsPage.css";

const estadoInicial = {
  nombre: "",
  identificacion: "",
  contacto: "",
};

const ClientsPage = () => {
  const [busqueda, setBusqueda] = useState("");
  const nombre = useDebouncedValue(busqueda.trim(), 300);
  const { clientes, loading, error, crear, actualizar } = useClients({ nombre });

  const [modalOpen, setModalOpen] = useState(false);
  const [clienteActual, setClienteActual] = useState(null);
  const [formulario, setFormulario] = useState(estadoInicial);
  const [errorForm, setErrorForm] = useState("");
  const [errorAccion, setErrorAccion] = useState("");

  useEffect(() => {
    if (clienteActual) {
      setFormulario({
        nombre: clienteActual.nombre || "",
        identificacion: clienteActual.identificacion || "",
        contacto: clienteActual.contacto || "",
      });
    } else {
      setFormulario(estadoInicial);
    }
  }, [clienteActual]);

  const abrirCrear = () => {
    setClienteActual(null);
    setFormulario(estadoInicial);
    setErrorForm("");
    setModalOpen(true);
  };

  const abrirEditar = (cliente) => {
    setClienteActual(cliente);
    setErrorForm("");
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setClienteActual(null);
    setFormulario(estadoInicial);
    setErrorForm("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormulario((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorForm("");

    try {
      if (clienteActual) {
        await actualizar(clienteActual.id, formulario);
      } else {
        await crear(formulario);
      }

      cerrarModal();
    } catch (err) {
      setErrorForm(err.response?.data?.error?.mensaje ?? "No se pudo guardar el cliente.");
    }
  };

  const alternarActivo = async (cliente) => {
    setErrorAccion("");

    try {
      await actualizar(cliente.id, { activo: !cliente.activo });
    } catch (err) {
      setErrorAccion(
        err.response?.data?.error?.mensaje ?? "No se pudo actualizar el estado del cliente.",
      );
    }
  };

  const columnas = [
    {
      header: "Nombre",
      accessor: "nombre",
    },
    {
      header: "Documento",
      accessor: "identificacion",
    },
    {
      header: "Contacto",
      accessor: "contacto",
    },
    {
      header: "Estado",
      cell: (cliente) => (
        <Badge variant={cliente.activo ? "success" : "danger"}>
          {cliente.activo ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      header: "Acciones",
      cell: (cliente) => (
        <div className="table-actions">
          <IconButton
            icon="pencil"
            label={`Editar ${cliente.nombre}`}
            onClick={() => abrirEditar(cliente)}
          />
          <IconButton
            icon="power"
            label={`${cliente.activo ? "Desactivar" : "Activar"} ${cliente.nombre}`}
            variant={cliente.activo ? "danger" : "neutral"}
            onClick={() => alternarActivo(cliente)}
          />
        </div>
      ),
    },
  ];

  return (
    <Card>
      <PageHeader title="Clientes">
        <Button onClick={abrirCrear}>+ Nuevo cliente</Button>
      </PageHeader>

      <div className="module-toolbar">
        <div className="clients-search">
          <Input
            id="busquedaClientes"
            label="Buscar"
            hideLabel
            icon="search"
            placeholder="Buscar por nombre o documento"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <p className="form-error">
          {error.response?.data?.error?.mensaje ?? "No se pudieron cargar los clientes."}
        </p>
      )}

      {errorAccion && <p className="form-error">{errorAccion}</p>}

      {loading ? (
        <p className="module-empty">Cargando...</p>
      ) : clientes.length === 0 ? (
        <p className="module-empty">
          {nombre
            ? "No se encontraron clientes con esa búsqueda."
            : "No hay clientes registrados."}
        </p>
      ) : (
        <Table>
          <thead>
            <tr>
              {columnas.map((columna) => (
                <th key={columna.header}>{columna.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => (
              <tr key={cliente.id}>
                {columnas.map((columna) => (
                  <td key={columna.header}>
                    {columna.cell
                      ? columna.cell(cliente)
                      : cliente[columna.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal
        open={modalOpen}
        onClose={cerrarModal}
        title={
          clienteActual
            ? "Editar cliente"
            : "Nuevo cliente"
        }
      >
        <form
          className="clients-form"
          onSubmit={handleSubmit}
        >
          <Input
            label="Nombre"
            id="nombreCliente"
            name="nombre"
            value={formulario.nombre}
            onChange={handleChange}
            required
          />

          <Input
            label="Documento"
            id="identificacionCliente"
            name="identificacion"
            value={formulario.identificacion}
            onChange={handleChange}
          />

          <Input
            label="Contacto"
            id="contactoCliente"
            name="contacto"
            value={formulario.contacto}
            onChange={handleChange}
          />

          {errorForm && <p className="form-error">{errorForm}</p>}

          <div className="clients-form-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={cerrarModal}
            >
              Cancelar
            </Button>

            <Button type="submit">
              Guardar
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
};

export default ClientsPage;
