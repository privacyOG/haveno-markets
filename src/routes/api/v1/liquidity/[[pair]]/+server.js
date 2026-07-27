import { error, json } from "@sveltejs/kit";
import { eq, max, sql } from "drizzle-orm";
import { getAsset, getPrice, isMoneroQuote } from "$lib/formatPrice";
import { groupBars, intervals } from "$lib/getDataForChart";
import { networks } from "$lib/server/context";
import { db } from "$lib/server/db";
import { liquidityTable } from "$lib/server/db/schema.js";

const createLiquidityQuery = () =>
	db
		.select({
			pair: liquidityTable.pair,
			timestamp: sql`(${liquidityTable.timestamp} - ${liquidityTable.timestamp} % 36e5) / 1e3`,
			buy_count: max(liquidityTable.buy_count),
			buy_liquidity: sql`max(${liquidityTable.buy_liquidity}) / 1e12`,
			sell_count: max(liquidityTable.sell_count),
			sell_liquidity: sql`max(${liquidityTable.sell_liquidity}) / 1e12`,
		})
		.from(liquidityTable)
		.where(eq(liquidityTable.pair, sql.placeholder("code")))
		.orderBy(liquidityTable.timestamp)
		.groupBy(
			liquidityTable.pair,
			sql`${liquidityTable.timestamp} - ${liquidityTable.timestamp} % 36e5`,
		)
		.prepare();

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

	const liquidity = Map.groupBy(
		createLiquidityQuery().all({ code }),
		({ pair }) => pair,
	);

	const data = (liquidity.get(code) || []).map(
		({ buy_liquidity, sell_liquidity, buy_count, sell_count, timestamp }) => ({
			value: getPrice(buy_liquidity + sell_liquidity, "XMR"),
			count: buy_count + sell_count,
			time: timestamp,
		}),
	);

	return json(
		groupBars(data, interval, "greatest", {
			value: "max_liquidity",
			count: "max_offers",
			time: "period_start",
		}),
	);
};
