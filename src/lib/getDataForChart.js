import { getPrice } from "$lib/formatPrice";

const processCandlesticks = (trades, interval, padCandlesticks, lastTime) => {
	let prevClose;

	const candlestickLoopIteration = (intervalDate) => {
		const currentTrades = trades.getOrInsertComputed(intervalDate, () => ({
			time: intervalDate,
			open: prevClose,
			close: prevClose,
			high: prevClose,
			low: prevClose,
		}));

		if (!currentTrades.open) {
			trades.set(
				intervalDate,
				currentTrades.reduce((a, c) => {
					if (c.value) {
						c = { open: c.value, close: c.value, high: c.value, low: c.value };
					}
					return {
						time: intervalDate,
						open: a.open ?? c.open,
						close: c.close,
						high: Math.max(c.high, a.high ?? c.high),
						low: Math.min(c.low, a.low ?? c.low),
					};
				}, {}),
			);
		}

		const currentCandlestick = trades.get(intervalDate);
		if (padCandlesticks && prevClose) currentCandlestick.open = prevClose;
		prevClose = currentCandlestick.close;
	};

	if (!padCandlesticks) {
		for (const intervalDate of trades.keys()) {
			candlestickLoopIteration(intervalDate);
		}
	} else {
		for (const intervalDate of intervalIter(
			trades.keys().next().value,
			interval,
			lastTime,
		)) {
			candlestickLoopIteration(intervalDate);
		}
	}
	return padCandlesticks
		? Array.from(trades.values()).toSorted((a, b) => a.time - b.time)
		: Array.from(trades.values());
};

const candlestick = (data, interval, padCandlesticks = false) => {
	const trades = Map.groupBy(data, ({ time }) => intervals.get(interval)(time));
	return processCandlesticks(
		trades,
		interval,
		padCandlesticks,
		(data.at(0)?.time || Date.now()) / 1e3,
	);
};

const groupCandlesticks = (data, interval, padCandlesticks = false) => {
	if (interval === "hourly" && !padCandlesticks) return data;
	if (data.length > 1 && data[0].time > data[1].time) data.reverse();
	const trades = Map.groupBy(data, ({ time }) =>
		intervals.get(interval)(time * 1e3),
	);
	return processCandlesticks(
		trades,
		interval,
		padCandlesticks,
		data.at(-1)?.time || Date.now(),
	);
};

const groupBars = (
	data,
	interval,
	operation = "greatest",
	names = { value: "value", count: "count", time: "time" },
) => {
	const trades = Map.groupBy(data, ({ time }) =>
		intervals.get(interval)(time * 1e3),
	);
	for (const intervalDate of trades.keys()) {
		trades.set(
			intervalDate,
			trades.get(intervalDate).reduce(
				(a, c) => {
					switch (operation) {
						case "greatest":
							return {
								[names.value]:
									a[names.value] > c.value ? a[names.value] : c.value,
								[names.count]:
									a[names.count] > c.count ? a[names.count] : c.count,
							};
						// case "add":
						default:
							return {
								[names.value]: getPrice(a[names.value] + c.value, "XMR"),
								[names.count]: a[names.count] + (c.count || 1),
							};
					}
				},
				{ [names.value]: 0, [names.count]: 0 },
			),
		);
		trades.get(intervalDate)[names.time] = +intervalDate;
	}
	return Array.from(trades.values());
};

const intervals = new Map(
	Object.entries({
		hourly: (time) => (time - (time % 36e5)) / 1e3,
		daily: (time) => (time - (time % 864e5)) / 1e3,
		weekly: (time) => {
			const timeMonday = time + 1e3 * 60 * 60 * 24 * 3; // reset to monday
			return (time - (timeMonday % 6048e5)) / 1e3;
		},
		monthly: (time) => {
			return (
				Date.UTC(new Date(time).getFullYear(), new Date(time).getMonth()) / 1e3
			);
		},
		yearly: (time) => {
			return Date.UTC(new Date(time).getFullYear()) / 1e3;
		},
	}),
);

const intervalIter = function* (start, interval, lastTime) {
	let currentInterval = intervals.get(interval)(start * 1e3);
	while (currentInterval <= lastTime) {
		yield currentInterval;
		let diff = 36e2;
		switch (interval) {
			case "daily":
				diff *= 24;
				break;
			case "weekly":
				diff *= 24 * 7;
				break;
			case "monthly": {
				let month = new Date(currentInterval * 1e3);
				month = Date.UTC(month.getFullYear(), month.getMonth() + 1);
				currentInterval = +month / 1e3;
				diff = 0;
				break;
			}
			case "yearly": {
				let year = new Date(currentInterval * 1e3);
				year = Date.UTC(year.getFullYear() + 1);
				currentInterval = +year / 1e3;
				diff = 0;
				break;
			}
			default:
		}
		currentInterval += diff;
	}
	return currentInterval;
};

export { candlestick, groupBars, groupCandlesticks, intervals };
