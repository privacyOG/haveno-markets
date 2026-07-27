import { markets, priceIndex, trades } from "$lib/server/context";

export async function load({ cookies }) {
	const displayCurrency = cookies.get("display_currency") || "XMR";

	return {
		latestTrades: trades.slice(-64).toReversed(),
		markets,
		displayCurrency,
		priceIndex: priceIndex.get(displayCurrency).value,
	};
}
