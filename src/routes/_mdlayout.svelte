<script>
	/**
	 * @type {string}
	 */
	export let title

	/**
	 * @type {string}
	 */
	export let date
</script>

<svelte:head>
	<title>{title ? title + " - " : ""}Ashim Sedhain</title>
</svelte:head>

<h5 class="md-5 mt-5 dark:text-cyan-50 text-gray-500">{date}</h5>
<slot />
