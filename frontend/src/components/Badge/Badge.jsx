import "./Badge.css";

// variant: "success" | "warning" | "danger" | "info" | "neutral"
// Ej.: Activo/Emitida -> success, En proceso/Bajo stock -> warning,
// Anulada/Inactivo -> danger, "Tú"/Ajuste -> info (ver mapas de pantalla).
export default function Badge({ children, variant = "neutral" }) {
	return <span className={`badge badge-${variant}`}>{children}</span>;
}
