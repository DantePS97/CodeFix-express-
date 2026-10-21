import "./Logo.css";

// Logotipo de CodeFix Express dibujado como SVG + texto, aislado en este único
// componente: cuando exista el archivo oficial del logo basta con cambiar el
// contenido de este archivo (el resto de la app solo usa <Logo />).
//
// variant: "light" (para fondos oscuros) | "dark" (para fondos claros)
// size: alto de la marca en píxeles (el texto escala con ella)
// layout: "horizontal" (marca a la izquierda) | "stacked" (marca arriba, texto centrado)
// markOnly: solo la marca, sin el nombre
export default function Logo({ variant = "dark", size = 40, layout = "horizontal", markOnly = false, className = "" }) {
	const clases = ["logo", `logo-${variant}`, `logo-${layout}`, className].filter(Boolean).join(" ");

	return (
		<span className={clases} style={{ "--logo-size": `${size}px` }} role="img" aria-label="CodeFix Express">
			<LogoMark />
			{!markOnly && (
				<span className="logo-text" aria-hidden="true">
					<span className="logo-name">
						<span className="logo-name-code">Code</span>
						<span className="logo-name-fix">Fix</span>
					</span>
					<span className="logo-express">EXPRESS</span>
				</span>
			)}
		</span>
	);
}

// Marca: pantalla redondeada con los corchetes de código y un rayo verde.
function LogoMark() {
	return (
		<svg className="logo-mark" viewBox="0 0 68 48" fill="none" aria-hidden="true" focusable="false">
			<rect className="logo-mark-frame" x="4" y="5" width="56" height="35" rx="9" strokeWidth="3.5" />
			<path className="logo-mark-code" d="M18 15 10 22.5 18 30M46 15l8 7.5L46 30" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
			<path className="logo-mark-bolt" d="M38 1 23 25h8l-4 22 19-27H35l6-19Z" />
		</svg>
	);
}
