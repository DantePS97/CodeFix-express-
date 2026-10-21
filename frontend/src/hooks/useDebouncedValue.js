import { useEffect, useState } from "react";

export function useDebouncedValue(valor, demora = 300) {
	const [valorDebounced, setValorDebounced] = useState(valor);

	useEffect(() => {
		const temporizador = setTimeout(() => setValorDebounced(valor), demora);
		return () => clearTimeout(temporizador);
	}, [valor, demora]);

	return valorDebounced;
}
