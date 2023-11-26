<!--
  @component
  Generates an SVG bar chart.
 -->
<script>
	import { getContext } from "svelte";

	const { data, xGet, yGet, xScale } = getContext("LayerCake");

	/** @type {String} [fill='#00bbff'] - The shape's fill color. This is technically optional because it comes with a default value but you'll likely want to replace it with your own color. */
	export let medianStroke = "#00bbff";
	export let meanStroke = "#f63b3b80";
	export let radius = 4;

	$: isBandwidth = typeof $xScale.bandwidth === "function";
</script>

<g class="circle-group">
	{#each $data as d, i}
		{@const [median, mean, _std, max, min] = $yGet(d)}
		{@const xPoint = isBandwidth
			? $xScale.bandwidth() / 2 + $xGet(d)
			: $xGet(d)}
		<circle
			class="group-median-circle"
			data-id={i}
			cx={xPoint}
			cy={median}
			r={radius}
			stroke={medianStroke}
			stroke-width={2}
			fill="none"
		/>

		<circle
			class="group-mean-circle"
			data-id={i}
			cx={xPoint}
			cy={mean}
			r={radius}
			stroke={meanStroke}
			stroke-width={2}
			fill="none"
		/>
		<line
			x1={xPoint}
			x2={xPoint}
			y1={min}
			y2={max}
			stroke={medianStroke}
			stroke-width={2}
		/>
	{/each}
</g>
