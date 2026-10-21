// Iconos en línea (SVG, 24x24, trazo de 1.8 con extremos redondeados) para toda la
// app: sin librerías externas. Cada entrada es el contenido interno del <svg>.
const ICONOS = {
	home: (
		<>
			<path d="M3 11.5 12 4l9 7.5" />
			<path d="M5.5 10v9.5h13V10" />
			<path d="M10 19.5v-5h4v5" />
		</>
	),
	users: (
		<>
			<circle cx="9" cy="8" r="3.2" />
			<path d="M3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
			<circle cx="17" cy="9" r="2.5" />
			<path d="M16.5 13.7c2.6.2 4.5 2 4.5 4.8" />
		</>
	),
	box: (
		<>
			<path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
			<path d="m3 8 9 5 9-5" />
			<path d="M12 13v8" />
		</>
	),
	clients: (
		<>
			<rect x="3" y="5" width="18" height="14" rx="2.5" />
			<circle cx="9" cy="11" r="2" />
			<path d="M5.8 16c.5-1.7 1.8-2.5 3.2-2.5s2.7.8 3.2 2.5" />
			<path d="M15 10h3M15 14h3" />
		</>
	),
	invoice: (
		<>
			<path d="M6 3h8l4 4v14H6V3Z" />
			<path d="M14 3v4h4" />
			<path d="M9 12h6M9 16h6" />
		</>
	),
	"plus-invoice": (
		<>
			<path d="M6 3h8l4 4v14H6V3Z" />
			<path d="M14 3v4h4" />
			<path d="M12 11v6M9 14h6" />
		</>
	),
	inventory: (
		<>
			<rect x="5" y="4" width="14" height="17" rx="2" />
			<path d="M9 4V3h6v1" />
			<path d="M9 10h6M9 14h6M9 18h3" />
		</>
	),
	chart: (
		<>
			<path d="M5 20v-7M12 20V5M19 20V10" />
			<path d="M3 20h18" />
		</>
	),
	settings: (
		<>
			<path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
			<circle cx="16" cy="7" r="2" />
			<circle cx="8" cy="17" r="2" />
		</>
	),
	user: (
		<>
			<circle cx="12" cy="8" r="4" />
			<path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
		</>
	),
	logout: (
		<>
			<path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4" />
			<path d="m16 8 4 4-4 4" />
			<path d="M20 12H9" />
		</>
	),
	pencil: (
		<>
			<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
			<path d="m15 5 4 4" />
		</>
	),
	power: (
		<>
			<path d="M12 3v8" />
			<path d="M6.3 6.3a8 8 0 1 0 11.4 0" />
		</>
	),
	trash: (
		<>
			<path d="M4 7h16" />
			<path d="M10 11v6M14 11v6" />
			<path d="M6 7l1 13h10l1-13" />
			<path d="M9 7V4h6v3" />
		</>
	),
	search: (
		<>
			<circle cx="11" cy="11" r="7" />
			<path d="m20 20-3.5-3.5" />
		</>
	),
	lock: (
		<>
			<rect x="5" y="11" width="14" height="10" rx="2" />
			<path d="M8 11V8a4 4 0 0 1 8 0v3" />
		</>
	),
	mail: (
		<>
			<rect x="3" y="5" width="18" height="14" rx="2" />
			<path d="m3 7 9 6 9-6" />
		</>
	),
	alert: (
		<>
			<path d="M12 3 2 20h20L12 3Z" />
			<path d="M12 10v4M12 17.2v.01" />
		</>
	),
	construction: (
		<>
			<path d="M4 18v-2a8 8 0 0 1 16 0v2" />
			<path d="M2 18h20" />
			<path d="M10.5 8.5V5h3v3.5" />
		</>
	),
};

// name: clave de ICONOS. Por defecto es decorativo (aria-hidden); si se usa solo,
// sin texto al lado, pasar `label` para darle nombre accesible.
export default function Icon({ name, size = 20, label, className, ...props }) {
	const contenido = ICONOS[name];
	if (!contenido) return null;

	const accesibilidad = label ? { role: "img", "aria-label": label } : { "aria-hidden": "true" };

	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
			focusable="false"
			className={className}
			{...accesibilidad}
			{...props}
		>
			{contenido}
		</svg>
	);
}
