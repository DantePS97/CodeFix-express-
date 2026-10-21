import "./Card.css";

export default function Card({ children, className = "" }) {
	return <div className={["card", className].filter(Boolean).join(" ")}>{children}</div>;
}

// Variante especializada para los indicadores del dashboard (ver mapas de pantalla):
// número grande arriba, etiqueta pequeña debajo y, si hay, una nota auxiliar.
export function StatCard({ label, value, helper }) {
	return (
		<Card className="stat-card">
			{value && <span className="stat-card-value">{value}</span>}
			{label && <span className="stat-card-label">{label}</span>}
			{helper && <span className="stat-card-helper">{helper}</span>}
		</Card>
	);
}
