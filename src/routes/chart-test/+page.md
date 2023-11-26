---
title: "Testing charts"
date: Nov 04, 2023
---

<script lang="ts">
	import WhiskerPlotClient from "$components/chart/WhiskerPlot.client.svelte";
    import rawData from "./bench.json"
    import {longestCommonPrefix, longestCommonSuffix} from "$lib/utils"

    const commandArray = rawData.results.map(entry=>entry.command)
    const prefixLen = longestCommonPrefix(commandArray).length
    const suffixLen = longestCommonSuffix(commandArray).length

    const data = rawData.results.map((entry) => {
        const command = entry.command
        const end = command.length - suffixLen
        return ({ ...entry, group: command.substring(prefixLen, end) })
    })
    
</script>

# {title}



<WhiskerPlotClient {data} />
