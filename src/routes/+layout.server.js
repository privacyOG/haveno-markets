import { priceIndex } from "$lib/server/context";
import { crypto, fiat } from "$lib/stores";

export function load({ cookies }) {
	const displayCurrency = cookies.get("display_currency") || "XMR";
	return {
		crypto,
		fiat,
		displayCurrency,
		priceIndex: priceIndex.get(displayCurrency).value,
	};
}
