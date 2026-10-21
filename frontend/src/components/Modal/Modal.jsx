import { useEffect } from "react";
import "./Modal.css";

// Componente controlado y genérico — no acoplado a ningún dominio, para
// poder reusarse en cualquier formulario de creación/edición de la app.
// className permite variantes de aspecto (p. ej. "modal-confirm" para
// confirmaciones breves); no cambia el comportamiento.
export default function Modal({ open, onClose, title, children, className = "" }) {
	useEffect(() => {
		if (!open) return undefined;
		function manejarTecla(evento) {
			if (evento.key === "Escape") onClose();
		}
		document.addEventListener("keydown", manejarTecla);
		return () => document.removeEventListener("keydown", manejarTecla);
	}, [open, onClose]);

	if (!open) return null;

	function manejarClickOverlay(evento) {
		if (evento.target === evento.currentTarget) {
			onClose();
		}
	}

	return (
		<div className="modal-overlay" onClick={manejarClickOverlay}>
			<div className={["modal-content", className].filter(Boolean).join(" ")} role="dialog" aria-modal="true" aria-label={title || undefined}>
				{title && <h2>{title}</h2>}
				{children}
			</div>
		</div>
	);
}
