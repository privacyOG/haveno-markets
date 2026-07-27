<script>
import {
	formatDate,
	formatPaymentMethod,
	formatPrice,
	getAsset,
	isMoneroQuote,
} from "$lib/formatPrice";
import { groupBars } from "$lib/getDataForChart";
import ChartContainer from "../ChartContainer.svelte";
import Head from "../Head.svelte";
import LiquidityChart from "../LiquidityChart.svelte";
import RadioButton from "../RadioButton.svelte";
import VolumeChart from "../VolumeChart.svelte";

let { data } = $props();
let interval = $state("daily");
let dataSource = $state("volume");
let volumeSource = $state([]);
let numTrades = $state([]);
let offersOverall = $state([]);
let liquidity = $state([]);

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

let w = $state();
let tooltipData = $state({});
let limit = $state("all");
let sort = $state("tradeCount");

$effect(async () => {
	if (dataSource === "liquidity" && liquidity.length === 0) {
		const res = await fetch(`/api/v1/liquidity?interval=hourly`);
		const json = await res.json();
		offersOverall = json.map((e) => ({
			time: e.period_start,
			value: e.max_offers,
		}));
		liquidity = json.map((e) => ({
			time: e.period_start,
			value: e.max_liquidity,
		}));
	} else if (dataSource === "volume" && volumeSource.length === 0) {
		const res = await fetch(`/api/v1/volumes?interval=hourly`);
		const json = await res.json();
		volumeSource = json.map((e) => ({
			time: e.period_start,
			value: e.volume,
		}));
		numTrades = json.map((e) => ({
			time: e.period_start,
			value: e.num_trades,
		}));
	}
});
</script>

<svelte:head>
	<Head
		title="Markets - Haveno Markets"
		description="See price history, current buy/sell offers, and latest trades on Haveno."
	/>
</svelte:head>

<div class="row">
	<div class="col card" style="gap:.5em;" bind:clientWidth={w}>
		<div class="row" style="justify-content:space-between; gap:.5em;">
			<div>
				<RadioButton
					bind:selectedOption={dataSource}
					options={["Volume", "Liquidity"]}
					name="data-source"
				></RadioButton>
			</div>
			<div>
				<RadioButton
					bind:selectedOption={interval}
					options={["Hourly", "Daily", "Weekly", "Monthly", "Yearly"]}
					name="interval"
				></RadioButton>
			</div>
		</div>
		<ChartContainer {w} height={480} bind:tooltipData>
			{#if dataSource === "volume"}
				<VolumeChart
					{volume}
					{swaps}
					timeVisible={interval === "hourly"}
					{tooltipData}
				/>
			{:else}
				<LiquidityChart
					{volume}
					{swaps}
					timeVisible={interval === "hourly"}
					{tooltipData}
				/>
			{/if}
		</ChartContainer>
	</div>
</div>
<div class="row">
	<div class="card col">
		<h4>Markets</h4>
		<table
			class="markets"
			style="--show-volume: {dataSource == 'volume' ? 'table-cell' : 'none'};
		--show-liquidity: {dataSource == 'liquidity' ? 'table-cell' : 'none'};"
		>
			<thead>
				<tr>
					<th>Currency</th>
					<th>Price</th>
					<th class="sort" onclick={() => (sort = "offerLiquidity")}
						><span class:selected={sort === "offerLiquidity"}>⏷</span> Liquidity
						({data.displayCurrency})</th
					>
					<th class="sort" onclick={() => (sort = "offerCount")}
						><span class:selected={sort === "offerCount"}>⏷</span> Offers</th
					>
					<th class="sort" onclick={() => (sort = "totalVolume")}
						><span class:selected={sort === "totalVolume"}>⏷</span> Volume (XMR)</th
					>
					<th class="sort" onclick={() => (sort = "tradeCount")}
						><span class:selected={sort === "tradeCount"}>⏷</span> Trades
						<select bind:value={limit} onclick={(e) => e.stopPropagation()}>
							{#each Object.keys(data.markets[0].tradeCount) as option}
								<option selected={option === limit} value={option}
									>{option}</option
								>
							{/each}
						</select>
					</th>
				</tr>
			</thead>
			<tbody>
				{#each data.markets.toSorted((a, b) => (b[sort]?.[limit] || 0) - (a[sort]?.[limit] || 0) || (b[sort] || 0) - (a[sort] || 0) || (b.currency < a.currency ? 1 : -1)) as market}
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
							) || "-"}</td
						>
						<td
							>{formatPrice(
								market.offerLiquidity,
								data.displayCurrency,
								false,
								false,
								data.priceIndex,
							) || "-"}</td
						>
						<td>{market.offerCount || "-"}</td>
						<td>{formatPrice(market.totalVolume[limit], "XMR") || "-"}</td>
						<td>{market.tradeCount[limit] || "-"}</td>
					</tr>
				{/each}
			</tbody>
			<tfoot>
				<tr>
					<td></td>
					<td></td>
					<td
						>{formatPrice(
							data.markets.reduce((a, c) => a + (c.offerLiquidity || 0), 0),
							data.displayCurrency,
							false,
							false,
							data.priceIndex,
						) || "-"}</td
					>
					<td
						>{data.markets.reduce((a, c) => a + (c.offerCount || 0), 0) ||
							"-"}</td
					>
					<td
						>{formatPrice(
							data.markets.reduce((a, c) => a + (c.totalVolume[limit] || 0), 0),
							"XMR",
						)}</td
					>
					<td
						>{data.markets.reduce(
							(a, c) => a + (c.tradeCount[limit] || 0),
							0,
						)}</td
					>
				</tr>
			</tfoot>
		</table>
	</div>
</div>
<div class="row">
	<div class="card col">
		<h4>Latest Trades</h4>
		<table>
			<thead>
				<tr>
					<th>Date</th>
					<th class="payment-method">Payment Method</th>
					<th>Price</th>
					<th>Amount (XMR)</th>
					<th>Amount</th>
				</tr>
			</thead>
			<tbody>
				{#each data.latestTrades as trade}
					<tr>
						<td>{formatDate(trade.date)}</td>
						<td class="payment-method"
							>{formatPaymentMethod(trade.paymentMethod)}</td
						>
						<td>{formatPrice(trade.price, trade.currency, true)}</td>
						<td>{formatPrice(trade.xmrAmount, "XMR")}</td>
						<td
							>{formatPrice(trade.amount, trade.currency)}
							<span class="trade-currency">{trade.currency}</span></td
						>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	.selected {
		color: #f60;
	}
	.payment-method {
		text-align: left !important;
	}
	table.markets th.sort {
		cursor: pointer;
	}
	@media only screen and (max-width: 600px) {
		table.markets {
			th,
			td {
				&:nth-child(3),
				&:nth-child(4) {
					display: var(--show-liquidity);
				}
				&:nth-child(5),
				&:nth-child(6) {
					display: var(--show-volume);
				}
			}
		}
		.payment-method {
			display: none;
		}
	}
</style>
