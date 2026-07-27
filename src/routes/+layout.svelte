<script>
import { invalidateAll } from "$app/navigation";

Map.prototype.getOrInsertComputed ||= function (key, factoryFn) {
	if (!this.has(key)) {
		const computedValue = factoryFn();
		this.set(key, computedValue);
		return computedValue;
	}
	return this.get(key);
};

let { children, data } = $props();

let displayCurrency = $state(data.displayCurrency);

$effect(() => {
	if (data.displayCurrency !== displayCurrency) {
		document.cookie = `display_currency=${displayCurrency}`;
		data.displayCurrency = displayCurrency;
		invalidateAll();
	}
});
</script>

<div class="col app">
	<div class="row header">
		<div class="container" style="width:100%">
			<a href="/"
				><img src="/haveno-markets_logo.svg" alt="" style="height:2em;" /></a
			>
			<a href="/">haveno.markets</a>
			|
			<a href="/api">api</a>
			|
			<select bind:value={displayCurrency}>
				<option>XMR</option>
				<option>USD</option>
				<option>EUR</option>
				<option>BTC</option>
				<option>ETH</option>
			</select>
			<span class="extra-links">
				<span style="margin-left:auto;">
					<img
						src="/haveno_logo.png"
						alt=""
						style="height:1em;vertical-align:middle;"
					/>
					<a href="https://haveno.exchange">haveno.exchange</a>
				</span>
				|
				<span>
					<img
						src="/monero_logo.png"
						alt=""
						style="height:1em;vertical-align:middle;"
					/>
					<a href="https://xmrchain.net">xmrchain.net</a>
				</span>
			</span>
		</div>
	</div>
	<div class="col container">
		{@render children()}
	</div>
	<div class="col footer">
		<span>
			Links:
			<a href={import.meta.env.VITE_CLEARNET_URL}>Clearnet</a>
			|
			<a href={import.meta.env.VITE_ONION_URL}>Tor</a>
			|
			<a href={import.meta.env.VITE_I2P_URL}>I2P</a>
			<a href={import.meta.env.VITE_I2P_B32_URL}>(b32)</a>
			|
			<a href={import.meta.env.VITE_GIT_URL}>git</a>
		</span>
		<span class="extra-links">
			<span style="display:flex;gap:.2em;">
				Data from:
				<a
					href="https://retoswap.com"
					style="display:inline-flex;gap:.2em;align-items:center;"
				>
					<img src="/retoswap_logo.svg" alt="" style="height:1em;width:1em;" />
					Retoswap
				</a>
			</span>
			<span>
				Donations:
				<a
					style="word-break:break-all;"
					href="monero:{import.meta.env.VITE_XMR_DONATION_ADDRESS}"
				>
					{import.meta.env.VITE_XMR_DONATION_ADDRESS}
				</a>
			</span>
		</span>
	</div>
</div>

<style lang="scss" global>
	html {
		font-family: sans-serif;
	}
	.app {
		display: flex;
		width: 100%;
		justify-content: center;
		min-height: 100dvh;
	}
	.container {
		min-width: 80%;
		max-width: 1440px;
	}
	.header {
		background-color: #5555;
		padding: 0.5em 0;
	}
	.footer {
		background-color: #4444;
		margin-top: auto;
		text-align: center;
	}
	.col,
	.force-col {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}
	.row,
	.force-row {
		display: flex;
		flex-direction: row;
		width: 100%;
		height: 100%;
		justify-content: space-around;
	}
	body {
		background-color: #290040;
		color: white;
		margin: 0;
		padding: 0;
	}
	.card {
		margin: 1em;
		padding: 0.5em;
		background-color: #552a64;
		border-radius: 5px;
		:global(h4) {
			text-align: center;
			color: #f1482d;
		}
		table {
			width: 100%;
			border-collapse: collapse;
			th,
			td {
				text-align: right;
				padding: 0.3em;
			}
			th:first-child,
			td:first-child {
				text-align: left;
			}
			tbody tr:nth-child(odd) {
				background-color: #0002;
			}
			tfoot {
				border-top: #0004 double 4px;
			}
		}
	}

	a,
	.price {
		text-decoration: none;
		color: #f60;
	}
	a:hover {
		text-decoration: underline;
	}
	.price {
		font-size: 2em;
		margin-bottom: 0.4em;
	}
	h4 {
		margin: 0.4em;
	}
	.trade-currency {
		font-size: 1em;
		color: #fff6;
		font-weight: bold;
		font-family: monospace;
	}
	.header > .container {
		display: flex;
		align-items: center;
		flex-direction: row;
		gap: 0.5em;
	}
	.header > .container > :first-child {
		margin-left: 1em;
	}
	.header > .container > :last-child {
		margin-right: 1em;
	}
	select,
	option {
		appearance: none;
		background-color: #290040;
		border: #fffe solid 2px;
		border-radius: 5px;
		color: white;
		font-weight: bold;
		padding: 2px;
	}
	.extra-links {
		display: contents;
		> :last-child {
			margin-right: 1em;
		}
	}

	@media only screen and (max-width: 600px) {
		.row {
			flex-direction: column;
		}
		.container {
			width: 97% !important;
		}
		.card {
			margin: 0.5em 0;
			padding: 0.5em 0;
		}
		.header {
			padding: 0.2em 0;
		}
		.header > * {
			width: initial;
		}
		.extra-links {
			display: none;
		}
	}
</style>
