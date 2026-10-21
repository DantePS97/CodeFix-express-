import "./PageHeader.css";

// Encabezado de pantalla de módulo (ver mapas de pantalla): título a la
// izquierda y, a la derecha, la acción principal (p. ej. "+ Nuevo producto").
export default function PageHeader({ title, children }) {
	return (
		<div className="page-header">
			<h1 className="page-header-title">{title}</h1>
			{children && <div className="page-header-actions">{children}</div>}
		</div>
	);
}
