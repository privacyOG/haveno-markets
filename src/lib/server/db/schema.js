import {
	integer,
	real,
	sqliteTable,
	text,
	unique,
} from "drizzle-orm/sqlite-core";

export const liquidityTable = sqliteTable(
	"liquidity",
	{
		pair: text(5),
		buy_count: integer(),
		buy_liquidity: integer(),
		sell_count: integer(),
		sell_liquidity: integer(),
		network: integer(),
		timestamp: integer(),
		newest: integer(),
	},
	(t) => ({
		first: unique("prevent_duplicates").on(
			t.pair,
			t.buy_count,
			t.buy_liquidity,
			t.sell_count,
			t.sell_liquidity,
			t.network,
			t.newest,
		),
	}),
);

export const priceIndexTable = sqliteTable(
	"priceIndex",
	{
		pair: text(5).notNull(),
		price: real().notNull(),
		timestamp: integer().notNull(),
		newest: integer().notNull(),
	},
	(t) => ({
		first: unique("prevent_duplicates_price").on(t.pair, t.price, t.newest),
	}),
);
