<script lang="ts">
	import Btn from "$components/Btn.svelte";
	import Window from "./Window.svelte";
	let startFlight = new Date().toISOString().split("T")[0];
	let returnFlight = new Date().toISOString().split("T")[0];
	type FlightType = "one-way" | "two-way";
	let flightType: FlightType;

	function parseDate(dateString: string): Date {
		let [year, month, day] = dateString.split("-").map(Number);

		const inputDate: Date = new Date();
		inputDate.setFullYear(year, month - 1, day);
		inputDate.setHours(0, 0, 0, 0);
		return inputDate;
	}

	function isTodayOrFuture(dateString: string): boolean {
		const inputDate = parseDate(dateString);

		const currentDate: Date = new Date();
		currentDate.setHours(0, 0, 0, 0);

		return inputDate >= currentDate;
	}

	$: isStartFlightValid = isTodayOrFuture(startFlight);
	$: isReturnFlightValid =
		flightType == "one-way" ||
		(isTodayOrFuture(returnFlight) &&
			parseDate(startFlight) < parseDate(returnFlight));
</script>

<Window class="w-96">
	<h5 slot="title">Flight Booker</h5>
	<div class="p-2 flex flex-col gap-3">
		<select bind:value={flightType}>
			<option value="one-way">One-way flight</option>
			<option value="two-way">Two-way flight</option>
		</select>
		<input
			type="date"
			bind:value={startFlight}
			class:bg-red-200={!isStartFlightValid}
		/>
		<input
			type="date"
			bind:value={returnFlight}
			disabled={flightType == "one-way"}
			class="disabled:text-gray-400 disabled:bg-gray-300"
			class:bg-red-200={!isReturnFlightValid}
		/>
		<Btn disabled={!isStartFlightValid || !isReturnFlightValid}>Book</Btn>
	</div>
</Window>
