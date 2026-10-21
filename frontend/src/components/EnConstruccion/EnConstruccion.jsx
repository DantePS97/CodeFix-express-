import Card from "../Card/Card.jsx";
import Icon from "../Icon/Icon.jsx";
import { ButtonLink } from "../Button/Button.jsx";
import "./EnConstruccion.css";

// Aviso para secciones del menú que todavía no tienen contenido real.
export default function EnConstruccion({
	titulo = "Módulo en construcción",
	mensaje = "Esta sección estará disponible próximamente.",
	mostrarVolver = true,
}) {
	return (
		<Card className="en-construccion">
			<span className="en-construccion-icono">
				<Icon name="construction" size={32} />
			</span>
			<h1 className="en-construccion-titulo">{titulo}</h1>
			<p className="en-construccion-mensaje">{mensaje}</p>
			{mostrarVolver && <ButtonLink to="/dashboard">Volver al inicio</ButtonLink>}
		</Card>
	);
}
