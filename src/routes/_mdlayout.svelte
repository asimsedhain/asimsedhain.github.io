<script lang="ts">
	// @ts-expect-error: type for title is assigned by sveltekit
	export let title: string

	export let date: string
</script>

<svelte:head>
	<title>{title ? title + " - " : ""}Ashim Sedhain</title>
</svelte:head>

<h5 class='md-5 mt-5 dark:text-cyan-50 text-gray-500'>{date}</h5>
<slot />
