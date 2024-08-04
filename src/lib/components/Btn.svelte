<script lang="ts">
</script>

<button
	class={`btn btn-primary btn-primary:hover ${$$props.class}`}
	{...$$props}
	on:click
>
	<slot></slot>
</button>

<style>
	.btn {
		@apply font-bold py-1 px-2 rounded;
	}
	.btn-primary {
		@apply bg-indigo-500 text-white;
	}
	.btn-primary:hover {
		@apply bg-indigo-800;
	}
	.btn:disabled {
		@apply bg-gray-300;
		@apply text-gray-400;
	}
</style>
