<script>
let {
	name,
	selectedOption = $bindable(),
	options = [],
	justifyContent = "",
} = $props();
</script>

<div class="force-row rb-container" style="justify-content: {justifyContent};">
	<div class="force-row">
		{#each options as option}
			<input
				type="radio"
				{name}
				value={option.toLowerCase()}
				id={option.toLowerCase()}
				bind:group={selectedOption}
			/>
			<label
				for={option.toLowerCase()}
				class:selected={option.toLowerCase() === selectedOption}>{option}</label
			>
		{/each}
	</div>
</div>

<style>
	div > div {
		background: #0004;
		border-radius: 8px;
	}
	input {
		display: none;
	}
	label {
		padding: 0.6em;
		border-right: #fff2 solid 1px;
	}
	label:last-child {
		border-right: unset;
	}

	.selected {
		background: #0004;
		outline: #fffe solid 2px;
		border-radius: 4px;
	}
	.force-row {
		width: fit-content;
	}
	.rb-container {
		min-width: 33.3%;
	}
</style>
