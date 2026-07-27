<script>
import {
	CandlestickSeries,
	LineSeries,
	PriceScale,
	TimeScale,
} from "svelte-lightweight-charts";
import { getSignificantDigits } from "$lib/formatPrice";
import { groupCandlesticks } from "$lib/getDataForChart";

let { trades, interval = "daily" } = $props();

let smaLength = $state(sessionStorage.getItem("smaLength") || 21);
let padCandles = $state(sessionStorage.getItem("padCandles") || "");

$effect(() => {
	sessionStorage.setItem("smaLength", smaLength);
});
$effect(() => {
	sessionStorage.setItem("padCandles", padCandles ? 1 : "");
});

let tradesPadded = $derived(groupCandlesticks(trades, interval, padCandles));
let sma = $derived(
	smaLength > 1 &&
		tradesPadded.map((e, i) => {
			i += 1;
			return {
				time: e.time,
				value:
					tradesPadded
						.slice(i - smaLength, i)
						.map((e) => e.close)
						.reduce((a, b) => a + b, 0) / smaLength,
			};
		}),
);

let precision = $derived(getSignificantDigits(trades.at(-1)?.close || 0));
</script>

<div id="config">
	<div>
		<label>
			<input type="number" bind:value={smaLength} min="1" />
			Moving Avg
		</label>
		<br />
		<label name="pad-candles" title="Connects and pads candlesticks">
			<input type="checkbox" bind:checked={padCandles} />
			Pad candlesticks
		</label>
	</div>
</div>

<CandlestickSeries
	data={tradesPadded}
	reactive={true}
	priceFormat={{ minMove: 10 ** -precision, precision: precision }}
>
	<PriceScale scaleMargins={{ bottom: 0.1, top: 0.2 }} />
</CandlestickSeries>
{#if smaLength > 1 && sma?.[smaLength]?.value}
	<LineSeries
		data={sma.slice(smaLength)}
		reactive={true}
		priceFormat={{ precision: 2, minMove: 0.01 }}
		lineWidth={2}
	>
		<PriceScale scaleMargins={{ bottom: 0.1, top: 0.2 }} />
	</LineSeries>
{/if}
<TimeScale
	rightBarStaysOnScroll={true}
	rightOffset={0}
	timeVisible={interval === "hourly"}
	secondsVisible={false}
/>

<style>
	#config {
		position: relative;
		width: 0px;
		z-index: 10;
		height: 0px;
		left: 0.2em;
		top: 0.2em;

		> div {
			width: max-content;
			align-items: end;
		}

		input {
			background: none;
			border: none;
			color: white;
			max-width: 3em;
			font-size: 1em;
		}
	}
</style>
