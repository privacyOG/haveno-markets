<script>
import { formatDate } from "$lib/formatPrice";

let {
	posX = "0px",
	posY = 0,
	children,
	date = 0,
	timeVisible = false,
} = $props();

const display = $derived(
	(posX === "0px" && posY === 0) || Number.isNaN(date) ? "none" : "",
);
</script>

<div id="tooltip-container" style="left:{posX};top:{posY}px;display:{display};">
	<div
		style="margin-left:1em;margin-top:1em;
		background-color:#290040b0;padding:.2em;width:12em;
		border:2px #552a64 solid;border-radius:5px;"
	>
		<span style="color:#f1482d">{formatDate(date || 0, timeVisible)}</span>
		{@render children()}
	</div>
</div>

<style>
	#tooltip-container {
		position: relative;
		height: 0px;
		width: 0px;
		z-index: 16;
		pointer-events: none;
	}
</style>
