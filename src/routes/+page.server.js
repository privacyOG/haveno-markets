import { markets, trades } from "$lib/server/context";

export async function load({ parent }) {
	const { displayCurrency, priceIndex } = await parent();
	return {
		latestTrades: trades.slice(-16).toReversed(),
		markets: markets.slice(0, 16),
		liquidity: markets.reduce((a, b) => a + b.offerLiquidity, 0),
		displayCurrency,
		priceIndex,
	};
}
