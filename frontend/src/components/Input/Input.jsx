import Icon from "../Icon/Icon.jsx";
import "./Input.css";

// icon: nombre de un icono de components/Icon, se dibuja al inicio del campo.
// hideLabel: oculta la etiqueta visualmente pero la deja para lectores de pantalla.
export default function Input({ label, id, error, icon, hideLabel = false, ...props }) {
	const campo = <input id={id} className={error ? "input input-error" : "input"} {...props} />;

	return (
		<div className="form-field">
			{label && (
				<label htmlFor={id} className={hideLabel ? "sr-only" : undefined}>
					{label}
				</label>
			)}
			{icon ? (
				<div className="input-with-icon">
					<Icon name={icon} size={18} className="input-icon" />
					{campo}
				</div>
			) : (
				campo
			)}
			{error && <span className="form-field-error">{error}</span>}
		</div>
	);
}
