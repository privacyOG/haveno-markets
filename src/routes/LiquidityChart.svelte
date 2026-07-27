<script>
import {
	AreaSeries,
	HistogramSeries,
	PriceScale,
	TimeScale,
} from "svelte-lightweight-charts";
import { formatPrice, getSignificantDigits } from "$lib/formatPrice";
import Tooltip from "./Tooltip.svelte";

let {
	volume = [],
	swaps = [],
	timeVisible = false,
	tooltipData = {},
} = $props();

let precision = $derived(getSignificantDigits(volume.at(-1)?.value || 0));
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
				<td>Liquidity:</td>
				<td>{formatPrice(tooltipData.volume, "XMR", true)}</td>
			</tr>
			<tr>
				<td>Offers:</td>
				<td>{tooltipData.trades}</td>
			</tr>
		</tbody>
	</table>
</Tooltip>
<AreaSeries
	data={volume}
	reactive={true}
	priceFormat={{ minMove: 10 ** -precision, precision: precision }}
>
	<PriceScale scaleMargins={{ bottom: 0.4, top: 0.1 }} />
</AreaSeries>
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
