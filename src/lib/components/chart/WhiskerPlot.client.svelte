<script context="module" lang="ts">
	type Measurement = {
		group: string;
		median: number;
		mean: number;
		std: number;
		max: number;
		min: number;
	};
</script>

<script lang="ts">
	import { LayerCake, Svg } from "layercake";
	import { scaleBand } from "d3-scale";
	import AxisX from "./AxisX.svg.svelte";
	import AxisY from "./AxisY.svg.svelte";
	import Whisker from "./Whisker.svg.svelte";

	export let data: Measurement[];

	const y: (keyof Measurement)[] = ["median", "mean", "std", "max", "min"];
</script>

<div class="chart-container">
	<LayerCake
		padding={{ top: 30, right: 20, bottom: 10, left: 30 }}
		x="group"
		{y}
		xScale={scaleBand().paddingInner(0.028).round(true)}
		xDomain={data.map((entry) => entry.group)}
		yPadding={[20, 20]}
		{data}
	>
		<Svg>
			<AxisX gridlines={true} baseline={true} />
			<AxisY gridlines={true} />
			<Whisker />
		</Svg>
	</LayerCake>
</div>

<style>
	/*
    The wrapper div needs to have an explicit width and height in CSS.
    It can also be a flexbox child or CSS grid element.
    The point being it needs dimensions since the <LayerCake> element will
    expand to fill it.
  */
	.chart-container {
		width: 100%;
		height: 300px;
	}
</style>
