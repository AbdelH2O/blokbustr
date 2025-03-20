<script lang="ts">
	let email = $state('');
	let isValid = $state(false);
	$effect(() => {
		if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
			isValid = true;
		} else {
			isValid = false;
		}
		console.log(isValid);
	});

	function handleSubmit() {
		// if (browser) {
		// 	fetch('https://api.example.com/submit', {
		// 		method: 'POST',
		// 		body: JSON.stringify({ email }),
		// 		headers: {
		// 			'Content-Type': 'application/json'
		// 		}
		// 	})
		// 		.then((response) => response.json())
		// 		.then((data) => {
		// 			console.log(data);
		// 			goto('/thank-you');
		// 		});
		// }
	}
</script>

<div class="mx-auto flex w-9/12 grow items-center justify-center bg-transparent">
	<div class="container h-3/4">
		<div class="flex h-full flex-col justify-center gap-4">
			<div class="rrr-xl w-fit shadow-md">
				<button
					disabled={true}
					class="rrr-xl bg-primary text-background group flex flex-row p-2 px-4 pr-5 font-medium transition-all hover:pr-3 disabled:cursor-not-allowed"
				>
					Try before signing up
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="18"
						height="14"
						class="my-auto ml-4 transition-all group-hover:ml-6"
					>
						<path
							fill="none"
							fill-rule="evenodd"
							stroke="#0A192F"
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M1 7h16M11 1l6 6-6 6"
						/>
					</svg>
				</button>
			</div>
			<div>
				<h1
					class="leading-16 select-none text-center text-5xl font-normal text-white md:text-start"
				>
					Blockchain forensics <span class="bg-primary text-background font-bold"
						>unlocked</span
					>
				</h1>
			</div>
			<div>
				<p class='text-primary select-none text-center text-xl font-normal md:text-start'>
					Join our waitlist to be the first to know when we launch.
				</p>
			</div>
			<div class="flex flex-row items-center gap-4">
				<div class="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-0">
					<input
						bind:value={email}
						type="text"
						class="bg-background md:rrr-r-none box-border w-60 border py-2 pl-2 outline-0 md:border-r-0"
					/>
					<button
						disabled={!isValid}
						onclick={handleSubmit}
						class="border-primary bg-primary text-background cursor-pointer border px-4 py-2 font-medium transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-75"
						>Join the waitlist</button
					>
				</div>
			</div>
		</div>
	</div>
</div>
