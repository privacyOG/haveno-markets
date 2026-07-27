<script>
import {
	HistogramSeries,
	LineSeries,
	PriceScale,
	TimeScale,
} from "svelte-lightweight-charts";
import { formatPrice } from "$lib/formatPrice";
import Tooltip from "./Tooltip.svelte";

let {
	volume = [],
	swaps = [],
	timeVisible = false,
	tooltipData = {},
} = $props();
</script>

<Tooltip
	posX={tooltipData.x}
	posY={tooltipData.y}
	date={tooltipData.date}
	{timeVisible}
>
	<table>
		<tbody>
			<tr>
				<td>Volume:</td>
				<td>{formatPrice(tooltipData.volume, "XMR", true)}</td>
			</tr>
			<tr>
				<td>Trades:</td>
				<td>{tooltipData.trades}</td>
			</tr>
		</tbody>
	</table>
</Tooltip>
<LineSeries
	data={volume}
	reactive={true}
	priceFormat={{ precision: 2, minMove: 0.01 }}
>
	<PriceScale scaleMargins={{ bottom: 0.4, top: 0.1 }} />
</LineSeries>
<HistogramSeries
	data={swaps}
	reactive={true}
	priceScaleId=""
	priceFormat={{ precision: 0, minMove: 1 }}
>
	<PriceScale scaleMargins={{ top: 0.7, bottom: 0 }} />
</HistogramSeries>
<TimeScale
	rightBarStaysOnScroll={true}
	rightOffset={0}
	{timeVisible}
	secondsVisible={false}
/>
