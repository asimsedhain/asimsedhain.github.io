<script lang="ts">
	import { LayerCake, Svg } from "layercake";
	import { scaleBand } from "d3-scale";
	import AxisX from "./AxisX.svg.svelte";
	import AxisY from "./AxisY.svg.svelte";
	import Whisker from "./Whisker.svg.svelte";

	const data = [
		{ group: "naive-std-hash", median: 1.2 },
		{ group: "naive-dash-hash", median: 1.4 },
		{ group: "thread-std-hash-std-channel", median: 1.1 },
		{ group: "thread-dash-hash-std-channel", median: 1 },
	];
</script>

<div class="chart-container">
	<LayerCake
		padding={{ top: 0, right: 20, bottom: 20, left: 25 }}
		x="group"
		y="median"
		xScale={scaleBand().paddingInner(0.028).round(true)}
		xDomain={data.map((entry) => entry.group)}
		yDomain={[0, null]}
		{data}
	>
		<Svg>
			<AxisX gridlines={true} baseline={true} snapTicks={true} />
			<AxisY gridlines={false} />
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
		height: 250px;
	}
</style>
