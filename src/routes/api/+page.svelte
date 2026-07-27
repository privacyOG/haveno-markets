<script>
import { intervals } from "$lib/getDataForChart";
import Head from "../Head.svelte";
import Route from "./Route.svelte";

let { data } = $props();

const args = {
	network: {
		name: "network",
		default: "reto",
		possibleValues: data.networks,
		explanation: "Which Haveno network to get data from.",
	},
	pair: {
		name: "pair",
		value: "XMR_USD",
		possibleValues: data.pairs,
		required: true,
		explanation: "Which trading pair to request data for.",
	},
};
</script>

<svelte:head>
	<Head
		title="API Docs - Haveno Markets"
		description="Public API documentation for Haveno by haveno.markets: get info on recent trades, current offers and more"
	/>
</svelte:head>

<div class="row">
	<div class="col card">
		<h4>Documentation</h4>
		<div class="docs">
			<Route
				method="GET"
				description="Get all available Haveno networks"
				route="/api/v1/networks"
			/>

			<Route
				method="GET"
				description="Get all available currencies"
				route="/api/v1/currencies"
				args={[args.network]}
			/>

			<Route
				method="GET"
				description="Get 24h or 7d market overview"
				route="/api/v1/tickers"
				args={[
					args.network,
					{
						name: "time_period",
						optional: true,
						default: "24h",
						possibleValues: ["24h", "7d"],
						explanation: "Time period for the market overview.",
					},
				]}
			/>

			<Route
				method="GET"
				description="Get candlestick data"
				route={"/api/v1/hloc/{pair}"}
				args={[
					args.pair,
					{
						name: "interval",
						default: "monthly",
						possibleValues: intervals.keys(),
						explanation: "Interval to group the candlestick data in.",
					},
					args.network,
				]}
			/>

			<Route
				method="GET"
				description="Get available liquidity by pair"
				route={"/api/v1/depth/{pair}"}
				args={[
					args.pair,
					{
						name: "level",
						optional: true,
						default: 1,
						possibleValues: [1, 2],
						explanation:
							"Level of detail for liquidity data:<br>1: Only amounts and prices<br>2: Individual offers with specific offer data",
					},
					args.network,
				]}
			/>

			<Route
				method="GET"
				description="Get recent trades by pair"
				route={"/api/v1/trades/{pair}"}
				args={[
					args.pair,
					{
						name: "limit",
						default: 0,
						explanation: "Amount of trades to return.<br>0 is 24h timespan!",
					},
					args.network,
				]}
			/>

			<Route
				method="GET"
				description="Get historical volume data"
				route={"/api/v1/volumes/{pair}"}
				args={[
					Object.assign(args.pair, { required: false }),
					{
						name: "interval",
						default: "monthly",
						possibleValues: intervals.keys(),
						explanation: "Interval to group the volume data in.",
					},
					args.network,
				]}
			/>

			<Route
				method="GET"
				description="Get historical liquidity data"
				route={"/api/v1/liquidity/{pair}"}
				args={[
					Object.assign(args.pair, { required: false }),
					{
						name: "interval",
						default: "monthly",
						possibleValues: intervals.keys(),
						explanation: "Interval to group the liquidity data in.",
					},
					args.network,
				]}
			/>
		</div>
	</div>
</div>

<style>
	.docs {
		width: 100%;
	}
</style>
