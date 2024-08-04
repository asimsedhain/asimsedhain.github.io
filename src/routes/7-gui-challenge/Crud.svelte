<script lang="ts">
	import Btn from "$components/Btn.svelte";
	import Window from "./Window.svelte";
	type User = {
		id: number;
		name: string;
		surname: string;
	};
	let users: User[] = [
		{ id: 1, name: "Hans", surname: "Emil" },
		{ id: 2, surname: "Mustermann", name: "Max" },
		{ id: 3, surname: "Tisch", name: "Roman" },
	];

	let filter: string = "";

	$: filteredUsers = users.filter(
		(user) =>
			user.name.toLowerCase().includes(filter.toLowerCase()) ||
			user.surname.toLowerCase().includes(filter.toLowerCase()),
	);

	let selectedName: string = "";
	let selectedSurname: string = "";
	let selectedId: number | undefined = undefined;
</script>

<Window class="w-2/3">
	<h5 slot="title">CRUD</h5>
	<div class="p-2">
		<div class="flex flex-row p-2 flex-auto justify-evenly items-center">
			<label for="filter">Filter</label>
			<input id="filter" type="text" bind:value={filter} />
		</div>
		<div class="flex flex-row p-2 w-full justify-between">
			<div>
				<select
					size="3"
					class="w-52"
					on:change={(ev) => {
						const id = Number(ev.currentTarget.value);
						const foundUser = users.find((user) => user.id === id);
						if (foundUser) {
							selectedName = foundUser.name;
							selectedSurname = foundUser.surname;
							selectedId = foundUser.id;
						}
					}}
				>
					{#each filteredUsers as user}
						<option value={user.id}
							>{user.surname}, {user.name}</option
						>
					{/each}
				</select>
			</div>
			<div class="table">
				<div class="table-row">
					<label for="name" class="table-cell"> Name: </label>
					<input id="name" type="text" bind:value={selectedName} />
				</div>
				<div class="table-row">
					<label for="surname" class="table-cell"> Surname: </label>
					<input
						id="surname"
						type="text"
						bind:value={selectedSurname}
					/>
				</div>
			</div>
		</div>
		<div class="flex flex-row gap-2">
			<Btn>Create</Btn>
			<Btn>Update</Btn>
			<Btn>Delete</Btn>
		</div>
	</div>
</Window>
