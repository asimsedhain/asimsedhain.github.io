import type { PageLoad } from "./$types"
import { getPosts } from "$lib/utils"
import type { PostMeta } from "$lib/types"


export const load: PageLoad<{ posts: PostMeta[] }> = async () => {
	return { posts: getPosts() }
}
