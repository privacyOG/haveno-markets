<script>
import { CrosshairMode } from "lightweight-charts";
import { onMount } from "svelte";
import {
	formatDate,
	formatPrice,
	getAsset,
	getPrice,
	isMoneroQuote,
} from "$lib/formatPrice";
import ChartContainer from "./ChartContainer.svelte";
import Head from "./Head.svelte";
import PriceChart from "./PriceChart.svelte";
import VolumeChart from "./VolumeChart.svelte";

let { data } = $props();
let priceHistory = $state([]);
let volume = $state([]);
let swaps = $state([]);

let w = $state();
let tooltipData = $state({});
onMount(async () => {
	const res1 = await fetch(`/api/v1/hloc/XMR_USD?interval=daily`);
	const json1 = await res1.json();
	priceHistory = json1.map((e) =>
		Object.assign(e, { time: e.period_start, period_start: undefined }),
	);
	const res = await fetch(`/api/v1/volumes?interval=daily`);
	const json = await res.json();
	volume = json.map((e) => ({
		time: e.period_start,
		value: e.volume,
	}));
	swaps = json.map((e) => ({
		time: e.period_start,
		value: e.num_trades,
	}));
});
</script>

<svelte:head>
	<Head
		title="Haveno Markets"
		description="Price, liquidity, and trade statistics for Haveno, the Monero-centered P2P decentralized exchange platform."
	/>
</svelte:head>

<div class="row">
	<div class="col card" bind:clientWidth={w}>
		<h4>XMR/USD</h4>
		<span class="price"
			>{formatPrice(
				data.markets.find((e) => e.currency === "USD").price,
				"USD",
				true,
				true,
			)}</span
		>
	</div>
	<div class="col card">
		<h4>Liquidity</h4>
		<span class="price"
			>{formatPrice(
				data.liquidity,
				data.displayCurrency,
				true,
				false,
				getPrice(data.priceIndex, data.displayCurrency),
			) || "-"}</span
		>
	</div>
</div>

<div class="row">
	<div class="col card" style="flex:1;">
		<h4>Price XMR/USD</h4>
		<ChartContainer {w} height={300} crosshairMode={CrosshairMode.Magnet}>
			<PriceChart trades={priceHistory} />
		</ChartContainer>
	</div>
	<div class="col card" style="flex:1">
		<h4>Daily Volume</h4>
		<ChartContainer {w} height={300} bind:tooltipData>
			<VolumeChart {volume} {swaps} {tooltipData} />
		</ChartContainer>
	</div>
</div>
<div class="row">
	<div class="card col">
		<h4>Markets</h4>
		<table>
			<thead>
				<tr>
					<th>Currency</th>
					<th>Price</th>
					<th>Trades (30d)</th>
				</tr>
			</thead>
			<tbody>
				{#each data.markets as market}
					<tr>
						<td
							><a href="market/{market.currency}"
								>{getAsset(market.currency).name} ({market.currency})</a
							></td
						>
						<td
							>{formatPrice(
								market.price,
								isMoneroQuote(market.currency)
									? data.displayCurrency
									: market.currency,
								true,
								false,
								isMoneroQuote(market.currency) ? data.priceIndex : 1,
							)}</td
						>
						<td>{market.tradeCount["30d"]}</td>
					</tr>
				{/each}
			</tbody>
		</table>
		<h4><a href="markets">View more »</a></h4>
	</div>
	<div class="card col">
		<h4>Trades</h4>
		<table>
			<thead>
				<tr>
					<th>Date</th>
					<th>Amount (XMR)</th>
					<th>Amount</th>
				</tr>
			</thead>
			<tbody>
				{#each data.latestTrades as trade}
					<tr>
						<td>{formatDate(trade.date)}</td>
						<td>{formatPrice(trade.xmrAmount, "XMR")}</td>
						<td
							>{formatPrice(trade.amount, trade.currency)}
							<span class="trade-currency">{trade.currency}</span></td
						>
					</tr>
				{/each}
			</tbody>
		</table>
		<h4><a href="markets">View more »</a></h4>
	</div>
</div>
