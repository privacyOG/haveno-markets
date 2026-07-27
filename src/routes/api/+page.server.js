import { networks } from "$lib/server/context";
import { crypto, fiat } from "$lib/stores";

export async function load() {
	return {
		networks: Object.keys(networks),
		pairs: [
			...Iterator.concat(
				crypto.keys().map((e) => `${e}_XMR`),
				fiat.keys().map((e) => `XMR_${e}`),
			),
		].filter((e) => e !== "XMR_XMR"),
	};
}
