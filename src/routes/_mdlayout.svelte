<script lang="ts">

	// @ts-expect-error: type for title is assigned by sveltekit
	export let title: string
</script>

<svelte:head>
	<title>{title ? title + " - " : ""}Ashim Sedhain</title>
</svelte:head>

<slot />
