<script>
	export let title;
</script>

<svelte:head>
	<title>{title ? title + " - " : ""}Ashim Sedhain</title>
</svelte:head>

<slot />
