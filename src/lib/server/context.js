import chokidar from "chokidar";
import { and, eq, notInArray, sql } from "drizzle-orm";
import { building } from "$app/environment";
import { getPrice, isMoneroQuote } from "$lib/formatPrice";
import { candlestick, groupBars } from "$lib/getDataForChart";
import { crypto, fiat } from "$lib/stores";
import { db } from "./db";
import { liquidityTable, priceIndexTable } from "./db/schema";

const files = {
	offers: "offers_statistics.json",
	trades: "trade_statistics.json",
	crypto: "crypto_currency_list.json",
	fiat: "traditional_currency_list.json",
};

for (const file in files) {
	files[file] = import.meta.env.VITE_DB_PATH + files[file];
}

const formatCrypto = (e) => {
	const xmr = e[e.findIndex((e) => e.code === "XMR")];
	xmr.sign = "ɱ";
	xmr.precision = 12;
	e[e.findIndex((e) => e.code === "BTC")].sign = "₿";
	e[e.findIndex((e) => e.code === "ETH")].sign = "Ξ";
	e.forEach((e) => {
		crypto.set(e.code, e);
	});
};
const formatFiat = (e) => {
	e[e.findIndex((e) => e.code === "USD")].sign = "$";
	e[e.findIndex((e) => e.code === "EUR")].sign = "€";
	e[e.findIndex((e) => e.code === "GBP")].sign = "£";
	e[e.findIndex((e) => e.code === "AUD")].sign = "$";
	e[e.findIndex((e) => e.code === "CAD")].sign = "$";
	e[e.findIndex((e) => e.code === "SEK")].sign = "kr";
	e[e.findIndex((e) => e.code === "BRL")].sign = "R$";
	e[e.findIndex((e) => e.code === "INR")].sign = "₹";
	e[e.findIndex((e) => e.code === "NZD")].sign = "$";
	e[e.findIndex((e) => e.code === "CHF")].sign = "Fr";
	e[e.findIndex((e) => e.code === "CNY")].sign = "¥";
	e[e.findIndex((e) => e.code === "CZK")].sign = "Kč";
	e[e.findIndex((e) => e.code === "PLN")].sign = "zł";
	e[e.findIndex((e) => e.code === "THB")].sign = "฿";
	e[e.findIndex((e) => e.code === "TRY")].sign = "₺";
	e[e.findIndex((e) => e.code === "HUF")].sign = "Ft";
	e[e.findIndex((e) => e.code === "IDR")].sign = "Rp";
	e[e.findIndex((e) => e.code === "KRW")].sign = "₩";
	e[e.findIndex((e) => e.code === "MYR")].sign = "RM";
	e[e.findIndex((e) => e.code === "PHP")].sign = "₱";
	e[e.findIndex((e) => e.code === "RON")].sign = "lei";
	e[e.findIndex((e) => e.code === "RUB")].sign = "₽";
	e[e.findIndex((e) => e.code === "UAH")].sign = "₴";
	e[e.findIndex((e) => e.code === "MXN")].sign = "$";
	e[e.findIndex((e) => e.code === "JPY")].sign = "¥";
	e.forEach((e) => {
		fiat.set(e.code, e);
	});
};

const groupedOffers = new Map();
const groupOffers = (allOffers) => {
	for (const currencyCode of Iterator.concat(crypto.keys(), fiat.keys())) {
		let offerGroup = { BUY: [], SELL: [] };
		if (allOffers.get(currencyCode)?.length > 0) {
			offerGroup = Object.groupBy(
				allOffers.get(currencyCode),
				({ direction }) => direction,
			);
			offerGroup.BUY = offerGroup.BUY
				? Object.groupBy(offerGroup.BUY, ({ price }) => price)
				: [];
			offerGroup.SELL = offerGroup.SELL
				? Object.groupBy(offerGroup.SELL, ({ price }) => price)
				: [];
		}
		groupedOffers.set(currencyCode, offerGroup);
	}
};

const markets = [];
const getMarket = (currency, add = true) =>
	markets.find((f) => currency === f.currency) ||
	(add &&
		markets[
			markets.push({
				currency,
				price: 0,
				offerCount: 0,
				offerLiquidity: 0,
				totalVolume: { all: 0, "7d": 0, "30d": 0 },
				tradeCount: { all: 0, "7d": 0, "30d": 0 },
			}) - 1
		]);

const calculateLiquidity = async () => {
	const liq = {};
	for (const [currency, offerGroup] of groupedOffers) {
		liq[currency] = {};
		liq[currency].BUY = Object.values(offerGroup.BUY)
			.flat()
			.reduce((a, b) => a + Number.parseInt(b.amount * 1e12, 10), 0);
		liq[currency].BUY_COUNT = Object.values(offerGroup.BUY).flat().length;
		liq[currency].SELL = Object.values(offerGroup.SELL)
			.flat()
			.reduce((a, b) => a + Number.parseInt(b.amount * 1e12, 10), 0);
		liq[currency].SELL_COUNT = Object.values(offerGroup.SELL).flat().length;
		if (
			liq[currency].BUY_COUNT + liq[currency].SELL_COUNT > 0 ||
			getMarket(currency, false)
		) {
			Object.assign(getMarket(currency), {
				offerCount: liq[currency].BUY_COUNT + liq[currency].SELL_COUNT,
				offerLiquidity: getPrice(
					(liq[currency].BUY + liq[currency].SELL) / 1e12,
					"XMR",
				),
			});
		}
	}
	const timestamp = Date.now();
	liq["*"] = {};
	liq["*"].BUY = Object.values(liq).reduce(
		(a, b) => a + (Number.parseInt(b.BUY, 10) || 0),
		0,
	);
	liq["*"].BUY_COUNT = Object.values(liq).reduce(
		(a, b) => a + (Number.parseInt(b.BUY_COUNT, 10) || 0),
		0,
	);
	liq["*"].SELL = Object.values(liq).reduce(
		(a, b) => a + (Number.parseInt(b.SELL, 10) || 0),
		0,
	);
	liq["*"].SELL_COUNT = Object.values(liq).reduce(
		(a, b) => a + (Number.parseInt(b.SELL_COUNT, 10) || 0),
		0,
	);
	const returned = await db
		.insert(liquidityTable)
		.values(
			Object.entries(liq).map(([pair, liquidity]) => {
				return {
					pair,
					buy_liquidity: liquidity.BUY,
					buy_count: liquidity.BUY_COUNT,
					sell_liquidity: liquidity.SELL,
					sell_count: liquidity.SELL_COUNT,
					network: 1,
					newest: 1,
					timestamp,
				};
			}),
		)
		.onConflictDoNothing();
	if (returned.changes > 0) {
		await db
			.update(liquidityTable)
			.set({ newest: liquidityTable.timestamp })
			.where(
				and(
					eq(liquidityTable.newest, 1),
					notInArray(
						sql`rowid`,
						db
							.select({ rowId: sql`max(rowid)` })
							.from(liquidityTable)
							.where(eq(liquidityTable.newest, 1))
							.groupBy(liquidityTable.network, liquidityTable.pair),
					),
				),
			);
	}
};

let trades = [];
let volume = [];
let groupedTrades = new Map();
const priceHistory = new Map();
const formatTrades = (e) => {
	trades = e
		.filter((_, i) => i % 2)
		.map((e) => {
			return {
				currency: e.currency,
				price: getPrice(e.tradePrice / 1e8, e.currency, true, true),
				xmrAmount: getPrice(e.tradeAmount / 1e12, "XMR"),
				amount: getPrice(e.primaryMarketTradeVolume / 1e8, e.currency),
				date: e.tradeDate,
				paymentMethod: e.paymentMethod,
			};
		})
		.toReversed();
	groupedTrades = Map.groupBy(trades, ({ currency }) => currency);
	for (const currency of groupedTrades.keys()) {
		priceHistory.set(
			currency,
			candlestick(
				groupedTrades.get(currency).map((e) => {
					return {
						value: getPrice(e.price, e.currency, true, false),
						time: e.date,
					};
				}),
				"hourly",
			),
		);
		Object.assign(getMarket(currency), {
			tradeCount: {
				all: groupedTrades.get(currency).length,
				"7d": groupedTrades
					.get(currency)
					.filter((e) => e.date > Date.now() - 6048e5).length,
				"30d": groupedTrades
					.get(currency)
					.filter((e) => e.date > Date.now() - 2592e6).length,
			},
			totalVolume: {
				all: groupedTrades.get(currency).reduce((a, b) => a + b.xmrAmount, 0),
				"7d": groupedTrades
					.get(currency)
					.filter((e) => e.date > Date.now() - 6048e5)
					.reduce((a, b) => a + b.xmrAmount, 0),
				"30d": groupedTrades
					.get(currency)
					.filter((e) => e.date > Date.now() - 2592e6)
					.reduce((a, b) => a + b.xmrAmount, 0),
			},
			price: groupedTrades.get(currency).at(-1).price,
			currency,
		});
	}
	markets.sort(
		(a, b) =>
			b.tradeCount["30d"] - a.tradeCount["30d"] ||
			b.tradeCount.all - a.tradeCount.all ||
			(b.currency < a.currency ? 1 : -1),
	);
	volume = groupBars(
		trades.map((e) => {
			return {
				value: getPrice(e.xmrAmount, "XMR"),
				time: e.date / 1e3,
			};
		}),
		"hourly",
		"add",
	);
};
const formatOffers = (e) => {
	const offers = Map.groupBy(
		e.map((e) => {
			return {
				id: e.id,
				date: e.date,
				direction: e.direction,
				currencyCode: e.currencyCode,
				price: getPrice(e.price / 1e8, e.currencyCode, true, true),
				amount: getPrice(e.amount / 1e12, "XMR"),
				minAmount: getPrice(e.minAmount / 1e12, "XMR"),
				paymentMethod: e.paymentMethod,
				primaryMarketAmount: getPrice(
					e.primaryMarketAmount / 1e8,
					e.currencyCode,
				),
				primaryMarketMinAmount: getPrice(
					e.primaryMarketMinAmount / 1e8,
					e.currencyCode,
				),
			};
		}),
		({ currencyCode }) => currencyCode,
	);
	groupOffers(offers);
	calculateLiquidity();
};

const networks = {
	reto: {
		id: "reto",
		name: "RetoSwap",
		link: "https://retoswap.com/",
		fee: {
			crypto: { maker: 0.001, taker: 0.005 },
			fiat: { maker: 0.001, taker: 0.01 },
		},
	},
};

let watcher;

const priceIndex = new Map();
const formatPriceIndex = async () => {
	try {
		const res = await fetch(
			`${import.meta.env.VITE_HAVENO_PRICENODE}/getAllMarketPrices`,
		);
		const json = await res.json();

		await db
			.insert(priceIndexTable)
			.values(
				json.data.map((e) => {
					const pair =
						e.baseCurrencyCode === "XMR"
							? e.counterCurrencyCode
							: e.baseCurrencyCode;
					return {
						pair,
						price: getPrice(e.price, "XMR", false, isMoneroQuote(pair)),
						timestamp: e.timestampSec,
						newest: 1,
					};
				}),
			)
			.onConflictDoNothing();
		await db.run(sql`
			update or ignore ${priceIndexTable} set newest = timestamp, price = cast(format('%.4g', price) AS real) where newest = 1 and
				rowid not in (select max(rowid) from ${priceIndexTable} group by pair);
		`);
		await db.run(sql`
			delete from ${priceIndexTable} where newest = 1 and
				rowid not in (select max(rowid) from ${priceIndexTable} group by pair);`);
		await db.run(sql`
			delete from ${priceIndexTable} where exists (
      			select rowid from (
                	select rowid, lag(price) over(partition by pair order by rowid) price, pair
                    from ${priceIndexTable}
				) b where priceIndex.rowid = b.rowid and priceIndex.price = b.price and priceIndex.pair = b.pair and priceIndex.newest != 1
				and priceIndex.newest in (select max(newest) from ${priceIndexTable} group by pair)
  			);
		`);
	} catch (err) {
		console.log(err);
	}
	const priceIndexResult = Map.groupBy(
		await db
			.select({
				pair: priceIndexTable.pair,
				time: sql`${priceIndexTable.newest} / 1e3`,
				value: priceIndexTable.price,
			})
			.from(priceIndexTable)
			.orderBy(priceIndexTable.timestamp),
		({ pair }) => pair,
	);
	for (const pair of priceIndexResult.keys()) {
		priceIndex.set(
			pair,
			groupBars(priceIndexResult.get(pair), "hourly").at(-1),
		);
	}
	priceIndex.set("XMR", { time: 0, value: 1 });
};

if (!building) {
	formatFiat(await Bun.file(files.fiat).json());
	formatCrypto(await Bun.file(files.crypto).json());
	formatTrades(await Bun.file(files.trades).json());
	formatOffers(await Bun.file(files.offers).json());

	watcher = chokidar
		.watch(import.meta.env.VITE_DB_PATH, {
			depth: 0,
			ignored: (path) => {
				return (
					!Object.values(files).includes(path) &&
					path !== import.meta.env.VITE_DB_PATH
				);
			},
			ignoreInitial: true,
			awaitWriteFinish: true,
		})
		.on("all", async (_, filename) => {
			const file = Bun.file(filename);
			switch (filename) {
				case files.offers:
					formatOffers(await file.json());
					break;
				case files.trades:
					formatTrades(await file.json());
					break;
				case files.crypto:
					formatCrypto(await file.json());
					break;
				case files.fiat:
					formatFiat(await file.json());
					break;
			}
		});

	await formatPriceIndex();
	setInterval(
		async () => {
			await formatPriceIndex();
		},
		15 * 60 * 1000,
	);

	process.on("SIGINT", () => {
		console.log("Closing watcher...");
		watcher.close();
		process.exit(0);
	});
} else {
	priceIndex.set("XMR", { time: 0, value: 1 });
}

export {
	groupedOffers,
	groupedTrades,
	markets,
	networks,
	priceHistory,
	priceIndex,
	trades,
	volume,
};
