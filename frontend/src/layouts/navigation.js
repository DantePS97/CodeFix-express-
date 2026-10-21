// Menú de la aplicación. Los permisos reales viven en el backend y en las rutas
// (routes/AppRoutes.jsx); esto solo decide qué entradas se muestran a cada rol
// y en qué orden (el orden sigue los mapas de pantalla de cada rol).

const ITEMS = {
	inicio: { to: "/dashboard", label: "Inicio", icon: "home" },
	usuarios: { to: "/usuarios", label: "Usuarios", icon: "users" },
	productos: { to: "/productos", label: "Productos", icon: "box" },
	clientes: { to: "/clientes", label: "Clientes", icon: "clients" },
	facturas: { to: "/facturas", label: "Facturas", icon: "invoice", end: true },
	nuevaFactura: { to: "/facturas/nueva", label: "Nueva factura", icon: "plus-invoice" },
	inventario: { to: "/inventario", label: "Inventario", icon: "inventory" },
	reportes: { to: "/reportes", label: "Reportes", icon: "chart" },
	configuracion: { to: "/configuracion", label: "Configuración", icon: "settings" },
};

const MENU_POR_ROL = {
	ADMIN: ["inicio", "usuarios", "productos", "clientes", "facturas", "nuevaFactura", "inventario", "reportes", "configuracion"],
	VENDEDOR: ["inicio", "nuevaFactura", "facturas", "productos", "clientes", "inventario", "reportes"],
	CONTADOR: ["inicio", "facturas", "productos", "reportes", "configuracion"],
};

export function menuParaRol(rol) {
	return (MENU_POR_ROL[rol] ?? []).map((clave) => ITEMS[clave]);
}

// Título de la barra superior según la ruta actual.
const TITULOS = {
	...Object.fromEntries(Object.values(ITEMS).map((item) => [item.to, item.label])),
	"/perfil": "Mi perfil",
};

export function tituloDeRuta(pathname) {
	const ruta = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
	return TITULOS[ruta] ?? "CodeFix Express";
}
