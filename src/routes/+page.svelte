<script lang="ts">
	import { base } from "$app/paths";

	export let data;
</script>

<svelte:head>
	<title>Ashim Sedhain</title>
</svelte:head>

<h1 class="font-bold my-5">🏗️ Eternally Under Construction</h1>

<p>
	👋 Hello, I'm Ashim, a software engineer with a passion for coding. When I'm
	not immersed in my work, I like to experiment with different open source
	projects in my home lab. I also value staying active, whether through
	workouts or leisurely walks.
</p>

<p>
	Recently, I've been learning Rust, particularly its integration with C using
	FFI. Feel free to explore some of my thoughts on this below.
</p>

<h2>Ramblings</h2>

<ul class="my-5">
	{#each data.posts as post}
		<li>
			<a href="{base}/{post.path}">{post.title}</a>
		</li>
	{/each}
</ul>
