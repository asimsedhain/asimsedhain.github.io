export interface PostMeta {
	title: string,
	date: string,
	badges: string[],
	excerpt?: string,
	[extra: string]: unknown
}
