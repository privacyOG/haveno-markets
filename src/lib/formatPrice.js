import { crypto, fiat } from "./stores";

const isMoneroQuote = (currency) => {
	return !!crypto.get(currency);
};

const getAsset = (currency) => {
	return (
		crypto.get(currency) || fiat.get(currency) || { name: "", precision: 8 }
	);
};

const getSignificantDigits = (price, minimum = 2) => {
	if (!price) return minimum;
	let i = minimum;
	while (Math.abs(price * 10 ** i) < 1000 && i < 20) {
		i++;
	}
	return i;
};

const getPrice = (
	price,
	currency = "XMR",
	round = true,
	useQuote = false,
	minimumPrecision = 2,
) => {
	const exactPrice = useQuote && isMoneroQuote(currency) ? 1 / price : price;

	if (round) {
		const precision = 10 ** getSignificantDigits(exactPrice, minimumPrecision);
		return Math.round(exactPrice * precision) / precision;
	}
	return exactPrice;
};

const formatMap = new Map();
for (let i = 0; i <= 20; i++) {
	formatMap.set(
		i,
		new Intl.NumberFormat(undefined, {
			minimumFractionDigits: i,
			maximumFractionDigits: i,
		}),
	);
}

const formatPrice = (
	price,
	currency = "XMR",
	showSign = false,
	useQuote = false,
	factor = 1,
) => {
	if (!price) return Number.NaN;
	const calculatedPrice = getPrice(price, currency, false, useQuote) * factor;
	const significantDigits = getSignificantDigits(calculatedPrice);
	return (
		(showSign
			? getAsset(factor === 1 && isMoneroQuote(currency) ? "XMR" : currency)
					.sign || ""
			: "") + formatMap.get(significantDigits).format(calculatedPrice)
	);
};

const formatDate = (date, includeTime = true) => {
	const formattedDate = new Date(date).toISOString();
	if (includeTime) {
		return formattedDate.replace("T", " ").replace(/:\d*\.\d*Z/, "");
	}
	return formattedDate.split("T")[0];
};

const paymentMethods = new Map(
	Object.entries({
		ACH_TRANSFER: "ACH",
		ADVANCED_CASH: "Advanced Cash",
		ALI_PAY: "AliPay",
		AMAZON_GIFT_CARD: "Amazon eGift Card",
		AUSTRALIA_PAYID: "PayID",
		BIZUM: "Bizum",
		BLOCK_CHAINS: "Cryptocurrencies",
		BLOCK_CHAINS_INSTANT: "Cryptocurrencies Instant",
		CAPITUAL: "Capitual",
		CASH_APP: "Cash App",
		CASH_AT_ATM: "Cardless Cash",
		CASH_DEPOSIT: "Cash Deposit",
		CELPAY: "CelPay",
		CHASE_QUICK_PAY: "Chase QuickPay",
		DOMESTIC_WIRE_TRANSFER: "Domestic Wire",
		F2F: "F2F",
		FASTER_PAYMENTS: "Faster Payments",
		HAL_CASH: "HalCash",
		IMPS: "IMPS",
		INTERAC_E_TRANSFER: "Interac e-Transfer",
		JAPAN_BANK: "Japan Furikomi",
		MONESE: "Monese",
		MONEY_BEAM: "MoneyBeam (N26)",
		MONEY_GRAM: "MoneyGram",
		NATIONAL_BANK: "National banks",
		NEFT: "NEFT",
		NEQUI: "Nequi",
		OK_PAY: "OKPay",
		PAXUM: "Paxum",
		PAYPAL: "PayPal",
		PAYSAFE: "Paysafe",
		PAYSERA: "Paysera",
		PAYTM: "PayTM",
		PAY_BY_MAIL: "Pay By Mail",
		PERFECT_MONEY: "Perfect Money",
		PIX: "Pix",
		POPMONEY: "Popmoney",
		PROMPT_PAY: "PromptPay",
		REVOLUT: "Revolut",
		RTGS: "RTGS",
		SAME_BANK: "Same bank",
		SATISPAY: "Satispay",
		SEPA: "SEPA",
		SEPA_INSTANT: "SEPA Instant",
		SPECIFIC_BANKS: "Specific banks",
		STRIKE: "Strike",
		SWIFT: "SWIFT",
		SWISH: "Swish",
		TIKKIE: "Tikkie",
		TRANSFERWISE: "TransferWise",
		TRANSFERWISE_USD: "TransferWise-USD",
		UPHOLD: "Uphold",
		UPI: "UPI",
		US_POSTAL_MONEY_ORDER: "US Money Order",
		VENMO: "Venmo",
		VERSE: "Verse",
		WECHAT_PAY: "WeChat Pay",
		WESTERN_UNION: "Western Union",
		ZELLE: "Zelle",
	}),
);

const formatPaymentMethod = (paymentMethod) => {
	return paymentMethods.get(paymentMethod) || paymentMethod;
};

export {
	formatDate,
	formatPaymentMethod,
	formatPrice,
	getAsset,
	getPrice,
	getSignificantDigits,
	isMoneroQuote,
};
