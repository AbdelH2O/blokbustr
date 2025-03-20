<script>
	import icon from "$lib/assets/icon.png";
	import cover from "$lib/assets/cover.png";

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
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<meta name="description" content="Blokbustr: open-source blockchain intelligence" />
	<meta name="keywords" content="blockchain, intelligence, open-source" />
	<meta name="author" content="Blokbustr Team" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content="Blokbustr: open-source blockchain intelligence" />
	<meta property="og:image" content={cover} />
	<meta property="og:url" content="https://blokbustr.com" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Blokbustr" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content="Blokbustr: open-source blockchain intelligence" />
	<meta name="twitter:image" content={cover} />
	<meta name="twitter:site" content="@blokbustr" />
	<meta name="twitter:creator" content="@blokbustr" />
	<meta name="theme-color" content="#0A192F" />
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