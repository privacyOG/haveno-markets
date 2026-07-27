import { error, json } from "@sveltejs/kit";
import { getAsset, isMoneroQuote } from "$lib/formatPrice";
import { groupCandlesticks, intervals } from "$lib/getDataForChart";
import { networks, priceHistory } from "$lib/server/context";

export const GET = async ({ params, url }) => {
	const code =
		params.pair?.replace(
			isMoneroQuote(params.pair?.replace("XMR", "").replace("_", ""))
				? "_XMR"
				: "XMR_",
			"",
		) ?? "*";
	if (code !== "*" && !getAsset(code).name) {
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

	return json(
		groupCandlesticks(priceHistory.get(code) || [], interval).map((e) => ({
			period_start: e.time,
			high: e.high,
			low: e.low,
			open: e.open,
			close: e.close,
		})),
	);
};
