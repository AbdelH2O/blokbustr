<script>
	import icon from "$lib/assets/icon.png";

	export let title = "blokbustr";
	export let logoAlt = "Logo";
	export let links = [
		// { href: "/", text: "Home" },
		{ href: "#", text: "About" },
		{ href: "#", text: "Contact" }
	];
</script>

<svelte:head>
	<title>{title}</title>
	<link rel="icon" href={icon} />
</svelte:head>

<nav class="flex items-center justify-between p-4 bg-background border-b border-primary/50">
	<div class="flex items-center">
		<a href="/">
			<img src={icon} alt={logoAlt} class="h-12 mr-2" />
		</a>
	</div>
	<ul class="flex space-x-4">
		{#each links as link}
			<li>
				<a href={link.href} class="text-primary hover:text-background hover:bg-primary p-2">
					{link.text}
				</a>
			</li>
		{/each}
	</ul>
	<div class="ml-auto ">
		<a href="#" class="bg-primary text-background p-2">Login</a>
		<a href="#" class="bg-primary text-background p-2">Sign Up</a>
	</div>
</nav>