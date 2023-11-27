import type { Measurement } from "$lib/types"
import type { PageLoad } from "./$types"
import { longestCommonPrefix, longestCommonSuffix } from "$lib/utils"
import dashmapRawData from "./dashmap-benchmarks.json"
import rtrbRawData from "./rtrb-benchmarks.json"
import instrumentUserRawData from "./instruments-user-join-benchmarks.json"

type PageData = {
	dashmapChartData: Measurement[],
	rtrbChartData: Measurement[],
	instrumentUserChartData: Measurement[],
}

export const load: PageLoad<PageData> = async () => {
	return { dashmapChartData: processHyperfineJson(dashmapRawData), rtrbChartData: processHyperfineJson(rtrbRawData), instrumentUserChartData: processHyperfineJson(instrumentUserRawData) }
}

function processHyperfineJson(rawData: typeof dashmapRawData): Measurement[] {
	const commandArray = rawData.results.map(entry => entry.command)
	const prefixLen = longestCommonPrefix(commandArray).length
	const suffixLen = longestCommonSuffix(commandArray).length

	return rawData.results.map((entry) => {
		const command = entry.command
		const end = command.length - suffixLen
		return ({ group: command.substring(prefixLen, end), median: entry.median, mean: entry.mean, stddev: entry.stddev, max: entry.max, min: entry.min })
	})
}
