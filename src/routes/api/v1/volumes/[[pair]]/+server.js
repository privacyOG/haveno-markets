import { error, json } from "@sveltejs/kit";
import { getAsset, isMoneroQuote } from "$lib/formatPrice";
import { groupBars, intervals } from "$lib/getDataForChart";
import { groupedTrades, networks, volume } from "$lib/server/context";

export const GET = async ({ params, url }) => {
	const code = params.pair?.replace(
		isMoneroQuote(params.pair?.replace("XMR", "").replace("_", ""))
			? "_XMR"
			: "XMR_",
		"",
	);
	if (code !== undefined && !getAsset(code).name) {
		return error(404, "Pair doesn't exist.");
	}

	const interval = url.searchParams.get("interval") || "monthly";
	if (![...intervals.keys()].includes(interval)) {
		return error(400, "The interval is invalid.");
	}

	const network = url.searchParams.get("network") || "reto";
	if (!Object.keys(networks).includes(network)) {
		return error(404, `Haveno network '${network}' not available.`);
	}

	const data = code
		? (groupedTrades.get(code) || []).map(({ xmrAmount, date }) => ({
				value: xmrAmount,
				time: date / 1e3,
			}))
		: volume;

	return json(
		groupBars(data, interval, "add", {
			value: "volume",
			count: "num_trades",
			time: "period_start",
		}),
	);
};
