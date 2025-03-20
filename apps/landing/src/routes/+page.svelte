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
			<div class="w-fit mx-auto md:ml-0 scale-85 md:scale-100">
				<a
				 	href="https://github.com/AbdelH2O/blokbustr"
					target="_blank"
					rel="noopener noreferrer"
					aria-label="GitHub"
					aria-describedby="GitHub"
					class="bg-primary text-background group flex flex-row p-2 px-4 pr-5 font-medium transition-all hover:pr-3"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="18"
						height="14"
						class="my-auto mr-2">
						<path
							d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Zm0 2.445L6.615 5.5a.75.75 0 0 1-.564.41l-3.097.45 2.24 2.184a.75.75 0 0 1 .216.664l-.528 3.084 2.769-1.456a.75.75 0 0 1 .698 0l2.77 1.456-.53-3.084a.75.75 0 0 1 .216-.664l2.24-2.183-3.096-.45a.75.75 0 0 1-.564-.41L8 2.694Z"
						></path>
					</svg>
					Star us on GitHub
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
				</a>
			</div>
			<div>
				<h1
					class="leading-16 select-none text-center text-5xl font-normal text-white md:text-start"
				>
					Blockchain forensics <span class="bg-primary text-background font-bold">unlocked</span>
				</h1>
			</div>
			<div>
				<p class="text-primary select-none text-center text-xl font-normal md:text-start">
					Join our waitlist to be the first to know when we launch.
				</p>
			</div>
			<div class="flex flex-row items-center justify-center gap-4 md:justify-start">
				<div
					class="flex w-full flex-col items-center justify-between gap-4 md:w-fit md:flex-row md:gap-0"
				>
					<input
						bind:value={email}
						type="text"
						class="bg-background box-border w-full border py-2 pl-2 outline-0 md:w-60 md:border-r-0"
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
