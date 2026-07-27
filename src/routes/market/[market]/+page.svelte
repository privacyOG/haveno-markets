<script>
import { CrosshairMode } from "lightweight-charts";
import { page } from "$app/stores";
import {
	formatDate,
	formatPaymentMethod,
	formatPrice,
	getAsset,
	isMoneroQuote,
} from "$lib/formatPrice";
import { groupBars } from "$lib/getDataForChart";
import ChartContainer from "../../ChartContainer.svelte";
import Head from "../../Head.svelte";
import LiquidityChart from "../../LiquidityChart.svelte";
import PriceChart from "../../PriceChart.svelte";
import RadioButton from "../../RadioButton.svelte";
import VolumeChart from "../../VolumeChart.svelte";
import Offers from "./Offers.svelte";

const market = $page.params.market;
let { data } = $props();
let interval = $state("daily");
let dataSource = $state("price");
let offersOverall = $state([]);
let liquidity = $state([]);
let volumeSource = $state([]);
let numTrades = $state([]);
let priceHistory = $state([]);

let w = $state();

const marketPair = isMoneroQuote(market) ? `${market}/XMR` : `XMR/${market}`;
const BUY_SELL = isMoneroQuote(market) ? ["SELL", "BUY"] : ["BUY", "SELL"];

let showOrders = $state(false);

let volume = $derived(
	interval && dataSource === "volume"
		? groupBars(volumeSource, interval, "add")
		: groupBars(liquidity, interval),
);
let swaps = $derived(
	interval && dataSource === "volume"
		? groupBars(numTrades, interval, "add")
		: groupBars(offersOverall, interval),
);

let tooltipData = $state({});

$effect(async () => {
	if (dataSource === "liquidity") {
		const res = await fetch(`/api/v1/liquidity/${market}?interval=hourly`);
		const json = await res.json();
		offersOverall = json.map((e) => ({
			time: e.period_start,
			value: e.max_offers,
		}));
		liquidity = json.map((e) => ({
			time: e.period_start,
			value: e.max_liquidity,
		}));
	} else if (dataSource === "volume") {
		const res = await fetch(`/api/v1/volumes/${market}?interval=hourly`);
		const json = await res.json();
		volumeSource = json.map((e) => ({
			time: e.period_start,
			value: e.volume,
		}));
		numTrades = json.map((e) => ({
			time: e.period_start,
			value: e.num_trades,
		}));
	} else if (dataSource === "price") {
		const res = await fetch(`/api/v1/hloc/${market}?interval=hourly`);
		const json = await res.json();
		priceHistory = json.map((e) =>
			Object.assign(e, {
				time: e.period_start,
				period_start: undefined,
			}),
		);
	}
});
</script>

<svelte:head>
	<Head
		title="{marketPair} - Haveno Markets"
		description="See price history, current buy/sell offers, and latest trades for the {marketPair} market on Haveno."
	/>
</svelte:head>

<div class="row">
	<div class="col card" bind:clientWidth={w}>
		<h4>{getAsset(market).name} - {marketPair}</h4>
		<div class="row card-header" style="justify-content:space-between;">
			<RadioButton
				bind:selectedOption={dataSource}
				name="data-source"
				options={["Price", "Volume", "Liquidity"]}
				justifyContent="start"
			/>
			<span class="price" style="text-align:center"
				>{formatPrice(data.trades?.at(-1)?.price, market, true) || "-"}</span
			>
			<RadioButton
				bind:selectedOption={interval}
				name="interval"
				options={["Hourly", "Daily", "Weekly", "Monthly", "Yearly"]}
				justifyContent="end"
			/>
		</div>
		<ChartContainer
			{w}
			height={480}
			bind:tooltipData
			crosshairMode={dataSource === "price"
				? CrosshairMode.Magnet
				: CrosshairMode.Normal}
		>
			{#await volume then volume}
				{#await swaps then swaps}
					{#if dataSource === "price"}
						<PriceChart trades={priceHistory} {interval} />
					{:else if dataSource === "volume"}
						<VolumeChart
							{volume}
							{swaps}
							timeVisible={interval === "hourly"}
							{tooltipData}
						/>
					{:else if dataSource === "liquidity"}
						<LiquidityChart
							{volume}
							{swaps}
							timeVisible={interval === "hourly"}
							{tooltipData}
						/>
					{/if}
				{/await}
			{/await}
		</ChartContainer>
	</div>
</div>
<div class="row">
	<Offers
		offers={Object.values(data.offers[BUY_SELL[0]])?.toSorted(
			(a, b) => b[0].price - a[0].price,
		)}
		{market}
		title="Buy Offers"
		{showOrders}
	/>
	<Offers
		offers={Object.values(data.offers[BUY_SELL[1]])?.toSorted(
			(a, b) => a[0].price - b[0].price,
		)}
		{market}
		title="Sell Offers"
		{showOrders}
	/>
</div>
<div class="row">
	<div class="col">
		<input type="checkbox" id="showOffers" bind:checked={showOrders} />
		<label for="showOffers">Show Individual Offers?</label>
	</div>
</div>
<div class="row">
	<div class="col card">
		<h4>Latest Trades</h4>
		<table>
			<thead>
				<tr>
					<th>Date</th>
					<th class="payment-method">Payment Method</th>
					<th>Price</th>
					<th>Amount (XMR)</th>
					<th>Amount ({market})</th>
				</tr>
			</thead>
			<tbody>
				{#each data.trades.toReversed() as trade}
					<tr>
						<td>{formatDate(trade.date)}</td>
						<td class="payment-method"
							>{formatPaymentMethod(trade.paymentMethod)}</td
						>
						<td>{formatPrice(trade.price, trade.currency)}</td>
						<td>{formatPrice(trade.xmrAmount, "XMR")}</td>
						<td>{formatPrice(trade.amount, trade.currency)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	.card-header {
		margin-bottom: 0.4em;
	}
	.payment-method {
		text-align: left !important;
	}
	@media only screen and (max-width: 600px) {
		.payment-method {
			display: none;
		}
	}
</style>
