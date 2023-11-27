---
title: "Testing charts"
date: Nov 04, 2023
status: Test
---

<script lang="ts">
	import WhiskerPlotClient from "$components/chart/WhiskerPlot.svelte";
    export let data;

</script>

# {title}


<WhiskerPlotClient data={data.chartData} />
