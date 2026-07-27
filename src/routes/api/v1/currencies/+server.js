import { error, json } from "@sveltejs/kit";
import { networks } from "$lib/server/context.js";
import { crypto, fiat } from "$lib/stores";

export const GET = async ({ url }) => {
	const network = url.searchParams.get("network") || "reto";
	if (!Object.keys(networks).includes(network)) {
		return error(404, `Haveno network '${network}' not available.`);
	}
	return json(Object.fromEntries([...crypto, ...fiat]));
};
