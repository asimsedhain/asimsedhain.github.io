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
