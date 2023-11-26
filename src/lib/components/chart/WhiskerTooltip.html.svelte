<!--
  @component
  Generates a hover tooltip. It creates a slot with an exposed variable via `let:detail` that contains information about the event. Use the slot to populate the body of the tooltip using the exposed variable `detail`.
 -->
<script lang="ts">
	import { getContext } from "svelte";
	import type { Measurement } from "$lib/types";

	// @ts-ignore
	const { data, xGet, yGet, xScale } = getContext("LayerCake");

	let selectedDataPoint: Measurement | null = null;

	/** @type {Number} [offset=-15] - A y-offset from the hover point, in pixels. */
	export let offset: number = -15;
	$: isBandwidth = typeof $xScale.bandwidth === "function";

	function formatValue(value: number | string) {
		if (typeof value === "string") {
			return value;
		}
		return value.toFixed(2);
	}
</script>

{#if selectedDataPoint}
	{@const xPoint = isBandwidth
		? $xScale.bandwidth() / 2 + $xGet(selectedDataPoint)
		: $xGet(selectedDataPoint)}
	{@const [median, _mean, _std, _max, _min] = $yGet(selectedDataPoint)}
	<div
		class="tooltip"
		style="
      top:{median + offset}px;
      left:{xPoint}px;
    "
	>
		{#each Object.entries(selectedDataPoint) as [key, value]}
			<div>
				<span class="font-bold">{key}:</span>
				{formatValue(value)}
			</div>
		{/each}
	</div>
{/if}

{#each $data as d}
	{@const xPoint = isBandwidth
		? $xScale.bandwidth() / 2 + $xGet(d)
		: $xGet(d)}
	{@const [median, _mean, _std, _max, _min] = $yGet(d)}
	<div
		class="hover-points"
		style="
		top:{median + offset}px;
        left:{xPoint}px;
    "
		on:mouseenter={(_e) => {
			selectedDataPoint = d;
		}}
		on:mouseleave={(_e) => {
			selectedDataPoint = null;
		}}
	/>
{/each}

<style>
	.tooltip {
		@apply bg-gray-100 bg-opacity-90;
		@apply dark:bg-gray-900 dark:bg-opacity-90;
		@apply text-base p-2;

		position: absolute;
		width: 180px;
		border: 1px solid #ccc;
		z-index: 10;
		transform: translate(-50%, -100%);
	}
	.hover-points {
		position: absolute;
		z-index: 15;
		width: 40px;
		height: 40px;
		transform: translateX(-50%);
	}
</style>
