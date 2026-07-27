import { crypto, fiat } from "$lib/stores";

export function load({ data }) {
	data.crypto.forEach((v, k) => {
		crypto.set(k, v);
	});
	data.fiat.forEach((v, k) => {
		fiat.set(k, v);
	});
	return { displayCurrency: data.displayCurrency, priceIndex: data.priceIndex };
}
