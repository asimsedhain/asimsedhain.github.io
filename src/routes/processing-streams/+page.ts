import type { Measurement } from "$lib/types"
import type { PageLoad } from "./$types"
import { longestCommonPrefix, longestCommonSuffix } from "$lib/utils"
import rawData from "./dashmap-benchmarks.json"

export const load: PageLoad<{ chartData: Measurement[] }> = async () => {
	const commandArray = rawData.results.map(entry => entry.command)
	const prefixLen = longestCommonPrefix(commandArray).length
	const suffixLen = longestCommonSuffix(commandArray).length

	const data = rawData.results.map((entry) => {
		const command = entry.command
		const end = command.length - suffixLen
		return ({ group: command.substring(prefixLen, end), median: entry.median, mean: entry.mean, stddev: entry.stddev, max: entry.max, min: entry.min })
	})
	return { chartData: data }
}
