import { Link } from "react-router-dom";
import Icon from "../Icon/Icon.jsx";
import "./Button.css";

function unirClases(...clases) {
	return clases.filter(Boolean).join(" ");
}

export default function Button({ children, type = "button", variant = "primary", disabled = false, className, ...props }) {
	return (
		<button type={type} className={unirClases("btn", `btn-${variant}`, className)} disabled={disabled} {...props}>
			{children}
		</button>
	);
}

// Enlace con aspecto de botón (navega con el router, no envía formularios).
export function ButtonLink({ to, children, variant = "primary", className, ...props }) {
	return (
		<Link to={to} className={unirClases("btn", `btn-${variant}`, className)} {...props}>
			{children}
		</Link>
	);
}

// Botón cuadrado con solo un icono (acciones de tabla). `label` es obligatorio:
// da el nombre accesible y el tooltip nativo (title).
// variant: "neutral" | "danger"
export function IconButton({ icon, label, variant = "neutral", className, ...props }) {
	return (
		<button type="button" className={unirClases("icon-btn", `icon-btn-${variant}`, className)} aria-label={label} title={label} {...props}>
			<Icon name={icon} size={16} />
		</button>
	);
}
