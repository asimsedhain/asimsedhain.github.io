<!--
  @component
  Generates an SVG bar chart.
 -->
<script>
	import { getContext } from "svelte";

	const { data, xGet, yGet, xScale, yScale } = getContext("LayerCake");

	/** @type {String} [fill='#00bbff'] - The shape's fill color. This is technically optional because it comes with a default value but you'll likely want to replace it with your own color. */
	export let fill = "#00bbff";
</script>

<g class="circle-group">
	{#each $data as d, i}
		<circle
			class="group-circle"
			data-id={i}
			cx={$xGet(d)}
			cy={$yGet(d)}
			r={2}
			{fill}
		/>
	{/each}
</g>
