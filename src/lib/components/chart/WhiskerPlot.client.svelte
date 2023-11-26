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

<div class="w-full h-80 mb-16">
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
