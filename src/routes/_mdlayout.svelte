<script lang="ts">
	// @ts-ignore
	export let title;

	// @ts-ignore
	$: titleTs = title as string;
</script>

<svelte:head>
	<title>{titleTs ? titleTs + " - " : ""}Ashim Sedhain</title>
</svelte:head>

<slot />
