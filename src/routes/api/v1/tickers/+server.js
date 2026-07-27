import { error, json } from "@sveltejs/kit";
import { getPrice, isMoneroQuote } from "$lib/formatPrice";
import { groupedOffers, networks, trades } from "$lib/server/context";

const TIME_PERIODS = {
	"24h": () => Date.now() - 864e5,
	"7d": () => Date.now() - 6048e5,
};

export const GET = async ({ url }) => {
	const network = url.searchParams.get("network") || "reto";
	if (!(network in networks)) {
		return error(404, `Haveno network '${network}' not available.`);
	}

	const timePeriod = url.searchParams.get("time_period") || "24h";
	if (!(timePeriod in TIME_PERIODS)) {
		return error(404, `Time period ${timePeriod} not valid.`);
	}

	const timePeriodStart = TIME_PERIODS[timePeriod]();

	const tickers = Map.groupBy(trades, ({ currency }) => currency);

	for (const ticker of tickers.keys()) {
		const latest = tickers.get(ticker).at(-1);
		tickers.set(
			ticker,
			tickers.get(ticker).filter((e) => e.date > timePeriodStart),
		);

		let noVolumeInPeriod = false;
		if (!tickers.get(ticker).length) {
			tickers.set(ticker, [latest]);
			noVolumeInPeriod = true;
		}

		let earliest = 0;
		tickers.set(
			ticker,
			tickers.get(ticker).reduce((a, c) => {
				earliest ||= c.price;
				return {
					xmr_vol: (a.xmr_vol || 0) + c.xmrAmount,
					vol: (a.vol || 0) + c.amount,
					high: (c.price > a.high ? c.price : a.high) ?? c.price,
					low: (c.price < a.low ? c.price : a.low) ?? c.price,
					last: c.price,
				};
			}, {}),
		);

		if (noVolumeInPeriod) {
			tickers.get(ticker).xmr_vol = 0;
			tickers.get(ticker).vol = 0;
		}

		const BUY_SELL = isMoneroQuote(ticker) ? ["SELL", "BUY"] : ["BUY", "SELL"];

		if (!groupedOffers.get(ticker)) {
			tickers.delete(ticker);
		} else {
			tickers.set(ticker, {
				pair: isMoneroQuote(ticker) ? `${ticker}_XMR` : `XMR_${ticker}`,
				base_vol: isMoneroQuote(ticker)
					? getPrice(tickers.get(ticker).xmr_vol, "XMR")
					: getPrice(tickers.get(ticker).vol, ticker),
				rel_vol: isMoneroQuote(ticker)
					? getPrice(tickers.get(ticker).vol, ticker)
					: getPrice(tickers.get(ticker).xmr_vol, "XMR"),
				highest_price: getPrice(tickers.get(ticker).high, ticker),
				lowest_price: getPrice(tickers.get(ticker).low, ticker),
				last_price: getPrice(tickers.get(ticker).last, ticker),
				price_change_percent: noVolumeInPeriod
					? 0
					: getPrice((tickers.get(ticker).last / earliest - 1) * 100),
				highest_bid: getPrice(
					Math.max(
						...Object.keys(groupedOffers.get(ticker)[BUY_SELL[0]]).map(
							(e) => +e,
						),
					),
					ticker,
				),
				lowest_ask: getPrice(
					Math.min(
						...Object.keys(groupedOffers.get(ticker)[BUY_SELL[1]]).map(
							(e) => +e,
						),
					),
					ticker,
				),
			});
		}
	}

	return json(Object.fromEntries(tickers));
};
