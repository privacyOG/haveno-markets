import { error } from "@sveltejs/kit";
import { getAsset } from "$lib/formatPrice.js";
import { groupedOffers, groupedTrades } from "$lib/server/context";

export async function load({ params }) {
	if (!getAsset(params.market).code) return error(404, "Market not found");

	return {
		trades: (groupedTrades.get(params.market) || []).slice(-64),
		offers: groupedOffers.get(params.market) || { BUY: [], SELL: [] },
	};
}
