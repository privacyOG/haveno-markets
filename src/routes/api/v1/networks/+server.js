import { json } from "@sveltejs/kit";
import { networks } from "$lib/server/context";

export const GET = async () => {
	return json(networks);
};
