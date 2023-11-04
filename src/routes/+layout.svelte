<script lang="ts">
	import "../app.css";
	import NavBar from "$lib/components/NavBar.svelte";
	import Year from "$lib/components/Year.svelte";
</script>

<svelte:head>
	<link
		rel="icon"
		href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🐸</text></svg>"
	/>
</svelte:head>

<NavBar />

<main id="top">
	<div class="content">
		<slot />
	</div>
</main>

<footer>
	<p>
		Ashim Sedhain &copy; <Year from={2020} />
	</p>
</footer>
