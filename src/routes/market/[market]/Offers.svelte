<script>
import { formatPaymentMethod, formatPrice } from "$lib/formatPrice";

let { offers = [], market, title, showOrders } = $props();
const offersValues = $derived(Object.values(offers));
</script>

<div class="col card" style="--text-align: {showOrders ? 'left' : 'right'};">
	<h4>{title}</h4>
	<span style="width:100%;overflow:scroll;">
		<table style="text-wrap:nowrap;">
			<thead>
				<tr>
					<th>Price</th>
					{#if showOrders}<th>Payment Method</th>{/if}
					<th>Amount (XMR)</th>
					<th>Amount ({market})</th>
				</tr>
			</thead>
			<tbody>
				{#if !showOrders}
					{#each offersValues as offer}
						<tr>
							<td>{formatPrice(offer[0].price, market)}</td>
							<td
								>{formatPrice(
									offer.reduce((a, b) => a + b.amount, 0),
									"XMR",
								)}</td
							>
							<td
								>{formatPrice(
									offer.reduce((a, b) => a + b.primaryMarketAmount, 0),
									market,
								)}</td
							>
						</tr>
					{/each}
				{:else}
					{#each offersValues.flat() as offer}
						<tr>
							<td>{formatPrice(offer.price, market)}</td>
							<td>{formatPaymentMethod(offer.paymentMethod)}</td>
							<td style="">
								{#if offer.minAmount < offer.amount}
									{formatPrice(offer.minAmount, "XMR")}
									- {formatPrice(offer.amount, "XMR")}
								{:else}
									{formatPrice(offer.amount, "XMR")}
								{/if}
							</td>
							<td style="">
								{#if offer.primaryMarketMinAmount < offer.primaryMarketAmount}
									{formatPrice(offer.primaryMarketMinAmount, market)}
									- {formatPrice(offer.primaryMarketAmount, market)}
								{:else}
									{formatPrice(offer.primaryMarketAmount, market)}
								{/if}
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
			<tfoot>
				<tr>
					<td>{offersValues.flat().reduce((a, b) => a + 1, 0)} Offers</td>

					{#if showOrders}<td></td>{/if}
					<td
						>{formatPrice(
							offersValues.flat().reduce((a, b) => a + b.amount, 0),
							"XMR",
						) || ""}</td
					>
					<td
						>{formatPrice(
							offersValues
								.flat()
								.reduce((a, b) => a + b.primaryMarketAmount, 0),
							market,
						) || ""}</td
					>
				</tr>
			</tfoot>
		</table>
	</span>
</div>

<style>
	td,
	th {
		&:nth-child(2) {
			text-align: var(--text-align);
		}
	}
</style>
