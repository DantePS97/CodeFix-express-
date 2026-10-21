import { createContext, useContext, useEffect, useReducer, useRef } from "react";
import { setToken, clear, onClear } from "./authStorage.js";

const AuthContext = createContext(null);

const estadoInicial = {
	usuario: null,
	token: null,
	// true cuando la persona cerró sesión a propósito (y no por un 401).
	cierreVoluntario: false,
};

function reducer(estado, accion) {
	switch (accion.type) {
		case "LOGIN":
			return { usuario: accion.payload.usuario, token: accion.payload.token, cierreVoluntario: false };
		case "LOGOUT":
			return { ...estadoInicial, cierreVoluntario: accion.payload.voluntario };
		default:
			return estado;
	}
}

export function AuthProvider({ children }) {
	const [estado, dispatch] = useReducer(reducer, estadoInicial);
	const cierreVoluntarioPendiente = useRef(false);

	// Si el interceptor de Axios limpia la sesión por un 401, este contexto
	// se entera acá y actualiza su propio estado (dispara el redirect vía
	// ProtectedRoute, que lee `estaAutenticado`).
	useEffect(() => {
		return onClear(() => {
			const voluntario = cierreVoluntarioPendiente.current;
			cierreVoluntarioPendiente.current = false;
			dispatch({ type: "LOGOUT", payload: { voluntario } });
		});
	}, []);

	function login({ usuario, token }) {
		setToken(token);
		dispatch({ type: "LOGIN", payload: { usuario, token } });
	}

	function logout() {
		cierreVoluntarioPendiente.current = true;
		clear();
	}

	const value = {
		usuario: estado.usuario,
		token: estado.token,
		estaAutenticado: Boolean(estado.token),
		cierreVoluntario: estado.cierreVoluntario,
		login,
		logout,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const contexto = useContext(AuthContext);
	if (!contexto) {
		throw new Error("useAuth debe usarse dentro de un AuthProvider.");
	}
	return contexto;
}
