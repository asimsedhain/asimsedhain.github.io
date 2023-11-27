export enum PostStatus {
	Draft = "DRAFT",
	Published = "PUBLISHED",
	Test = "TEST"
}
export interface PostMeta {
	title: string,
	date: string,
	badges: string[],
	status: PostStatus,
	excerpt?: string,
	[extra: string]: unknown
}

export type Measurement = {
	group: string;
	median: number;
	mean: number;
	stddev: number;
	max: number;
	min: number;
};
