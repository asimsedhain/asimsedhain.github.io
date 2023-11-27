import { PostStatus, type PostMeta } from "$lib/types"

export function getPosts(): PostMeta[] {
	const prefix = "/src/routes/"
	const suffix = "/+page.md"
	const allPostFiles = import.meta.glob("/src/routes/*/+page.md", { eager: true })


	const allPosts = Object.entries(allPostFiles).map(([path, post]: [string, { metadata: PostMeta }]) => {
		const postPath = path.slice(prefix.length, -suffix.length)
		return { ...post.metadata, path: postPath }
	}).filter(post => {
		const status = post.status.toUpperCase()
		return status === PostStatus.Published || status === PostStatus.Draft
	})

	const posts = allPosts.sort((a, b) => parseMonthDayYearFormat(b.date).getTime() - parseMonthDayYearFormat(a.date).getTime())

	return posts
}


export function parseMonthDayYearFormat(dateString: string): Date {
	// example: Apr 20, 2022

	// Split the input string into its components
	const [monthAbbreviation, date, year] = dateString.split(" ")

	const monthNumber = monthAbbreviationToIndex(monthAbbreviation)
	const dateNumber = parseInt(date.slice(0, -1), 10) // Date number
	const yearNumber = parseInt(year, 10) // Year number

	// Create a JavaScript Date object
	const parsedDate = new Date(yearNumber, monthNumber, dateNumber)

	return parsedDate
}

// Function to convert 3-letter month abbreviation to month index (0-11)
function monthAbbreviationToIndex(abbreviation: string) {
	const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
	return months.indexOf(abbreviation) + 1
}


export function longestCommonPrefix(strs: string[]): string {
	if (strs.length === 0) {
		return ""
	}

	let prefix = strs[0]
	for (let i = 1; i < strs.length; i++) {
		while (strs[i].indexOf(prefix) !== 0) {
			prefix = prefix.substring(0, prefix.length - 1)
			if (prefix.length === 0) {
				return ""
			}
		}
	}
	return prefix
}

export function longestCommonSuffix(strs: string[]): string {
	if (strs.length === 0) {
		return ""
	}

	let suffix = strs[0]
	for (let i = 1; i < strs.length; i++) {
		while (strs[i].substring(strs[i].length - suffix.length) !== suffix) {
			suffix = suffix.substring(1)
			if (suffix.length === 0) {
				return ""
			}
		}
	}
	return suffix
}

