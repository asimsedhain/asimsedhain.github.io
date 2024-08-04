<script lang="ts">
	import Window from "./Window.svelte";
	let cel: number | undefined = undefined;
	let fah: number | undefined = undefined;

	const f = (celsius?: number) => {
		let rawFah =
			celsius && !isNaN(celsius) ? celsius * (9 / 5) + 32 : undefined;

		fah = rawFah ? Math.round(rawFah * 100) / 100 : undefined;
	};

	const fInv = (fahrenheit?: number) => {
		let rawCel =
			fahrenheit && !isNaN(fahrenheit)
				? (fahrenheit - 32) * (5 / 9)
				: undefined;
		cel = rawCel ? Math.round(rawCel * 100) / 100 : undefined;
	};

	$: f(cel);

	$: fInv(fah);
</script>

<Window class="w-96">
	<h5 slot="title">Temp Converter</h5>
	<div class="flex flex-row p-2 flex-auto justify-evenly items-center">
		<input type="number" class="w-24" bind:value={cel} /> Celsius =
		<input type="number" class="w-24" bind:value={fah} /> Fahrenheit
	</div>
</Window>
