<script lang="ts">
	import { onMount } from "svelte";
	import Btn from "$components/Btn.svelte";
	import Window from "./Window.svelte";
	const MAX_DURATION = 30; // 30 seconds
	let tick = 0;
	let duration = 30;
	$: fillPercentage = (Math.min(tick, duration) / duration) * 100;

	onMount(() => {
		const inv = setInterval(() => {
			tick = tick + 0.1;
			tick = Math.min(tick, MAX_DURATION);
		}, 100);

		return () => clearInterval(inv);
	});
</script>

<Window class="w-96">
	<h5 slot="title">Timer</h5>
	<div class="flex flex-col p-2 gap-3">
		<div>
			<label for="default-range" class="inline-block text-sm w-1/3">
				Elapsed: {Math.round(Math.min(tick, duration) * 10) / 10} s
			</label>
			<div
				class="inline-block w-3/5 h-2 bg-gray-200 rounded-lg dark:bg-gray-700"
			>
				<div
					class="bg-blue-600 h-2.5 rounded-full"
					style={`width: ${fillPercentage}%`}
				></div>
			</div>
		</div>

		<div>
			<label for="default-range" class="inline-block text-sm w-1/3"
				>Duration: {duration} s
			</label>
			<input
				id="default-range"
				type="range"
				bind:value={duration}
				min="0"
				max="30"
				class="w-3/5 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
			/>
		</div>
		<Btn on:click={() => (tick = 0)}>Reset</Btn>
	</div>
</Window>
