import { error, json } from "@sveltejs/kit";
import { getAsset, getPrice, isMoneroQuote } from "$lib/formatPrice";
import { groupedTrades, networks } from "$lib/server/context";

const sliceOrFilter = (e, limit) => {
	if (limit === 0) {
		return e.filter((e) => e.date > Date.now() - 864e5);
	}
	return e.slice(0, limit);
};

export const GET = async ({ params, url }) => {
	const code = params.pair.replace(
		isMoneroQuote(params.pair.replace("XMR", "").replace("_", ""))
			? "_XMR"
			: "XMR_",
		"",
	);
	if (!getAsset(code).name) {
		return error(404, "Pair doesn't exist.");
	}

	const limit = +url.searchParams.get("limit") || 0;
	if (!(limit >= 0)) {
		return error(400, "The limit is invalid.");
	}

	const network = url.searchParams.get("network") || "reto";
	if (!Object.keys(networks).includes(network)) {
		return error(404, `Haveno network '${network}' not available.`);
	}

	return json(
		sliceOrFilter((groupedTrades.get(code) || []).toReversed(), limit).map(
			(e) => {
				return {
					...e,
					xmrAmount: undefined,
					amount: undefined,
					price: getPrice(e.price, code),
					base_vol: getPrice(
						isMoneroQuote(code) ? e.xmrAmount : e.amount,
						isMoneroQuote(code) ? "XMR" : code,
					),
					rel_vol: getPrice(
						isMoneroQuote(code) ? e.amount : e.xmrAmount,
						isMoneroQuote(code) ? code : "XMR",
					),
				};
			},
		),
	);
};
