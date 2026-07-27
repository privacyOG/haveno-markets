import { error, json } from "@sveltejs/kit";
import { getAsset, getPrice, isMoneroQuote } from "$lib/formatPrice";
import { groupedOffers, networks } from "$lib/server/context";

const flatOrMap = (e, level) => {
	if (level > 1) {
		return Object.values(e).flat(2);
	}
	const val = {};
	for (const price in e) {
		val[price] = e[price].reduce(
			(a, c) => {
				return {
					amount: a.amount + c.amount,
					offer_count: a.offer_count + 1,
					primaryMarketAmount: a.primaryMarketAmount + c.primaryMarketAmount,
				};
			},
			{ amount: 0, offer_count: 0, primaryMarketAmount: 0 },
		);
		val[price].price = price;
	}
	return Object.values(val).flat(2);
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

	const level = +url.searchParams.get("level") || 1;
	if (![1, 2].includes(level)) {
		return error(400, "The level should be either 1 or 2.");
	}

	const network = url.searchParams.get("network") || "reto";
	if (!Object.keys(networks).includes(network)) {
		return error(404, `Haveno network '${network}' not available.`);
	}

	if (!getAsset(code).name) {
		return error(404, "Pair doesn't exist");
	}

	const format = (offer) => {
		return {
			offer_id: level > 1 ? offer.id : undefined,
			offer_date: level > 1 ? offer.date : undefined,
			amount: getPrice(
				isMoneroQuote(code) ? offer.primaryMarketAmount : offer.amount,
				isMoneroQuote(code) ? code : "XMR",
			),
			price: getPrice(offer.price, code),
			offer_count: level === 1 ? offer.offer_count : undefined,
			payment_method: level > 1 ? offer.paymentMethod : undefined,
			min_amount:
				level > 1
					? getPrice(
							isMoneroQuote(code)
								? offer.primaryMarketMinAmount
								: offer.minAmount,
							isMoneroQuote(code) ? code : "XMR",
						)
					: undefined,
		};
	};

	const BUY_SELL = isMoneroQuote(code) ? ["SELL", "BUY"] : ["BUY", "SELL"];

	return json({
		bids: flatOrMap(groupedOffers.get(code)[BUY_SELL[0]], level)
			.map((e) => format(e))
			.sort((a, b) => b.price - a.price),
		asks: flatOrMap(groupedOffers.get(code)[BUY_SELL[1]], level)
			.map((e) => format(e))
			.sort((a, b) => a.price - b.price),
	});
};
