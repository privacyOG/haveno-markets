<script>
import { CrosshairMode } from "lightweight-charts";
import { Chart } from "svelte-lightweight-charts";

let {
	w = 20,
	height = 300,
	children,
	tooltipData = $bindable({}),
	crosshairMode = CrosshairMode.Normal,
} = $props();

const crosshairLayout = $derived({
	mode: crosshairMode,
});
const chartLayout = {
	background: {
		color: "#090020",
	},
	textColor: "#f6efff",
};
const gridLayout = {
	vertLines: {
		visible: false,
	},
	horzLines: {
		color: "#FFF5",
	},
};
const crosshairMove = (e) => {
	const param = e.detail;
	let [volume, trades] = [...param.seriesData.values()].map((e) => e.value);
	let x = `${param?.point?.x || 0}px`;
	if (param?.point?.x > w / 2 - 20) {
		// substract full tooltip width
		x = `calc(${x} - 14.4em - 4px)`;
	}
	tooltipData = {
		x,
		y: param?.point?.y || 0,
		date: param.time * 1e3,
		volume,
		trades,
	};
};
</script>

<noscript style:position="absolute">
	JavaScript is required to display charts.
</noscript>
<Chart
	width={w - 20}
	{height}
	container={{ class: "row" }}
	layout={chartLayout}
	grid={gridLayout}
	crosshair={crosshairLayout}
	on:crosshairMove={crosshairMove}
>
	{@render children()}
</Chart>
