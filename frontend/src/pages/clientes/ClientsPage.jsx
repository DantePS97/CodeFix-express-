import { useEffect, useState } from "react";
import { useClients } from "../../hooks/useClients";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

import Table from "../../components/Table/Table";
import Card from "../../components/Card/Card";
import Modal from "../../components/Modal/Modal";
import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";

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
      header: "Acciones",
      cell: (cliente) => (
        <Button onClick={() => abrirEditar(cliente)}>
          Editar
        </Button>
      ),
    },
  ];

  return (
    <div className="clients-page">
      <div className="clients-toolbar">
        <h1>Clientes</h1>

        <Button onClick={abrirCrear}>
          + Nuevo cliente
        </Button>
      </div>

      <Card>
        <div className="clients-search">
          <Input
            id="busquedaClientes"
            label="Buscar"
            placeholder="Nombre o documento"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {error && (
          <p className="form-error">
            {error.response?.data?.error?.mensaje ?? "No se pudieron cargar los clientes."}
          </p>
        )}

        {loading ? (
          <p>Cargando...</p>
        ) : clientes.length === 0 ? (
          <p>
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
      </Card>

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
            name="nombre"
            value={formulario.nombre}
            onChange={handleChange}
            required
          />

          <Input
            label="Documento"
            name="identificacion"
            value={formulario.identificacion}
            onChange={handleChange}
          />

          <Input
            label="Contacto"
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
    </div>
  );
};

export default ClientsPage;