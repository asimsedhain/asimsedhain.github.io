<div
	class={`flex flex-col border-gray-300 border-2 rounded-md ${$$props.class}`}
>
	<div
		class="border-gray-300 border-b-2 h-10 w-auto flex flex-col justify-center items-center"
	>
		<slot name="title"></slot>
	</div>
	<slot></slot>
</div>
