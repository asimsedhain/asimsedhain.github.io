<script lang="ts">
	import { base } from "$app/paths";

	export let data;
</script>

<svelte:head>
	<title>Ashim Sedhain</title>
</svelte:head>

<h1 class="font-bold my-5">🏗️ Eternally Under Construction</h1>

<p>👋 Hello, I'm Ashim.</p>

<ul>
	<li>I like coding.</li>
	<li>
		I am currently working as a software engineer for a HFT trading firm.
	</li>
	<li>
		I like working on my homelab - trying to make my home into a smart home
		one automation at a time.
	</li>
	<li>I like to stay active.</li>
</ul>

<p>
	Recently, I've been learning Rust, particularly its integration with C using
	FFI. Feel free to explore some of my thoughts on this below.
</p>

<h2>Ramblings</h2>

<ul class="my-5">
	{#each data.posts as post}
		<li class="my-2">
			<a href="{base}/{post.path}"> {post.title} </a>
			<span class="text-gray-500 dark:text-gray-600">
				( {post.date} )
			</span>
		</li>
	{/each}
</ul>
