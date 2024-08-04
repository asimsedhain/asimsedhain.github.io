<script lang="ts">
	import Btn from "$components/Btn.svelte";
	import Window from "./Window.svelte";
	let count = 0;
</script>

<Window class="w-96">
	<h5 slot="title">Counter</h5>
	<div class="flex flex-row p-2 flex-auto justify-evenly items-center">
		<div>
			<span>{count}</span>
		</div>
		<Btn on:click={() => count++}>Increment</Btn>
	</div>
</Window>
