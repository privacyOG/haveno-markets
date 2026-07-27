<script>
let { method, description, route, args } = $props();
const scopeArgs = $state(args);
let response = $state("");
let tempRoute = $derived.by(() => {
	let tempRoute = route;
	if (scopeArgs?.length) {
		let tempArgs = [...scopeArgs];
		for (let i in tempArgs) {
			if (tempRoute.includes(`{${tempArgs[i].name}}`)) {
				tempRoute = tempRoute.replace(
					`/{${tempArgs[i].name}}`,
					tempArgs[i].value ? `/${tempArgs[i].value}` : "",
				);
				delete tempArgs[i];
			}
		}
		tempArgs = tempArgs.filter((e) => e.value);
		let params = "";
		if (tempArgs.length) {
			tempArgs = tempArgs
				.filter((e) => e.value)
				.map((e) => {
					return [e.name, e.value];
				});
			params = `?${new URLSearchParams(tempArgs)}`;
		}
		tempRoute = `${tempRoute}${params}`;
	}
	return tempRoute;
});

const tryRoute = () =>
	fetch(tempRoute).then((res) =>
		res
			.json()
			.then((e) => {
				response = JSON.stringify(e, null, 2);
			})
			.catch(() => {
				response = `${res.status} ${res.statusText}`;
			}),
	);
</script>

<details class="main">
	<summary class="col">
		<span class="row" style="justify-content:start;gap:.5em;">
			<span class="method">{method}</span>
			<span class="col" style="align-items:start;">
				<span class="route"><code><a href={tempRoute}>{route}</a></code></span>
				<span class="method-description">{description}</span>
			</span>
			<span
				style="align-self:center;margin-right:1em;cursor:pointer;user-select:none"
				>Try</span
			>
		</span>
	</summary>
	<span>
		<hr />
		<span class="col" style="gap:.3em;align-items:start">
			{#each scopeArgs as arg}
				<details class="args-details">
					<summary class="row" style="justify-content:space-between">
						<span style="cursor:pointer">{arg.name}</span>
						<input
							bind:value={arg.value}
							placeholder={arg.default}
							list={arg.name}
							class:wrong={arg.required && !arg.value}
						/>
						{#if arg.possibleValues}
							<datalist id={arg.name}>
								{#each arg.possibleValues as possibleValue}
									<option value={possibleValue}></option>
								{/each}
							</datalist>
						{/if}
					</summary>
					<span>{@html arg.explanation}</span>
				</details>
			{:else}
				<span>No arguments</span>
			{/each}
			<span>
				<button onclick={tryRoute}>Send Request</button>
				{tempRoute}
			</span>
		</span>
		<pre class="response">{response}</pre>
	</span>
</details>

<style>
	details.main {
		background-color: #1f1f1f;
		border-radius: 0.5em;
		margin: 1em 0.1em;
		padding: 1em 0.5em;
	}
	.method {
		font-weight: bold;
		font-size: 1.2em;
		background-color: #37f12d8e;
		border-radius: 0.4em;
		padding: 0.3em 1.5em;
		vertical-align: middle;
	}
	.method-description {
		font-size: 0.8em;
		color: #fff8;
	}
	.response {
		max-height: 50dvh;
		overflow-y: scroll;
		margin-bottom: 0;
		background-color: #000;
	}
	.wrong {
		border-color: red;
	}
	input,
	button {
		background-color: #1f1f1f;
		color: #f1f1f1;
		border-color: #5f5f5f;
		font-size: 1em;
		border-radius: 0.3em;
	}
	details.args-details {
		display: contents;
	}
	details[open].args-details > summary > span:before {
		content: "▾ ";
	}
	details.args-details > summary > span:before {
		content: "▸ ";
	}
</style>
