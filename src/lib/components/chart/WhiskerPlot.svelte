<script lang="ts">
	import type { Measurement } from "$lib/types";
	import { LayerCake, Svg, Html } from "layercake";
	import { scaleBand } from "d3-scale";
	import AxisX from "./AxisX.svg.svelte";
	import AxisY from "./AxisY.svg.svelte";
	import Whisker from "./Whisker.svg.svelte";
	import Tooltip from "./WhiskerTooltip.html.svelte";

	export let data: Measurement[];

	const y: (keyof Measurement)[] = ["median", "mean", "stddev", "max", "min"];
	$: yDomain = [
		Math.min(...data.map((d) => d.min)),
		Math.max(...data.map((d) => d.max)),
	];

	function formatTick(tick: number) {
		return tick + "s";
	}
</script>

<div class="w-full h-80 mb-16 py-5">
	<LayerCake
		padding={{ left: 30 }}
		x="group"
		{y}
		xScale={scaleBand().paddingInner(0.028).round(true)}
		xDomain={data.map((entry) => entry.group)}
		yPadding={[20, 20]}
		{yDomain}
		{data}
	>
		<Html>
			<Tooltip />
		</Html>
		<Svg>
			<AxisX gridlines={true} baseline={true} />
			<AxisY gridlines={true} {formatTick} />
			<Whisker />
		</Svg>
	</LayerCake>
</div>
